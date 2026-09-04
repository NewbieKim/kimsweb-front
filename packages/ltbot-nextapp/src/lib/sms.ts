// sms:短信验证码相关的逻辑
import { prisma } from '@/lib/prisma';

export type SmsScene = 'register' | 'forgot';

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const MOCK_CODE = '123456';
const SEND_INTERVAL_MS = 60 * 1000;
const MAX_DAILY_COUNT = 5;
const SMS_VALID_SECONDS = 300;
const SMS_INTERVAL_SECONDS = 60;
const SMS_CODE_LENGTH = 6;
const SMS_TEMPLATE_PARAM = '{"code":"##code##","min":"5"}';

export class SmsError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'SmsError';
  }
}

export function isMockSmsMode(): boolean {
  const configured = process.env.SMS_MOCK_MODE;
  if (configured) {
    return configured === 'true';
  }
  // 非生产环境默认 mock 验证码 123456；生产环境未显式开启时走真实短信。
  return process.env.NODE_ENV !== 'production';
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function isValidSmsScene(scene: string): scene is SmsScene {
  return scene === 'register' || scene === 'forgot';
}

export async function sendSmsCode(
  phone: string,
  scene: SmsScene,
  ip?: string
): Promise<{ expireInSeconds: number; smsLogId: number }> {
  if (!isValidPhone(phone)) {
    throw new SmsError('手机号格式错误', 400);
  }

  const now = new Date();
  const recent = await prisma.smsSendLog.findFirst({
    where: {
      phone,
      createdAt: {
        gte: new Date(now.getTime() - SEND_INTERVAL_MS),
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (recent) {
    throw new SmsError('发送过于频繁，请 60 秒后重试', 429);
  }

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dailyCount = await prisma.smsSendLog.count({
    where: {
      phone,
      createdAt: { gte: dayStart },
    },
  });
  if (dailyCount >= MAX_DAILY_COUNT) {
    throw new SmsError('今日发送次数已达上限', 429);
  }

  const outId = `phone_${scene}_${phone}_${Date.now()}`;
  const log = await prisma.smsSendLog.create({
    data: {
      phone,
      scene,
      outId,
      ip,
    },
  });

  if (isMockSmsMode()) {
    console.log(`[SMS MOCK] send ${scene} code to ${phone}: ${MOCK_CODE}`);
    return { expireInSeconds: SMS_VALID_SECONDS, smsLogId: log.id };
  }

  try {
    await sendViaAliyun(phone, outId);
  } catch (error) {
    await prisma.smsSendLog.delete({ where: { id: log.id } }).catch(() => undefined);
    throw error;
  }
  return { expireInSeconds: SMS_VALID_SECONDS, smsLogId: log.id };
}

export async function verifySmsCode(
  phone: string,
  code: string,
  scene: SmsScene
): Promise<boolean> {
  if (!isValidPhone(phone)) {
    throw new SmsError('手机号格式错误', 400);
  }

  if (isMockSmsMode()) {
    if (code !== MOCK_CODE) {
      throw new SmsError('验证码错误，请重新输入', 400);
    }
    return true;
  }

  const passed = await checkViaAliyun(phone, code, scene);
  if (!passed) {
    throw new SmsError('验证码错误或已过期', 400);
  }
  return true;
}

export async function markSmsVerified(
  phone: string,
  scene: SmsScene
): Promise<number> {
  const log = await prisma.smsSendLog.findFirst({
    where: { phone, scene },
    orderBy: { createdAt: 'desc' },
  });
  if (!log) {
    throw new SmsError('请先获取验证码', 400);
  }

  await prisma.smsSendLog.update({
    where: { id: log.id },
    data: { verifiedAt: new Date() },
  });
  return log.id;
}

type AliyunResultBody = {
  success?: boolean;
  code?: string;
  message?: string;
};

async function loadAliyunSdk() {
  const mod = await import('@alicloud/dypnsapi20170525');
  const Client = mod.default;
  if (!Client || !mod.SendSmsVerifyCodeRequest || !mod.CheckSmsVerifyCodeRequest) {
    throw new Error('阿里云短信 SDK 加载失败');
  }
  return mod;
}

function getAliyunClient(
  Client: (typeof import('@alicloud/dypnsapi20170525'))['default']
) {
  const accessKeyId = process.env.ALIBABA_ACCESS_KEY_ID?.trim();
  const accessKeySecret = process.env.ALIBABA_ACCESS_KEY_SECRET?.trim();
  if (!accessKeyId || !accessKeySecret) {
    throw new SmsError('短信服务未配置', 500);
  }
  return new Client({
    accessKeyId,
    accessKeySecret,
    endpoint: 'dypnsapi.aliyuncs.com',
  } as ConstructorParameters<typeof Client>[0]);
}

function resolveTemplateParam(): string {
  const raw = process.env.SMS_TEMPLATE_PARAM?.trim();
  if (!raw) {
    return SMS_TEMPLATE_PARAM;
  }
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    console.warn(
      '[SMS] SMS_TEMPLATE_PARAM 不是合法 JSON，已回退默认值。含 # 的值在 .env 里必须用单引号包起来。'
    );
    return SMS_TEMPLATE_PARAM;
  }
}

function mapAliyunError(code: string, rawMessage: string, fallback: string): string {
  const normalized = `${code} ${rawMessage}`.toLowerCase();
  if (normalized.includes('invalidaccesskeyid') || normalized.includes('specified access key')) {
    return '短信服务密钥无效，请到阿里云 RAM 核对 AccessKey 是否存在且已启用';
  }
  if (normalized.includes('signaturedoesnotmatch') || normalized.includes('incompletesignature')) {
    return '短信服务密钥不匹配，请核对 AccessKey Secret';
  }
  if (normalized.includes('function_not_opened')) {
    return '未开通号码认证短信功能，请到阿里云号码认证控制台开通短信认证';
  }
  if (normalized.includes('frequency_fail')) {
    return '发送过于频繁，请稍后再试';
  }
  if (normalized.includes('business_limit_control')) {
    return '今日发送次数已达上限';
  }
  if (normalized.includes('mobile_number_illegal')) {
    return '手机号格式错误';
  }
  if (normalized.includes('invalid_parameters')) {
    return '短信参数错误，请到号码认证控制台核对赠送签名和赠送模板';
  }
  if (normalized.includes('system internal error') || normalized.includes('isv.system_error')) {
    return '阿里云短信服务拒绝请求。请到号码认证控制台确认：已开通短信认证、签名来自「赠送签名」列表（不要抄文档示例）、模板来自「赠送模板」、账户余额充足';
  }
  return rawMessage || fallback;
}

function toSmsError(error: unknown, fallback: string): SmsError {
  if (error instanceof SmsError) {
    return error;
  }
  const err = error as {
    code?: string;
    message?: string;
    data?: { Code?: string; Message?: string; code?: string; message?: string };
  };
  const code = String(err.code || err.data?.Code || err.data?.code || '');
  const raw = String(err.message || err.data?.Message || err.data?.message || '');
  console.error('阿里云短信失败:', { code, message: raw });
  const status =
    code.includes('FREQUENCY') || code.includes('LIMIT') || code.includes('ILLEGAL')
      ? 429
      : 502;
  return new SmsError(mapAliyunError(code, raw, fallback), status);
}

function assertAliyunSuccess(body: AliyunResultBody | undefined, fallback: string): void {
  if (!body) {
    throw new SmsError(fallback, 502);
  }
  if (body.success === false || (body.code && body.code !== 'OK')) {
    throw toSmsError(
      { code: body.code, message: body.message },
      fallback
    );
  }
}

async function getLatestOutId(phone: string, scene: SmsScene): Promise<string | undefined> {
  const log = await prisma.smsSendLog.findFirst({
    where: {
      phone,
      scene,
      outId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
  });
  return log?.outId || undefined;
}

async function sendViaAliyun(phone: string, outId: string): Promise<void> {
  const signName = process.env.SMS_SIGN_NAME?.trim();
  const templateCode = process.env.SMS_TEMPLATE_CODE?.trim();
  if (!signName || !templateCode) {
    throw new SmsError('短信服务未配置', 500);
  }

  const { default: Client, SendSmsVerifyCodeRequest } = await loadAliyunSdk();
  const client = getAliyunClient(Client);
  try {
    const response = await client.sendSmsVerifyCode(
      new SendSmsVerifyCodeRequest({
        phoneNumber: phone,
        signName,
        templateCode,
        templateParam: resolveTemplateParam(),
        countryCode: '86',
        interval: SMS_INTERVAL_SECONDS,
        validTime: SMS_VALID_SECONDS,
        codeType: 1,
        codeLength: SMS_CODE_LENGTH,
        duplicatePolicy: 1,
        outId,
      })
    );
    assertAliyunSuccess(response.body, '短信发送失败');
  } catch (error) {
    throw toSmsError(error, '短信发送失败');
  }
}

async function checkViaAliyun(
  phone: string,
  code: string,
  scene: SmsScene
): Promise<boolean> {
  const { default: Client, CheckSmsVerifyCodeRequest } = await loadAliyunSdk();
  const client = getAliyunClient(Client);
  const outId = await getLatestOutId(phone, scene);
  try {
    const response = await client.checkSmsVerifyCode(
      new CheckSmsVerifyCodeRequest({
        phoneNumber: phone,
        verifyCode: code,
        countryCode: '86',
        caseAuthPolicy: 1,
        outId,
      })
    );
    assertAliyunSuccess(response.body, '验证码核验失败');
    return response.body?.model?.verifyResult === 'PASS';
  } catch (error) {
    throw toSmsError(error, '验证码核验失败');
  }
}

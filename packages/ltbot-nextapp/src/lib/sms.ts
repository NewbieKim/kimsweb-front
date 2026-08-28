// sms:短信验证码相关的逻辑
import { prisma } from '@/lib/prisma';

export type SmsScene = 'register' | 'forgot';

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const MOCK_CODE = '123456';
const SEND_INTERVAL_MS = 60 * 1000;
const MAX_DAILY_COUNT = 5;

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
    return { expireInSeconds: 300, smsLogId: log.id };
  }

  await sendViaAliyun(phone, scene, outId);
  return { expireInSeconds: 300, smsLogId: log.id };
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

type AliyunSmsClient = {
  sendSmsVerifyCode: (params: Record<string, unknown>) => Promise<unknown>;
  checkSmsVerifyCode: (
    params: Record<string, unknown>
  ) => Promise<{ model?: { verifyResult?: string } }>;
};

async function getAliyunClient(): Promise<AliyunSmsClient> {
  const mod = (await import('@alicloud/dypnsapi20170525')) as unknown as {
    default?: new (options: Record<string, unknown>) => AliyunSmsClient;
    Dypnsapi20170525?: new (options: Record<string, unknown>) => AliyunSmsClient;
  };
  const Ctor = mod.default || mod.Dypnsapi20170525;
  if (!Ctor) {
    throw new Error('阿里云短信 SDK 加载失败');
  }
  return new Ctor({
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
    endpoint: 'dypnsapi.aliyuncs.com',
  });
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

async function sendViaAliyun(phone: string, scene: SmsScene, outId: string): Promise<void> {
  const client = await getAliyunClient();
  await client.sendSmsVerifyCode({
    phoneNumber: phone,
    signName: process.env.SMS_SIGN_NAME,
    templateCode: process.env.SMS_TEMPLATE_CODE,
    countryCode: '86',
    interval: 60,
    validTime: 5,
    outId,
  });
}

async function checkViaAliyun(
  phone: string,
  code: string,
  scene: SmsScene
): Promise<boolean> {
  const client = await getAliyunClient();
  const outId = await getLatestOutId(phone, scene);
  const result = await client.checkSmsVerifyCode({
    phoneNumber: phone,
    verifyCode: code,
    countryCode: 'cn',
    caseAuthPolicy: 0,
    outId,
  });
  return result?.model?.verifyResult === 'PASS';
}

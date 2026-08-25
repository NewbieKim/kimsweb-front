import crypto from 'crypto'; // 引入crypto库，用于生成SHA-256哈希值
import { ProviderType } from '@prisma/client';

type ProviderGenerationInput = {
  prompt: string;
  jobId: number;
  frameIndex: number;
};

export type ProviderGenerationOutput = {
  imageUrl: string;
  providerTaskId: string;
};

interface IllustrationProviderAdapter {
  provider: ProviderType;
  generateFrame(input: ProviderGenerationInput): Promise<ProviderGenerationOutput>;
}

type BytePlusAuthContext =
  | {
      mode: 'api_key';
      apiKey: string;
    }
  | {
      mode: 'aksk';
      accessKey: string;
      secretKey: string;
      region: string;
      service: string;
    };

class BytePlusJimengAdapter implements IllustrationProviderAdapter {
  provider = ProviderType.BYTEPLUS;
  // generateFrame作用：生成图片
  async generateFrame(input: ProviderGenerationInput): Promise<ProviderGenerationOutput> {
    const enabled = readBooleanEnv('ILLUSTRATION_PROVIDER_BYTEPLUS_ENABLED', true);
    if (!enabled) {
      throw new Error('ILLUSTRATION_PROVIDER_BYTEPLUS_ENABLED=false，已禁用 BYTEPLUS');
    }

    const authContext = resolveBytePlusAuthContext();
    const submitEndpointRaw = (
      process.env.ILLUSTRATION_BYTEPLUS_API_URL || 'https://visual.volcengineapi.com'
    ).trim();
    const queryEndpointRaw = (
      process.env.ILLUSTRATION_BYTEPLUS_QUERY_API_URL || submitEndpointRaw
    ).trim();
    if (!submitEndpointRaw) {
      throw new Error('缺少 BYTEPLUS 地址：ILLUSTRATION_BYTEPLUS_API_URL');
    }
    if (!queryEndpointRaw) {
      throw new Error('缺少 BYTEPLUS 查询地址：ILLUSTRATION_BYTEPLUS_QUERY_API_URL');
    }

    const reqKey = (process.env.ILLUSTRATION_BYTEPLUS_REQ_KEY || 'jimeng_t2i_v31').trim();
    if (!reqKey) {
      throw new Error('缺少 BYTEPLUS req_key：ILLUSTRATION_BYTEPLUS_REQ_KEY');
    }
    const width = readIntEnv('ILLUSTRATION_BYTEPLUS_WIDTH', 1328);
    const height = readIntEnv('ILLUSTRATION_BYTEPLUS_HEIGHT', 1328);
    const seed = readIntEnvAllowNegativeOne('ILLUSTRATION_BYTEPLUS_SEED', -1);
    const usePreLlm = readBooleanEnv('ILLUSTRATION_BYTEPLUS_USE_PRE_LLM', true);

    const requestBody: Record<string, unknown> = {
      req_key: reqKey,
      prompt: input.prompt,
      use_pre_llm: usePreLlm,
      seed,
      width,
      height,
    };

    const submitUrl = buildBytePlusActionUrl(submitEndpointRaw, 'CVSync2AsyncSubmitTask');
    const submitBody = JSON.stringify(requestBody);
    const response = await fetch(submitUrl, {
      method: 'POST',
      headers: buildBytePlusAuthHeaders({
        authContext,
        method: 'POST',
        requestUrl: submitUrl,
        body: submitBody,
      }),
      body: submitBody,
    });

    const payload = await parseResponseBody(response);
    ensureHttpOk(response.status, payload, 'BYTEPLUS 提交任务失败');
    ensureBytePlusCodeSuccess(payload, 'BYTEPLUS 提交任务失败');
    const providerTaskId = pickBytePlusTaskId(payload);
    if (!providerTaskId) {
      throw new Error(`BYTEPLUS 提交任务失败: 缺少 data.task_id，request_id=${pickRequestId(payload)}`);
    }

    const polledImageUrl = await pollBytePlusImageResultV2({
      authContext,
      reqKey,
      taskId: providerTaskId,
      queryEndpointRaw,
    });
    return {
      imageUrl: polledImageUrl,
      providerTaskId,
    };
  }
}

class OpenAIImageAdapter implements IllustrationProviderAdapter {
  provider = ProviderType.OPENAI_IMAGE;

  async generateFrame(input: ProviderGenerationInput): Promise<ProviderGenerationOutput> {
    const enabled = readBooleanEnv('ILLUSTRATION_PROVIDER_OPENAI_ENABLED', true);
    if (!enabled) {
      throw new Error('ILLUSTRATION_PROVIDER_OPENAI_ENABLED=false，已禁用 OPENAI_IMAGE');
    }

    const apiKey = (
      process.env.ILLUSTRATION_OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ''
    ).trim();
    if (!apiKey) {
      throw new Error('缺少 OPENAI_IMAGE 密钥：ILLUSTRATION_OPENAI_API_KEY/OPENAI_API_KEY');
    }

    const baseUrl = (
      process.env.ILLUSTRATION_OPENAI_API_BASE_URL ||
      process.env.OPENAI_API_BASE_URL ||
      'https://api.openai.com/v1'
    ).replace(/\/+$/, '');
    const model = (process.env.ILLUSTRATION_OPENAI_MODEL || 'gpt-image-1').trim();
    const size = (process.env.ILLUSTRATION_OPENAI_IMAGE_SIZE || '1024x1024').trim();

    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: input.prompt,
        size,
        n: 1,
      }),
    });

    const payload = await parseResponseBody(response);
    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        `OPENAI_IMAGE 请求失败: ${response.status}`;
      throw new Error(message);
    }

    const imageUrl = pickImageUrl(payload);
    if (!imageUrl) {
      throw new Error('OPENAI_IMAGE 返回缺少可用图片地址');
    }

    const providerTaskId =
      pickTaskId(payload) || `openai-${input.jobId}-${input.frameIndex}-${Date.now()}`;

    return {
      imageUrl,
      providerTaskId,
    };
  }
}

const providerRegistry: Record<ProviderType, IllustrationProviderAdapter> = {
  [ProviderType.BYTEPLUS]: new BytePlusJimengAdapter(),
  [ProviderType.OPENAI_IMAGE]: new OpenAIImageAdapter(),
  [ProviderType.RECRAFT]: new OpenAIImageAdapter(),
  [ProviderType.STABILITY_AI]: new OpenAIImageAdapter(),
  [ProviderType.OTHER]: new OpenAIImageAdapter(),
};

// 根据 provider 获取对应的 adapter
export function getIllustrationProviderAdapter(provider: ProviderType) {
  const adapter = providerRegistry[provider];
  if (!adapter) {
    throw new Error(`未配置 provider adapter: ${provider}`);
  }
  return adapter;
}

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const rawValue = process.env[name];
  if (rawValue === undefined) {
    return defaultValue;
  }
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }
  return defaultValue;
}

async function parseResponseBody(response: Response): Promise<any> {
  const text = await response.text();
  if (!text.trim()) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function pickTaskId(payload: any): string | null {
  const value =
    payload?.id ||
    payload?.request_id ||
    payload?.requestId ||
    payload?.task_id ||
    payload?.taskId ||
    payload?.data?.id ||
    payload?.data?.task_id ||
    payload?.data?.taskId;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pickImageUrl(payload: any): string | null {
  const value =
    payload?.data?.[0]?.url ||
    payload?.data?.[0]?.image_url ||
    payload?.data?.[0]?.imageUrl ||
    payload?.data?.url ||
    payload?.data?.image_url ||
    payload?.data?.imageUrl ||
    payload?.result?.url ||
    payload?.result?.image_url;
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  const b64 =
    payload?.data?.[0]?.b64_json ||
    payload?.data?.b64_json ||
    payload?.result?.b64_json;
  if (typeof b64 === 'string' && b64.trim()) {
    return `data:image/png;base64,${b64.trim()}`;
  }

  return null;
}

type BytePlusPollParams = {
  taskId: string;
  authContext: BytePlusAuthContext;
  reqKey: string;
  queryEndpointRaw: string;
};

async function pollBytePlusImageResultV2(params: BytePlusPollParams): Promise<string> {
  const maxAttempts = readIntEnv('ILLUSTRATION_BYTEPLUS_QUERY_MAX_ATTEMPTS', 20);
  const baseIntervalMs = readIntEnv('ILLUSTRATION_BYTEPLUS_QUERY_INTERVAL_MS', 2000);
  const backoffEnabled = readBooleanEnv('ILLUSTRATION_BYTEPLUS_QUERY_BACKOFF_ENABLED', true);
  const returnUrl = readBooleanEnv('ILLUSTRATION_BYTEPLUS_RETURN_URL', true);
  const addLogo = readBooleanEnv('ILLUSTRATION_BYTEPLUS_ADD_LOGO', false);
  const queryUrl = buildBytePlusActionUrl(params.queryEndpointRaw, 'CVSync2AsyncGetResult');

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const queryBody = JSON.stringify({
      req_key: params.reqKey,
      task_id: params.taskId,
      req_json: JSON.stringify({
        return_url: returnUrl,
        logo_info: {
          add_logo: addLogo,
        },
      }),
    });
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: buildBytePlusAuthHeaders({
        authContext: params.authContext,
        method: 'POST',
        requestUrl: queryUrl,
        body: queryBody,
      }),
      body: queryBody,
    });
    const payload = await parseResponseBody(response);
    ensureHttpOk(response.status, payload, 'BYTEPLUS 查询任务失败');

    const code = getBytePlusCode(payload);
    if (code !== 10000) {
      const message = pickBytePlusMessage(payload);
      if (isRetryableBytePlusCode(code) && attempt < maxAttempts) {
        await sleep(resolvePollDelayMs(baseIntervalMs, attempt, backoffEnabled));
        continue;
      }
      throw new Error(
        `BYTEPLUS 查询任务失败: code=${code ?? 'unknown'}, message=${message}, request_id=${pickRequestId(payload)}, task_id=${params.taskId}`
      );
    }

    const status = pickBytePlusTaskStatus(payload);
    if (status === 'done') {
      const imageUrl = pickBytePlusImageUrl(payload);
      if (!imageUrl) {
        throw new Error(
          `BYTEPLUS 查询任务失败: status=done 但缺少 data.image_urls[0], request_id=${pickRequestId(payload)}, task_id=${params.taskId}`
        );
      }
      return imageUrl; // 返回图片地址
    }

    if (status === 'in_queue' || status === 'generating') {
      await sleep(resolvePollDelayMs(baseIntervalMs, attempt, backoffEnabled));
      continue;
    }

    if (status === 'not_found' || status === 'expired') {
      throw new Error(
        `BYTEPLUS 查询任务失败: status=${status}, request_id=${pickRequestId(payload)}, task_id=${params.taskId}`
      );
    }

    throw new Error(
      `BYTEPLUS 查询任务失败: 未知 status=${status || 'empty'}, request_id=${pickRequestId(payload)}, task_id=${params.taskId}`
    );
  }

  throw new Error('BYTEPLUS 任务查询超时，未获取到图片结果');
}

function resolveBytePlusAuthContext(): BytePlusAuthContext {
  const apiKey = (process.env.ILLUSTRATION_BYTEPLUS_API_KEY || '').trim();
  if (apiKey) {
    return {
      mode: 'api_key',
      apiKey,
    };
  }

  const accessKey = (process.env.ILLUSTRATION_BYTEPLUS_ACCESS_KEY || '').trim();
  const secretRaw = (process.env.ILLUSTRATION_BYTEPLUS_SECRET_ACCESS_KEY || '').trim();

  if (!accessKey || !secretRaw) {
    throw new Error(
      '缺少 BYTEPLUS 鉴权信息，请配置 ILLUSTRATION_BYTEPLUS_API_KEY 或 ILLUSTRATION_BYTEPLUS_ACCESS_KEY + ILLUSTRATION_BYTEPLUS_SECRET_ACCESS_KEY'
    );
  }

  const region = (process.env.ILLUSTRATION_BYTEPLUS_REGION || 'cn-north-1').trim();
  const service = (process.env.ILLUSTRATION_BYTEPLUS_SERVICE || 'cv').trim();
  const secretKey = tryDecodeBase64Secret(secretRaw);

  return {
    mode: 'aksk',
    accessKey,
    secretKey,
    region,
    service,
  };
}

function buildBytePlusActionUrl(
  endpointRaw: string,
  action: 'CVSync2AsyncSubmitTask' | 'CVSync2AsyncGetResult'
): string {
  const trimmed = endpointRaw.trim();
  if (!trimmed) {
    throw new Error('BYTEPLUS 接口地址为空');
  }
  if (/([?&])Action=/i.test(trimmed)) {
    const withAction = trimmed.replace(/([?&])Action=[^&]*/i, `$1Action=${action}`);
    if (/([?&])Version=/i.test(withAction)) {
      return withAction.replace(/([?&])Version=[^&]*/i, '$1Version=2022-08-31');
    }
    const separator = withAction.includes('?') ? '&' : '?';
    return `${withAction}${separator}Version=2022-08-31`;
  }
  const base = trimmed.replace(/\/+$/, '');
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}Action=${action}&Version=2022-08-31`;
}

function buildBytePlusAuthHeaders(params: {
  authContext: BytePlusAuthContext;
  method: 'POST' | 'GET';
  requestUrl: string;
  body: string;
}): Record<string, string> {
  const contentType = 'application/json';
  if (params.authContext.mode === 'api_key') {
    return {
      'Content-Type': contentType,
      Authorization: `Bearer ${params.authContext.apiKey}`,
    };
  }

  const url = new URL(params.requestUrl);
  const xDate = formatVolcDate(new Date());
  const payloadHash = sha256Hex(params.body);
  const signedHeaders = 'content-type;host;x-content-sha256;x-date';
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${url.host}\n` +
    `x-content-sha256:${payloadHash}\n` +
    `x-date:${xDate}\n`;
  const canonicalUri = url.pathname || '/';
  const canonicalQuery = buildCanonicalQuery(url);
  const canonicalRequest =
    `${params.method}\n` +
    `${canonicalUri}\n` +
    `${canonicalQuery}\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${payloadHash}`;

  const shortDate = xDate.slice(0, 8);
  const credentialScope = `${shortDate}/${params.authContext.region}/${params.authContext.service}/request`;
  const stringToSign =
    `HMAC-SHA256\n` +
    `${xDate}\n` +
    `${credentialScope}\n` +
    `${sha256Hex(canonicalRequest)}`;
  const signature = computeVolcSignature({
    secretKey: params.authContext.secretKey,
    shortDate,
    region: params.authContext.region,
    service: params.authContext.service,
    stringToSign,
  });

  const authorization =
    `HMAC-SHA256 ` +
    `Credential=${params.authContext.accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;
  console.log('authorization', authorization);

  return {
    'Content-Type': contentType,
    'X-Date': xDate,
    'X-Content-Sha256': payloadHash,
    Authorization: authorization,
  };
}

function tryDecodeBase64Secret(secretRaw: string): string {
  const value = secretRaw.trim();
  const base64Like = /^[A-Za-z0-9+/=]+$/.test(value) && value.length % 4 === 0;
  if (!base64Like) {
    return value;
  }
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    return decoded.trim() || value;
  } catch {
    return value;
  }
}

function formatVolcDate(date: Date): string {
  const iso = date.toISOString();
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function buildCanonicalQuery(url: URL): string {
  const entries: Array<[string, string]> = [];
  url.searchParams.forEach((value, key) => {
    entries.push([rfc3986Encode(key), rfc3986Encode(value)]);
  });
  entries.sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });
  return entries.map(([k, v]) => `${k}=${v}`).join('&');
}

function rfc3986Encode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function hmacBuffer(key: Buffer | string, input: string): Buffer {
  return crypto.createHmac('sha256', key).update(input, 'utf8').digest();
}

function hmacHex(key: Buffer | string, input: string): string {
  return crypto.createHmac('sha256', key).update(input, 'utf8').digest('hex');
}

function computeVolcSignature(params: {
  secretKey: string;
  shortDate: string;
  region: string;
  service: string;
  stringToSign: string;
}): string {
  const kDate = hmacBuffer(`VOLC${params.secretKey}`, params.shortDate);
  const kRegion = hmacBuffer(kDate, params.region);
  const kService = hmacBuffer(kRegion, params.service);
  const kSigning = hmacBuffer(kService, 'request');
  return hmacHex(kSigning, params.stringToSign);
}

function ensureHttpOk(status: number, payload: any, prefix: string) {
  if (status >= 200 && status < 300) {
    return;
  }
  const message = pickBytePlusMessage(payload);
  throw new Error(
    `${prefix}: http_status=${status}, message=${message}, request_id=${pickRequestId(payload)}`
  );
}

function ensureBytePlusCodeSuccess(payload: any, prefix: string) {
  const code = getBytePlusCode(payload);
  if (code === 10000) {
    return;
  }
  const message = pickBytePlusMessage(payload);
  throw new Error(
    `${prefix}: code=${code ?? 'unknown'}, message=${message}, request_id=${pickRequestId(payload)}`
  );
}

function getBytePlusCode(payload: any): number | null {
  const value = payload?.code;
  return typeof value === 'number' ? value : null;
}

function pickBytePlusTaskId(payload: any): string | null {
  const value = payload?.data?.task_id;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pickBytePlusTaskStatus(payload: any): string {
  const value = payload?.data?.status;
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function pickBytePlusImageUrl(payload: any): string | null {
  const value = payload?.data?.image_urls?.[0];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pickBytePlusMessage(payload: any): string {
  const value = payload?.message;
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (payload?.error?.message && typeof payload.error.message === 'string') {
    return payload.error.message.trim();
  }
  return 'unknown';
}

function pickRequestId(payload: any): string {
  const value = payload?.request_id || payload?.requestId;
  return typeof value === 'string' && value.trim() ? value.trim() : 'unknown';
}

function isRetryableBytePlusCode(code: number | null): boolean {
  return code === 50511 || code === 50519 || code === 50429 || code === 50430;
}

function resolvePollDelayMs(baseIntervalMs: number, attempt: number, backoffEnabled: boolean) {
  if (!backoffEnabled) {
    return baseIntervalMs;
  }
  if (attempt <= 1) return baseIntervalMs;
  if (attempt === 2) return Math.round(baseIntervalMs * 1.5);
  return Math.round(baseIntervalMs * 2.5);
}

function readIntEnv(name: string, defaultValue: number): number {
  const rawValue = (process.env[name] || '').trim();
  if (!rawValue) {
    return defaultValue;
  }
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function readIntEnvAllowNegativeOne(name: string, defaultValue: number): number {
  const rawValue = (process.env[name] || '').trim();
  if (!rawValue) {
    return defaultValue;
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }
  if (parsed === -1) {
    return -1;
  }
  return parsed > 0 ? parsed : defaultValue;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

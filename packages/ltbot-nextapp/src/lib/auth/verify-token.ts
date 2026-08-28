import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';

const ALGORITHM = 'sha256';
const TOKEN_TTL_MS = 5 * 60 * 1000;

export type VerifyScene = 'register' | 'forgot';

function getSecret(): string {
  return process.env.AUTH_VERIFY_SECRET || process.env.CLERK_SECRET_KEY || 'dev-insecure-verify-secret';
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(body: string): string {
  return createHmac(ALGORITHM, getSecret()).update(body).digest('base64url');
}

export function createVerifyToken(
  phone: string,
  scene: VerifyScene,
  smsLogId: number
): string {
  const payload = encodeBase64Url(
    JSON.stringify({
      phone,
      scene,
      sid: smsLogId,
      exp: Date.now() + TOKEN_TTL_MS,
    })
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyVerifyToken(
  token: string,
  phone: string,
  scene: VerifyScene
): boolean {
  const data = parseToken(token);
  return (
    !!data &&
    data.phone === phone &&
    data.scene === scene &&
    typeof data.exp === 'number' &&
    data.exp > Date.now()
  );
}

export async function consumeVerifyToken(
  token: string,
  phone: string,
  scene: VerifyScene
): Promise<boolean> {
  const data = parseToken(token);
  if (
    !data ||
    data.phone !== phone ||
    data.scene !== scene ||
    typeof data.sid !== 'number' ||
    typeof data.exp !== 'number' ||
    data.exp <= Date.now()
  ) {
    return false;
  }

  const log = await prisma.smsSendLog.findUnique({
    where: { id: data.sid },
  });
  if (!log || log.phone !== phone || log.scene !== scene || !log.verifiedAt || log.usedAt) {
    return false;
  }

  await prisma.smsSendLog.update({
    where: { id: log.id },
    data: { usedAt: new Date() },
  });
  return true;
}

function parseToken(
  token: string
): {
  phone?: string;
  scene?: string;
  sid?: number;
  exp?: number;
} | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

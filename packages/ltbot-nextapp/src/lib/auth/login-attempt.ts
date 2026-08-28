import { prisma } from '@/lib/prisma';

export const MAX_LOGIN_FAIL_COUNT = 10;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;

export interface LoginStatus {
  locked: boolean;
  lockRemainingSeconds: number;
  remainingAttempts: number;
}

export async function getLoginStatus(phone: string, ip?: string): Promise<LoginStatus> {
  const ipKey = ip || 'unknown';
  const attempt = await prisma.loginAttempt.findUnique({
    where: {
      phone_ip: {
        phone,
        ip: ipKey,
      },
    },
  });

  if (!attempt || !attempt.lockedAt) {
    return {
      locked: false,
      lockRemainingSeconds: 0,
      remainingAttempts: MAX_LOGIN_FAIL_COUNT,
    };
  }

  const lockRemainingMs =
    attempt.lockedAt.getTime() + LOGIN_LOCK_MS - Date.now();
  if (lockRemainingMs <= 0) {
    await prisma.loginAttempt.deleteMany({
      where: {
        phone,
        ip: ipKey,
      },
    });
    return {
      locked: false,
      lockRemainingSeconds: 0,
      remainingAttempts: MAX_LOGIN_FAIL_COUNT,
    };
  }

  return {
    locked: true,
    lockRemainingSeconds: Math.ceil(lockRemainingMs / 1000),
    remainingAttempts: 0,
  };
}

export async function recordLoginFailure(phone: string, ip?: string): Promise<LoginStatus> {
  const ipKey = ip || 'unknown';
  const now = new Date();
  const existing = await prisma.loginAttempt.findUnique({
    where: {
      phone_ip: {
        phone,
        ip: ipKey,
      },
    },
  });

  const failCount = (existing?.failCount || 0) + 1;
  const shouldLock = failCount >= MAX_LOGIN_FAIL_COUNT;

  const attempt = await prisma.loginAttempt.upsert({
    where: {
      phone_ip: {
        phone,
        ip: ipKey,
      },
    },
    create: {
      phone,
      ip: ipKey,
      failCount,
      lockedAt: shouldLock ? now : null,
    },
    update: {
      failCount,
      lockedAt: shouldLock ? now : existing?.lockedAt || null,
      updatedAt: now,
    },
  });

  return {
    locked: !!attempt.lockedAt,
    lockRemainingSeconds: attempt.lockedAt ? LOGIN_LOCK_MS / 1000 : 0,
    remainingAttempts: Math.max(0, MAX_LOGIN_FAIL_COUNT - failCount),
  };
}

export async function clearLoginAttempts(phone: string, ip?: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: {
      phone,
      ...(ip ? { ip } : {}),
    },
  });
}

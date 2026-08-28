import { clerkClient } from '@clerk/nextjs/server';
import { clearLoginAttempts } from '@/lib/auth/login-attempt';
import { consumeVerifyToken, VerifyScene } from '@/lib/auth/verify-token';
import { createOperationEvent, OPERATION_EVENT_TYPES } from '@/lib/operation-event';
import { extractClerkError } from '@/lib/clerk-error';
import {
  decryptPassword,
  isPasswordEncryptionConfigured,
  PasswordCryptoError,
} from '@/lib/password-crypto';
import {
  clerkEmailFromPhone,
  isChinaMobile,
  maskPhone,
  normalizeChinaPhone,
} from '@/lib/phone';
import { prisma } from '@/lib/prisma';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
} from '@/lib/response';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const encryptedPassword =
      typeof body.passwordEncrypted === 'string'
        ? body.passwordEncrypted.trim()
        : '';
    const token = typeof body.verifyToken === 'string' ? body.verifyToken : '';
    const scene: VerifyScene = 'forgot';

    let password = '';
    if (encryptedPassword) {
      try {
        password = decryptPassword(encryptedPassword);
      } catch (error: unknown) {
        if (error instanceof PasswordCryptoError) {
          return errorResponse(error.message, error.statusCode);
        }
        return errorResponse('密码解密失败', 400);
      }
    } else {
      if (isPasswordEncryptionConfigured() || process.env.NODE_ENV === 'production') {
        return badRequestResponse('密码加密参数缺失');
      }
      password = typeof body.password === 'string' ? body.password : '';
    }

    if (!isChinaMobile(phone) || !PASSWORD_REGEX.test(password) || !token) {
      return badRequestResponse('参数错误');
    }

    const tokenValid = await consumeVerifyToken(token, phone, scene);
    if (!tokenValid) {
      return errorResponse('验证码凭证无效或已过期，请重新验证', 401);
    }

    const client = await clerkClient();
    const normalizedPhone = normalizeChinaPhone(phone);
    const localUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { clerkUsername: true },
    });
    const page = localUser?.clerkUsername
      ? await client.users.getUserList({
          username: [localUser.clerkUsername],
          limit: 1,
        })
      : await client.users.getUserList({
          emailAddress: [clerkEmailFromPhone(phone)],
          limit: 1,
        });
    const clerkUser = page.data[0];
    if (!clerkUser) {
      return badRequestResponse('手机号未注册');
    }

    await client.users.updateUser(clerkUser.id, {
      password,
      skipPasswordChecks: true,
      signOutOfOtherSessions: true,
    });

    const sessions = await client.sessions.getSessionList({
      userId: clerkUser.id,
    });
    await Promise.all(
      sessions.data.map((session) =>
        client.sessions.revokeSession(session.id).catch(() => undefined)
      )
    );

    await clearLoginAttempts(phone);

    await createOperationEvent({
      eventType: OPERATION_EVENT_TYPES.AUTH_RESET_PASSWORD,
      userId: clerkUser.id,
      metadata: { phoneMasked: maskPhone(normalizedPhone) },
    });

    return successResponse({ redirect: '/sign-in' }, '密码重置成功');
  } catch (error: unknown) {
    console.error('重置密码失败:', error);
    return errorResponse(`密码重置失败：${extractClerkError(error)}`, 400);
  }
}

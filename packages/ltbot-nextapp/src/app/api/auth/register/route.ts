import { clerkClient } from '@clerk/nextjs/server';
import { TransactionType } from '@prisma/client';
import { consumeVerifyToken, VerifyScene } from '@/lib/auth/verify-token';
import { createOperationEvent, OPERATION_EVENT_TYPES } from '@/lib/operation-event';
import { extractClerkError } from '@/lib/clerk-error';
import {
  decryptPassword,
  isPasswordEncryptionConfigured,
  PasswordCryptoError,
} from '@/lib/password-crypto';
import {
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
import {
  buildDefaultDisplayName,
  buildDefaultUsername,
  buildFallbackUsername,
  generateTempClerkUsername,
} from '@/lib/username';

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
    const scene: VerifyScene = 'register';

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

    const normalizedPhone = normalizeChinaPhone(phone);
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (existingUser) {
      return badRequestResponse('该手机号已注册，请直接登录');
    }

    const client = await clerkClient();
    let clerkUser;
    try {
      clerkUser = await client.users.createUser({
        username: generateTempClerkUsername(),
        password,
        skipPasswordChecks: true,
      });
    } catch (error: unknown) {
      const clerkError = error as { status?: number; message?: string };
      if (
        String(clerkError?.message || '').toLowerCase().includes('already exists')
      ) {
        return badRequestResponse('该手机号已注册，请直接登录');
      }
      console.error('Clerk 创建用户失败:', clerkError?.message || error);
      return badRequestResponse(`注册失败：${extractClerkError(error)}`);
    }

    const displayName = buildDefaultDisplayName(clerkUser.id);
    let finalUsername = buildDefaultUsername(clerkUser.id);
    try {
      const updatedUser = await client.users.updateUser(clerkUser.id, {
        username: finalUsername,
        firstName: displayName,
      });
      finalUsername = updatedUser.username || finalUsername;
    } catch (error: unknown) {
      finalUsername = buildFallbackUsername(clerkUser.id);
      const updatedUser = await client.users.updateUser(clerkUser.id, {
        username: finalUsername,
        firstName: displayName,
      });
      finalUsername = updatedUser.username || finalUsername;
      console.warn('默认用户名冲突，已使用兜底用户名:', finalUsername, error);
    }

    const localUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { id: clerkUser.id },
        create: {
          id: clerkUser.id,
          name: displayName,
          phone: normalizedPhone,
          clerkUsername: finalUsername,
        },
        update: {
          name: displayName,
          phone: normalizedPhone,
          clerkUsername: finalUsername,
        },
      });

      const existingGift = await tx.scoreTransaction.findFirst({
        where: {
          userId: user.id,
          transactionType: TransactionType.SYSTEM_GIFT,
        },
      });

      if (!existingGift) {
        const score = await tx.userScore.upsert({
          where: { userId: user.id },
          create: { userId: user.id, balance: 0 },
          update: {},
        });
        const balanceAfter = score.balance + 100;
        await tx.userScore.update({
          where: { userId: user.id },
          data: { balance: balanceAfter },
        });
        await tx.scoreTransaction.create({
          data: {
            userId: user.id,
            transactionType: TransactionType.SYSTEM_GIFT,
            amount: 100,
            balanceBefore: score.balance,
            balanceAfter,
            description: '新用户注册赠送积分',
          },
        });
      }

      return user;
    });

    await createOperationEvent({
      eventType: OPERATION_EVENT_TYPES.AUTH_REGISTER,
      userId: localUser.id,
      metadata: { phoneMasked: maskPhone(normalizedPhone) },
    });

    return successResponse(
      {
        user: {
          id: localUser.id,
          phone: localUser.phone,
          name: localUser.name,
          clerkUsername: localUser.clerkUsername,
        },
        isNewUser: true,
        giftScores: 100,
      },
      '注册成功'
    );
  } catch (error: unknown) {
    console.error('注册失败:', error);
    return errorResponse('注册失败，请稍后重试', 500);
  }
}

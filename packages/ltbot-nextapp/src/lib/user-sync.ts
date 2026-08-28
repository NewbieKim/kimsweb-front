import { TransactionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface ClerkUserSyncInput {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  avatar: string | null;
}

/**
 * 幂等同步 Clerk 用户到本地，并保证新人积分只赠送一次。
 * sync、Webhook、注册流程统一走这里，避免双写重复送积分。
 */
export async function syncUserFromClerk(input: ClerkUserSyncInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { id: input.id },
      select: { id: true },
    });

    const updateData: {
      name: string;
      email: string | null;
      phone?: string | null;
      clerkUsername?: string | null;
      avatar: string | null;
    } = {
      name: input.name,
      email: input.email,
      avatar: input.avatar,
    };
    if (input.phone) {
      updateData.phone = input.phone;
    }
    if (input.username) {
      updateData.clerkUsername = input.username;
    }

    const user = await tx.user.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        clerkUsername: input.username,
        avatar: input.avatar,
      },
      update: updateData,
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

    return { user, created: !existing };
  });
}

import { auth } from '@clerk/nextjs/server';
import { StoryVisibility, TransactionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { findReadableStory } from '@/lib/story-access';
import { badRequestResponse, errorResponse, successResponse } from '@/lib/response';

const STORY_UNLOCK_COST = 10;
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);

  try {
    const storyId = Number((await params).id);
    if (!Number.isInteger(storyId) || storyId <= 0) return badRequestResponse('故事ID无效');

    const story = await findReadableStory(storyId, userId);
    if (!story) return errorResponse('故事不存在', 404);

    if (story.visibility === StoryVisibility.PRIVATE && story.userId === userId) {
      const score = await prisma.userScore.findUnique({
        where: { userId },
        select: { balance: true },
      });
      return successResponse({
        unlocked: true,
        alreadyUnlocked: true,
        cost: 0,
        balance: score?.balance ?? 0,
      }, '私密故事无需积分解锁');
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.scoreTransaction.findFirst({
        where: { userId, storyId, transactionType: TransactionType.CONSUME_STORY },
        orderBy: { createdAt: 'desc' },
      });
      const currentScore = await tx.userScore.findUnique({
        where: { userId },
        select: { balance: true },
      });
      if (!currentScore) throw new Error('SCORE_NOT_INITIALIZED');

      if (existingTransaction) {
        return {
          unlocked: true,
          alreadyUnlocked: true,
          cost: Math.abs(existingTransaction.amount),
          balance: currentScore.balance,
        };
      }
      if (currentScore.balance < STORY_UNLOCK_COST) {
        return {
          unlocked: false,
          alreadyUnlocked: false,
          cost: STORY_UNLOCK_COST,
          balance: currentScore.balance,
          required: STORY_UNLOCK_COST,
          insufficient: true,
        };
      }

      const balanceAfter = currentScore.balance - STORY_UNLOCK_COST;
      await tx.userScore.update({ where: { userId }, data: { balance: balanceAfter } });
      await tx.scoreTransaction.create({
        data: {
          userId,
          storyId,
          transactionType: TransactionType.CONSUME_STORY,
          amount: -STORY_UNLOCK_COST,
          balanceBefore: currentScore.balance,
          balanceAfter,
          description: `解锁故事 ${storyId} 消耗 ${STORY_UNLOCK_COST} 积分`,
        },
      });
      return {
        unlocked: true,
        alreadyUnlocked: false,
        cost: STORY_UNLOCK_COST,
        balance: balanceAfter,
      };
    });

    return successResponse(result, result.unlocked ? '故事解锁成功' : '积分不足');
  } catch (error) {
    if (error instanceof Error && error.message === 'SCORE_NOT_INITIALIZED') {
      return badRequestResponse('用户积分记录不存在，请先初始化');
    }
    console.error('故事解锁失败', { stage: 'unlock', error });
    return errorResponse('故事解锁失败', 500);
  }
}

import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response'
import { TransactionType } from '@prisma/client'

const STORY_UNLOCK_COST = 10

/**
 * POST /api/stories/[id]/unlock
 * 进入详情页时校验并尝试扣积分解锁全文
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const storyId = parseInt(id, 10)
    if (Number.isNaN(storyId)) {
      return badRequestResponse('故事ID无效')
    }

    const body = await request.json().catch(() => ({}))
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : ''
    const amount = Number.isFinite(body?.amount)
      ? Math.max(1, Number(body.amount))
      : STORY_UNLOCK_COST

    if (!userId) {
      return badRequestResponse('用户ID为必填项')
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true },
    })
    if (!story) {
      return errorResponse('故事不存在', 404)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!user) {
      return badRequestResponse('用户不存在')
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.scoreTransaction.findFirst({
        where: {
          userId,
          storyId,
          transactionType: TransactionType.CONSUME_STORY,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const currentScore = await tx.userScore.findUnique({
        where: { userId },
        select: { balance: true },
      })

      if (!currentScore) {
        throw new Error('用户积分记录不存在，请先初始化')
      }

      if (existingTransaction) {
        return {
          unlocked: true,
          alreadyUnlocked: true,
          cost: Math.abs(existingTransaction.amount),
          balance: currentScore.balance,
        }
      }

      if (currentScore.balance < amount) {
        return {
          unlocked: false,
          alreadyUnlocked: false,
          cost: amount,
          balance: currentScore.balance,
          required: amount,
          insufficient: true,
        }
      }

      const balanceBefore = currentScore.balance
      const balanceAfter = balanceBefore - amount

      await tx.userScore.update({
        where: { userId },
        data: { balance: balanceAfter },
      })

      await tx.scoreTransaction.create({
        data: {
          userId,
          transactionType: TransactionType.CONSUME_STORY,
          amount: -amount,
          balanceBefore,
          balanceAfter,
          description: `解锁故事 ${storyId} 消耗 ${amount} 积分`,
          storyId,
        },
      })

      return {
        unlocked: true,
        alreadyUnlocked: false,
        cost: amount,
        balance: balanceAfter,
      }
    })

    return successResponse(result, result.unlocked ? '故事解锁成功' : '积分不足')
  } catch (error: any) {
    console.error('解锁故事时出错:', error)
    if (error.message?.includes('积分记录不存在')) {
      return badRequestResponse(error.message)
    }
    return errorResponse('故事解锁失败', 500, error)
  }
}

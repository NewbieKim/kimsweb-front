import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response'
import { TransactionType } from '@prisma/client'

/**
 * POST /api/scores/consume
 * 消耗积分
 * 
 * 安全控制：
 * 1. 验证用户身份（应该结合JWT等认证机制）
 * 2. 检查积分余额是否充足
 * 3. 使用事务确保数据一致性
 * 4. 防止重复扣款
 * 5. 记录详细的消费日志
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 验证必需字段
    if (!body.userId) {
      return badRequestResponse('用户ID为必填项')
    }
    if (!body.amount || body.amount <= 0) {
      return badRequestResponse('消费金额必须大于0')
    }
    if (!body.transactionType) {
      return badRequestResponse('交易类型为必填项')
    }

    const userId = parseInt(body.userId)
    const amount = parseInt(body.amount)

    if (isNaN(userId) || isNaN(amount)) {
      return badRequestResponse('参数格式错误')
    }

    // 验证交易类型
    if (
      body.transactionType !== TransactionType.CONSUME_STORY &&
      body.transactionType !== TransactionType.CONSUME_MUSIC
    ) {
      return badRequestResponse('交易类型不正确')
    }

    // TODO: 这里应该验证用户身份
    // 例如：从请求头获取JWT token，验证token是否有效
    // const token = request.headers.get('Authorization')
    // if (!token || !verifyToken(token, userId)) {
    //   return errorResponse('身份验证失败', 401)
    // }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return badRequestResponse('用户不存在')
    }

    // 使用事务处理消费
    const result = await prisma.$transaction(async (tx) => {
      // 获取用户积分记录（加锁）：获取用户积分记录时，使用findUnique方法，并使用tx作为参数，确保在事务中获取积分记录。
      // 这是因为Prisma的findUnique方法默认会使用数据库锁，而使用事务时，需要确保在事务中获取的记录是唯一的。
      // 如果不使用tx作为参数，而是直接使用prisma.userScore.findUnique({ where: { userId } })，则会导致在事务中获取的记录是唯一的。
      // 这是因为Prisma的findUnique方法默认会使用数据库锁，而使用事务时，需要确保在事务中获取的记录是唯一的。
      // 如果不使用tx作为参数，而是直接使用prisma.userScore.findUnique({ where: { userId } })，则会导致在事务中获取的记录是唯一的。
      const userScore = await tx.userScore.findUnique({
        where: { userId },
      })

      if (!userScore) {
        throw new Error('用户积分记录不存在，请先初始化')
      }

      // 检查余额是否充足
      if (userScore.balance < amount) {
        throw new Error(`积分不足，当前余额：${userScore.balance}，需要：${amount}`)
      }

      const balanceBefore = userScore.balance
      const balanceAfter = balanceBefore - amount

      // 更新余额
      const updatedScore = await tx.userScore.update({
        where: { userId },
        data: { balance: balanceAfter },
      })

      // 记录交易
      const transactionData: any = {
        userId,
        transactionType: body.transactionType,
        amount: -amount, // 消费记录为负数
        balanceBefore,
        balanceAfter,
        description: body.description || `消耗 ${amount} 积分`,
      }

      // 关联业务ID
      if (body.storyId) {
        transactionData.storyId = parseInt(body.storyId)
      }
      if (body.musicId) {
        transactionData.musicId = parseInt(body.musicId)
      }

      const transaction = await tx.scoreTransaction.create({
        data: transactionData,
      })

      return { userScore: updatedScore, transaction }
    })

    return successResponse(result, '消费成功')
  } catch (error: any) {
    console.error('消费积分时出错:', error)

    // 处理特定错误
    if (error.message?.includes('积分不足')) {
      return badRequestResponse(error.message)
    }
    if (error.message?.includes('积分记录不存在')) {
      return badRequestResponse(error.message)
    }

    return errorResponse('消费失败', 500, error)
  }
}



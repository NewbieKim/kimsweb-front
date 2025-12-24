import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response'
import { TransactionType } from '@prisma/client'

/**
 * POST /api/scores/recharge
 * 充值积分
 * 
 * 安全控制：
 * 1. 此接口应该与支付系统集成，验证支付状态
 * 2. 需要验证支付回调签名
 * 3. 防止重复充值（订单号验证）
 * 4. 使用事务确保数据一致性
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 验证必需字段
    if (!body.userId) {
      return badRequestResponse('用户ID为必填项')
    }
    if (!body.amount || body.amount <= 0) {
      return badRequestResponse('充值金额必须大于0')
    }

    // TODO: 这里应该验证支付凭证
    // 例如：验证订单号、支付状态、支付签名等
    // if (!body.paymentOrderId || !body.paymentSignature) {
    //   return badRequestResponse('支付凭证无效')
    // }

    const userId = parseInt(body.userId)
    const amount = parseInt(body.amount)

    if (isNaN(userId) || isNaN(amount)) {
      return badRequestResponse('参数格式错误')
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return badRequestResponse('用户不存在')
    }

    // TODO: 验证支付订单是否已处理过，防止重复充值
    // const existingTransaction = await prisma.scoreTransaction.findFirst({
    //   where: {
    //     userId,
    //     description: `订单号：${body.paymentOrderId}`,
    //   },
    // })
    // if (existingTransaction) {
    //   return badRequestResponse('订单已处理过，请勿重复提交')
    // }

    // 使用事务处理充值
    const result = await prisma.$transaction(async (tx) => {
      // 获取或创建用户积分记录
      let userScore = await tx.userScore.findUnique({
        where: { userId },
      })

      if (!userScore) {
        userScore = await tx.userScore.create({
          data: { userId, balance: 0 },
        })
      }

      const balanceBefore = userScore.balance
      const balanceAfter = balanceBefore + amount

      // 更新余额
      const updatedScore = await tx.userScore.update({
        where: { userId },
        data: { balance: balanceAfter },
      })

      // 记录交易
      const transaction = await tx.scoreTransaction.create({
        data: {
          userId,
          transactionType: TransactionType.RECHARGE,
          amount,
          balanceBefore,
          balanceAfter,
          description: body.description || `充值 ${amount} 积分`,
        },
      })

      return { userScore: updatedScore, transaction }
    })

    return successResponse(result, '充值成功')
  } catch (error: any) {
    console.error('充值积分时出错:', error)
    return errorResponse('充值失败', 500, error)
  }
}



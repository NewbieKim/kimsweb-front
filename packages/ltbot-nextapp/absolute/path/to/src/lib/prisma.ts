/**
 * Prisma 6 客户端单例模式:使用 engineType: 'library' 配置
 */
import { PrismaClient } from '@prisma/client'

// 扩展global类型以支持prisma属性
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// 创建Prisma客户端实例，使用Library引擎
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    engineType: 'library', // 启用Library引擎
  })

// 开发环境下将实例存储到global对象，避免热重载时创建多个实例
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 优雅关闭连接
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
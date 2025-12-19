/**
 * Prisma 7 客户端单例模式:只需创建 PrismaClient，不传任何数据源参数
 * 
 * Prisma 7 配置方式：
 * - 数据源URL配置在 prisma.config.ts 中
 * - PrismaClient 会自动读取 prisma.config.ts 的配置
 * - 不需要在构造函数中传递任何参数
 */
import { PrismaClient } from '@prisma/client'

// 扩展global类型以支持prisma属性
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// 创建Prisma客户端实例
// Prisma 7 会自动从 prisma.config.ts 读取配置
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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
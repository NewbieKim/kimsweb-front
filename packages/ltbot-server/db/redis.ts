import { createClient } from 'redis'
import { Repository, Schema } from 'redis-om' // 导入 Repository 和 Schema
import dotenv from 'dotenv'

// 加载 .env 文件中的环境变量
dotenv.config()

// 1. 创建 Redis 客户端
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000, // 连接超时时间 10 秒
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.error('❌ Redis 重连失败，已达最大重试次数')
        return new Error('Redis 连接失败')
      }
      console.log(`🔄 Redis 重连中... (${retries}/3)`)
      return Math.min(retries * 100, 3000) // 重连间隔
    }
  }
})

redis.on('error', (err) => console.log('Redis Client Error', err))
redis.on('connect', () => console.log('Redis Client Connected'))

// 2. 定义实体接口
export interface Article {
  title: string
  content: string
  summary: string
  author: string
  category: string
  tags: string[]
  views: number
  status: 'draft' | 'published'
  createdAt: Date
  updatedAt: Date
}

// 3. 定义 Schema
const articleSchema = new Schema('article', {
  title: { type: 'string' }, // 文章标题
  content: { type: 'text' }, // 存储长文本，使用 text 类型
  summary: { type: 'string' },
  author: { type: 'string' },
  category: { type: 'string' },
  tags: { type: 'string[]' },
  views: { type: 'number' },
  status: { type: 'string' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' }
})

// 4. 创建 Repository 并初始化，作用是提供对Redis OM 实体的CRUD操作
export const articleRepository = new Repository(articleSchema, redis as any)

// 5. 初始化函数（连接并创建索引）
export const initRedis = async () => {
  try {
    if (!redis.isOpen) {
      await redis.connect()
      console.log('✅ Redis 连接成功')
      
      // 尝试创建索引（需要 Redis Stack 或 RediSearch 模块）
      try {
        await articleRepository.createIndex()
        console.log('✅ Redis OM 搜索索引创建成功（支持全文搜索）')
      } catch (indexError: any) {
        console.error('❌ Redis 索引创建失败:', indexError instanceof Error ? indexError.message : indexError)
      }
    }
  } catch (error) {
    console.error('❌ Redis 连接失败:', error instanceof Error ? error.message : error)
  }
}

// 6. 关闭连接
export const closeRedis = async () => {
  if (redis.isOpen) {
    await redis.quit()
  }
}


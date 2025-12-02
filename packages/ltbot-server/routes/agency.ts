import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Agency, AgencyForm } from '../types'
import { Router, Request, Response, NextFunction } from 'express'

const router: Router = express.Router()

import { agencyRepository } from '../db/redis.js'
import { EntityId } from 'redis-om' // 导入 EntityId 类型，作用是获取Redis OM 实体的唯一ID

// 辅助函数：将 Redis OM 实体转换为普通对象并添加 entityId
const toAgencyWithId = (agency: any) => {
  const id = agency[EntityId]
  return {
    ...agency,
    entityId: id
  }
}

// 中间件：检查 Redis 连接状态
const checkRedisConnection = (req: Request, res: Response, next: NextFunction) => {
  // 简单检查：尝试访问 repository 的客户端
  const client = (agencyRepository as any).client
  if (!client || !client.isOpen) {
    return res.status(503).json({
      success: false,
      message: 'Redis 服务未连接，文章功能暂时不可用',
      tip: '请启动 Redis 服务：docker run -d -p 6379:6379 redis/redis-stack:latest'
    })
  }
  next()
}

// 对所有代办路由应用 Redis 连接检查
router.use(checkRedisConnection)

// ES Module 兼容性处理
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AGENCY_FILE = path.join(__dirname, '../agency.json')

// 默认代办数据
const defaultAgencies: Agency[] = [
  {
    id: 1,
    title: "示例代办项1",
    description: "这是一个示例代办项",
    status: "pending",
    priority: "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// 从文件获取代办数据
const getAgencies = async (): Promise<Agency[]> => {
  try {
    // 本地存储
    // if (fs.existsSync(AGENCY_FILE)) {
    //   const data = fs.readFileSync(AGENCY_FILE, 'utf8')
    //   return JSON.parse(data)
    // }
    // 读取数据库
    const agencies = await agencyRepository.search().return.all() as Agency[]
    console.log('agencies', agencies, agencies.map(toAgencyWithId))
    return agencies.map(toAgencyWithId)
  } catch (error) {
    console.error('Error reading agencies:', error)
    return []
  }
}

// 获取所有代办
router.get('/', async (req, res) => {
  try {
    const agencies = await getAgencies() // 获取代办列表
    res.json({
      success: true,
      data: agencies,
      message: '获取代办列表成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取代办列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 添加代办
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority } = req.body
    const agency = await agencyRepository.save({
      title,
      description,
      status,
      priority,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    res.json({
      success: true,
      data: toAgencyWithId(agency),
      message: '添加代办成功'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建失败', error: String(error) })
  }
})

// 更新代办
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const agency = await agencyRepository.fetch(id)
    if (!agency || Object.keys(agency).length === 0) {
      return res.status(404).json({ success: false, message: '代办不存在' })
    }
    const { title, description, status, priority } = req.body
    if (title) agency.title = title
    if (description) agency.description = description
    if (status) agency.status = status
    if (priority) agency.priority = priority
    agency.updatedAt = new Date()
    await agencyRepository.save(agency)
    res.json({
      success: true,
      data: toAgencyWithId(agency),
      message: '更新代办成功'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败', error: String(error) })
  }
})

// 删除代办
router.delete('/:id',async (req, res) => {
  try {
    const { id } = req.params
    await agencyRepository.remove(id)
    res.json({
      success: true,
      message: '删除代办成功'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除失败', error: String(error) })
  }
})

export default router
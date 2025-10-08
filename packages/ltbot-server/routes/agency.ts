import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Agency, AgencyForm } from '../types'

const router: express.Router = express.Router()

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
const getAgencies = (): Agency[] => {
  try {
    if (fs.existsSync(AGENCY_FILE)) {
      const data = fs.readFileSync(AGENCY_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading agencies file:', error)
  }

  // 保存默认数据到文件
  saveAgencies(defaultAgencies)
  return defaultAgencies
}

// 存储代办数据到文件
const saveAgencies = (agencies: Agency[]): boolean => {
  try {
    fs.writeFileSync(AGENCY_FILE, JSON.stringify(agencies, null, 2))
    return true
  } catch (error) {
    console.error('Error writing agencies file:', error)
    return false
  }
}

// 获取所有代办
router.get('/', (req, res) => {
  try {
    const agencies = getAgencies()
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

// 获取单个代办
router.get('/:id', (req, res) => {
  try {
    const agencies = getAgencies()
    const agency = agencies.find((a) => a.id === parseInt(req.params.id))
    if (agency) {
      res.json({
        success: true,
        data: agency,
        message: '获取代办详情成功'
      })
    } else {
      res.status(404).json({
        success: false,
        message: '代办不存在'
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取代办详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 添加代办
router.post('/', (req, res) => {
  try {
    const agencies = getAgencies()
    const newAgency: Agency = {
      ...req.body as AgencyForm,
      id: agencies.length ? Math.max(...agencies.map((a) => a.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    agencies.push(newAgency)

    if (saveAgencies(agencies)) {
      res.status(201).json({
        success: true,
        data: newAgency,
        message: '添加代办成功'
      })
    } else {
      throw new Error('保存代办数据失败')
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加代办失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 更新代办
router.put('/:id', (req, res) => {
  try {
    const agencies = getAgencies()
    const index = agencies.findIndex((a) => a.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '代办不存在'
      })
    }

    const updatedAgency = {
      ...agencies[index],
      ...req.body as AgencyForm,
      id: agencies[index].id, // 保持 ID 不变
      updatedAt: new Date().toISOString()
    }

    agencies[index] = updatedAgency

    if (saveAgencies(agencies)) {
      res.json({
        success: true,
        data: updatedAgency,
        message: '更新代办成功'
      })
    } else {
      throw new Error('保存代办数据失败')
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新代办失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 删除代办
router.delete('/:id', (req, res) => {
  try {
    const agencies = getAgencies()
    const index = agencies.findIndex((a) => a.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '代办不存在'
      })
    }

    const deletedAgency = agencies[index]
    agencies.splice(index, 1)

    if (saveAgencies(agencies)) {
      res.json({
        success: true,
        data: deletedAgency,
        message: '删除代办成功'
      })
    } else {
      throw new Error('保存代办数据失败')
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除代办失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

export default router
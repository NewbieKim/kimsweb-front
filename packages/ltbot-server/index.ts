import express from 'express'
import cors from 'cors'
import { Product } from './types'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import statisticsRouter from './routes/statistics.js'
import agencyRouter from './routes/agency.js'
import articleRouter from './routes/article.js'
import chatRouter from './routes/chat.js'
import { initRedis } from './db/redis.js'

const app = express()
const port = 3000

// 初始化 Redis 连接
initRedis().catch(err => console.error('Redis Init Failed:', err))

// ES Module 兼容性处理
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 启用 CORS - 已由 Nginx 统一处理，注释掉避免重复
// app.use(cors())
app.use(express.json())

const STORAGE_FILE = path.join(__dirname, 'products.json')
// 默认数据
const defaultProducts: Product[] = [
  {
    id: 1,
    name: 'iPhone 13',
    price: 5999,
    description: '最新款iPhone手机',
    image: 'https://picsum.photos/300/300',
    category: 'phones',
    stock: 100,
    status: 'on',
    createdAt: '2024-03-20',
    updatedAt: '2024-03-20'
  },
  {
    id: 2,
    name: 'MacBook Pro',
    price: 12999,
    description: '专业级笔记本电脑',
    image: 'https://picsum.photos/300/300',
    category: 'laptops',
    stock: 50,
    status: 'on',
    createdAt: '2024-03-20',
    updatedAt: '2024-03-20'
  }
]
// 从文件获取商品数据
const getProducts = (): Product[] => {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8')
      console.info('数据', data)
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading products file:', error)
  }

  // 保存默认数据到文件
  saveProducts(defaultProducts)
  return defaultProducts
}

// 存储商品数据到文件
const saveProducts = (products: Product[]): boolean => {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(products, null, 2))
    return true
  } catch (error) {
    console.error('Error writing products file:', error)
    return false
  }
}

// 获取所有商品（管理后台）
app.get('/api/products-all', (req, res) => {
  try {
    const products = getProducts()
    res.json({
      success: true,
      data: products,
      message: '获取商品列表成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取商品列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取上架商品（前台）
app.get('/api/products', (req, res) => {
  try {
    const products = getProducts()
    // 只返回上架的商品
    const activeProducts = products.filter((p) => p.status === 'on')
    res.json({
      success: true,
      data: activeProducts,
      message: '获取商品列表成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取商品列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取单个商品
app.get('/api/products/:id', (req, res) => {
  try {
    const products = getProducts()
    const product = products.find((p) => p.id === parseInt(req.params.id))
    if (product) {
      res.json({
        success: true,
        data: product,
        message: '获取商品详情成功'
      })
    } else {
      res.status(404).json({
        success: false,
        message: '商品不存在'
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取商品详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 添加商品
app.post('/api/products', (req, res) => {
  try {
    const products = getProducts()
    const newProduct: Product = {
      ...req.body,
      id: products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    products.push(newProduct)

    if (saveProducts(products)) {
      res.status(201).json({
        success: true,
        data: newProduct,
        message: '添加商品成功'
      })
    } else {
      throw new Error('保存商品数据失败')
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加商品失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 更新商品
app.put('/api/products/:id', (req, res) => {
  try {
    const products = getProducts()
    const index = products.findIndex((p) => p.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      })
    }

    const updatedProduct = {
      ...products[index],
      ...req.body,
      id: products[index].id, // 保持 ID 不变
      updatedAt: new Date().toISOString()
    }

    products[index] = updatedProduct

    if (saveProducts(products)) {
      res.json({
        success: true,
        data: updatedProduct,
        message: '更新商品成功'
      })
    } else {
      throw new Error('保存商品数据失败')
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新商品失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 删除商品
app.delete('/api/products/:id', (req, res) => {
  try {
    const products = getProducts()
    const index = products.findIndex((p) => p.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      })
    }

    const deletedProduct = products[index]
    products.splice(index, 1)

    if (saveProducts(products)) {
      res.json({
        success: true,
        data: deletedProduct,
        message: '删除商品成功'
      })
    } else {
      throw new Error('保存商品数据失败')
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除商品失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 获取统计数据
app.get('/api/statistics', (req, res) => {
  try {
    const products = getProducts()
    const totalProducts = products.length
    const activeProducts = products.filter((p) => p.status === 'on').length
    const inactiveProducts = totalProducts - activeProducts

    // 模拟数据
    const mockStats = {
      onlineUsers: Math.floor(Math.random() * 100) + 50, // 50-150之间的随机数
      networkTraffic: {
        incoming: Math.floor(Math.random() * 1024 * 1024 * 100), // 0-100MB的随机数
        outgoing: Math.floor(Math.random() * 1024 * 1024 * 80) // 0-80MB的随机数
      }
    }

    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts
        },
        onlineUsers: mockStats.onlineUsers,
        networkTraffic: mockStats.networkTraffic,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 添加统计路由
app.use('/api/statistics', statisticsRouter)

// 添加代办路由
app.use('/api/agencies', agencyRouter)

// 添加文章路由 (Redis)
app.use('/api/articles', articleRouter)

// 添加聊天路由 (Redis)
app.use('/api/chat', chatRouter)

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`)
  console.log(`📡 Chat API: http://localhost:${port}/api/chat`)
})

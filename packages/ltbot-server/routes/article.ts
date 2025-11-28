import express, { Router, Request, Response, NextFunction } from 'express'
import { articleRepository } from '../db/redis.js'
import { EntityId } from 'redis-om' // 导入 EntityId 类型，作用是获取Redis OM 实体的唯一ID

// 辅助函数：将 Redis OM 实体转换为普通对象并添加 entityId
const toArticleWithId = (article: any) => {
  const id = article[EntityId]
  return {
    ...article,
    entityId: id
  }
}

// 中间件：检查 Redis 连接状态
const checkRedisConnection = (req: Request, res: Response, next: NextFunction) => {
  // 简单检查：尝试访问 repository 的客户端
  const client = (articleRepository as any).client
  if (!client || !client.isOpen) {
    return res.status(503).json({
      success: false,
      message: 'Redis 服务未连接，文章功能暂时不可用',
      tip: '请启动 Redis 服务：docker run -d -p 6379:6379 redis/redis-stack:latest'
    })
  }
  next()
}

const router: Router = express.Router()

// 对所有文章路由应用 Redis 连接检查
router.use(checkRedisConnection)

// 1. 创建文章
router.post('/saveArticle', async (req, res) => {
  try {
    const { title, content, author, category, tags, summary, status } = req.body
    const article = await articleRepository.save({
      title,
      content,
      summary: summary || content.substring(0, 100),
      author: author || 'Admin',
      category: category || 'Uncategorized',
      tags: tags || [],
      views: 0,
      status: status || 'published',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    res.status(201).json({
      success: true,
      data: toArticleWithId(article),
      message: '文章创建成功'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建失败', error: String(error) })
  }
})

// 2. 获取文章列表 (支持分页)
router.get('/getArticleList', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const offset = (page - 1) * pageSize
    // Redis OM 的 search().return.page() 方法
    const articles = await articleRepository.search()
      .return.page(offset, pageSize)
    // 添加 entityId 到每个文章对象
    const articlesWithId = articles.map(toArticleWithId)
    // 获取总数（近似值）
    const total = await articleRepository.search().return.count()
    res.json({
      success: true,
      data: articlesWithId,
      pagination: {
        page,
        pageSize,
        total
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取列表失败', error: String(error) })
  }
})

// 3. 搜索文章 (全文检索)
// 注意：使用简单字符串匹配，不依赖 RediSearch
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.status(400).json({ success: false, message: '缺少查询关键字 q' })

    // 降级方案：获取所有文章，在内存中进行简单过滤
    const allArticles = await articleRepository.search().return.all()
    const keyword = (q as string).toLowerCase()
    
    const filteredArticles = allArticles.filter(article => 
      article.title?.toLowerCase().includes(keyword) || 
      article.content?.toLowerCase().includes(keyword)
    )

    const articlesWithId = filteredArticles.map(toArticleWithId)

    res.json({
      success: true,
      data: articlesWithId,
      message: '使用简单匹配（无全文搜索支持）'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '搜索失败', error: String(error) })
  }
})

// 4. 获取单篇文章详情
router.get('/:id', async (req, res) => {
  try {
    console.log('req.params', req.params)
    const { id } = req.params
    const article = await articleRepository.fetch(id)
    // redis-om 如果找不到ID，可能会返回空对象或null，需要判断
    if (!article || Object.keys(article).length === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' })
    }
    // 增加阅读数 (异步处理，不阻塞响应)
    // 注意：直接修改 fetch 出来的对象并 save 即可
    article.views = (article.views as number || 0) + 1
    await articleRepository.save(article)
    res.json({
      success: true,
      data: toArticleWithId(article)
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取详情失败', error: String(error) })
  }
})

// 5. 更新文章
router.put('/updateArticle:id', async (req, res) => {
  try {
    const { id } = req.params
    const article = await articleRepository.fetch(id) // 获取数据库指定ID的实体对象
    if (!article || Object.keys(article).length === 0) {
      return res.status(404).json({ success: false, message: '文章不存在' })
    }
    // 更新字段
    const { title, content, category, tags, status, summary } = req.body
    if (title) article.title = title
    if (content) article.content = content
    if (summary) article.summary = summary
    if (category) article.category = category
    if (tags) article.tags = tags
    if (status) article.status = status
    article.updatedAt = new Date()
    await articleRepository.save(article)
    res.json({
      success: true,
      data: toArticleWithId(article),
      message: '更新成功'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败', error: String(error) })
  }
})

// 6. 删除文章
router.delete('/deleteArticle/:id', async (req, res) => {
  try {
    const { id } = req.params
    await articleRepository.remove(id)
    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除失败', error: String(error) })
  }
})

export default router


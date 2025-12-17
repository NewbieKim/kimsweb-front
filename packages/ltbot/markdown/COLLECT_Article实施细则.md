爬取文章技术方案
作为一名资深全栈工程师，我来给你设计一个完整的掘金文章聚合系统技术方案。
📋 技术方案概述
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  掘金官网   │ ───> │  爬虫服务    │ ───> │  数据库     │
│ juejin.cn   │      │  (Node.js)   │      │ (MongoDB)   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐      ┌─────────────┐
                     │  定时任务    │      │  API服务    │
                     │  (Schedule)  │      │  (Express)  │
                     └──────────────┘      └─────────────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │  前端展示   
                                            │  (Vue 3)    │
                                            └─────────────┘
一、系统架构设计
1.1 整体架构
技术栈选型：
├── 爬虫服务
│   ├── Node.js + TypeScript
│   ├── Puppeteer / Playwright (浏览器自动化)
│   ├── Axios (HTTP请求)
│   └── Cheerio (HTML解析)
│
├── 后端服务
│   ├── Express / Nest.js
│   ├── MongoDB / PostgreSQL
│   ├── Redis (缓存)
│   └── node-schedule (定时任务)
│
└── 前端集成
    ├── Vue 3 + TypeScript
    ├── Pinia (状态管理)
    └── Axios (API调用)
二、核心功能点详细设计
2.1 爬虫服务模块
📌 功能点1：掘金文章爬取
目标URL分析：
// 推荐文章
https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed
// 最新文章
https://api.juejin.cn/content_api/v1/article/list_by_time

// 文章详情
https://api.juejin.cn/content_api/v1/article/detail
实现要点：
● ✅ 识别掘金API接口（推荐、最新、详情）
● ✅ 请求头伪装（User-Agent、Cookie等）
● ✅ 代理IP池（防止封禁）
● ✅ 请求频率控制（防止反爬）
● ✅ 错误重试机制
● ✅ 数据提取和清洗
interface JuejinArticle {
  article_id: string
  title: string
  brief_content: string  // 摘要
  cover_image: string
  category_name: string  // 分类
  tag_list: string[]     // 标签
  author_name: string
  view_count: number
  collect_count: number  // 点赞数
  digg_count: number     // 收藏数
  comment_count: number
  ctime: number          // 发布时间
  article_info: {
    mark_content: string // Markdown内容
  }
}
📌 功能点2：反爬虫策略
// 策略清单
1. User-Agent轮换
2. Cookie管理（模拟登录状态）
3. 请求间隔随机化（300ms - 3s）
4. IP代理池（可选）
5. 请求头完整性（Referer、Accept等）
6. 浏览器指纹伪装
7. 验证码识别（如遇到）
📌 功能点3：数据提取和转换
class ArticleExtractor {
  // 提取文章列表
  extractArticleList(response: any): Article[]
  
  // 提取文章详情
  extractArticleDetail(response: any): ArticleDetail
  
  // 数据清洗和格式化
  cleanData(data: any): CleanedArticle
  
  // Markdown内容处理
  processMarkdown(markdown: string): string
  
  // 图片URL处理（CDN链接）
  processImageUrl(url: string): string
}

2.2 数据存储模块
📌 功能点4：数据库设计
MongoDB Schema设计：
// 文章表
interface ArticleSchema {
  _id: ObjectId
  article_id: string          // 掘金文章ID（唯一索引）
  title: string
  summary: string
  content: string             // Markdown内容
  html_content?: string       // HTML渲染内容
  cover_image: string
  category: string
  tags: string[]
  author: {
    name: string
    avatar: string
    user_id: string
  }
  stats: {
    views: number
    likes: number
    comments: number
    collects: number
  }
  source: 'juejin'           // 来源标识
  source_url: string         // 原文链接
  crawl_time: Date           // 爬取时间
  publish_time: Date         // 发布时间
  update_time: Date          // 更新时间
  status: 'pending' | 'published' | 'deleted'
  quality_score?: number     // 质量评分（可选）
}

// 爬取任务表
interface CrawlTaskSchema {
  _id: ObjectId
  task_type: 'recommend' | 'latest'
  status: 'pending' | 'running' | 'success' | 'failed'
  start_time: Date
  end_time?: Date
  articles_count: number
  error_message?: string
  config: {
    page: number
    page_size: number
  }
}

// 爬取日志表
interface CrawlLogSchema {
  _id: ObjectId
  task_id: ObjectId
  level: 'info' | 'warn' | 'error'
  message: string
  timestamp: Date
  metadata?: any
}
📌 功能点5：数据去重策略
class DeduplicationService {
  // 基于文章ID去重
  async checkDuplicateById(article_id: string): Promise<boolean>
  
  // 基于标题相似度去重
  async checkDuplicateByTitle(title: string): Promise<boolean>
  
  // 更新已存在文章的统计数据
  async updateArticleStats(article_id: string, stats: Stats): Promise<void>
  
  // 合并重复文章
  async mergeArticles(oldArticle: Article, newArticle: Article): Promise<Article>
}

2.3 定时任务模块
📌 功能点6：定时爬取调度
import schedule from 'node-schedule'

class CrawlScheduler {
  // 每小时爬取推荐文章
  scheduleRecommendCrawl() {
    schedule.scheduleJob('0 * * * *', async () => {
      await this.crawlRecommendArticles()
    })
  }
  
  // 每30分钟爬取最新文章
  scheduleLatestCrawl() {
    schedule.scheduleJob('*/30 * * * *', async () => {
      await this.crawlLatestArticles()
    })
  }
  
  // 每天凌晨3点清理过期数据
  scheduleCleanup() {
    schedule.scheduleJob('0 3 * * *', async () => {
      await this.cleanupOldArticles()
    })
  }
  
  // 每周日更新文章质量评分
  scheduleQualityUpdate() {
    schedule.scheduleJob('0 2 * * 0', async () => {
      await this.updateQualityScores()
    })
  }
}
📌 功能点7：任务队列管理
// 使用 Bull Queue 实现
import Bull from 'bull'

const crawlQueue = new Bull('crawl-queue', {
  redis: { host: 'localhost', port: 6379 }
})

// 添加任务
crawlQueue.add('crawl-recommend', {
  page: 1,
  pageSize: 20
}, {
  attempts: 3,              // 重试3次
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: true
})

// 处理任务
crawlQueue.process('crawl-recommend', async (job) => {
  return await crawlService.crawlRecommend(job.data)
})

2.4 API服务模块
📌 功能点8：RESTful API设计
// API路由设计
router.get('/api/articles/recommend', getRecommendArticles)
router.get('/api/articles/latest', getLatestArticles)
router.get('/api/articles/:id', getArticleDetail)
router.get('/api/articles/search', searchArticles)
router.get('/api/articles/categories', getCategories)
router.get('/api/articles/tags', getTags)

// API响应格式
interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 推荐文章接口
interface RecommendArticlesQuery {
  page?: number
  page_size?: number
  category?: string
  tags?: string[]
}

interface RecommendArticlesResponse {
  articles: Article[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}
📌 功能点9：缓存策略
import Redis from 'ioredis'

class CacheService {
  private redis: Redis
  
  // 缓存推荐文章列表（5分钟）
  async cacheRecommendArticles(articles: Article[]): Promise<void> {
    await this.redis.setex(
      'articles:recommend',
      300,
      JSON.stringify(articles)
    )
  }
  
  // 缓存文章详情（1小时）
  async cacheArticleDetail(id: string, article: Article): Promise<void> {
    await this.redis.setex(
      `article:detail:${id}`,
      3600,
      JSON.stringify(article)
    )
  }
  
  // 缓存热门标签（24小时）
  async cacheHotTags(tags: string[]): Promise<void> {
    await this.redis.setex('tags:hot', 86400, JSON.stringify(tags))
  }
}

2.5 数据质量模块
📌 功能点10：文章质量评分
class QualityScoreService {
  // 计算质量评分（0-100分）
  calculateQualityScore(article: Article): number {
    const scores = {
      views: this.normalizeViews(article.stats.views),        // 30%
      likes: this.normalizeLikes(article.stats.likes),        // 25%
      comments: this.normalizeComments(article.stats.comments), // 15%
      contentLength: this.scoreContentLength(article.content), // 15%
      titleQuality: this.scoreTitleQuality(article.title),    // 10%
      freshness: this.scoreFreshness(article.publish_time)    // 5%
    }
    
    return (
      scores.views * 0.3 +
      scores.likes * 0.25 +
      scores.comments * 0.15 +
      scores.contentLength * 0.15 +
      scores.titleQuality * 0.1 +
      scores.freshness * 0.05
    )
  }
  
  // 内容长度评分
  private scoreContentLength(content: string): number {
    const length = content.length
    if (length < 500) return 20
    if (length < 1500) return 60
    if (length < 3000) return 100
    return 90 // 太长反而扣分
  }
  
  // 标题质量评分
  private scoreTitleQuality(title: string): number {
    let score = 50
    
    // 长度适中
    if (title.length >= 10 && title.length <= 50) score += 20
    
    // 包含数字（如：5个技巧）
    if (/\d+/.test(title)) score += 15
    
    // 包含关键词
    const keywords = ['实战', '深入', '详解', '指南', '教程', '优化']
    if (keywords.some(kw => title.includes(kw))) score += 15
    
    return Math.min(score, 100)
  }
}
📌 功能点11：内容过滤和审核
class ContentFilterService {
  // 敏感词过滤
  filterSensitiveWords(content: string): string
  
  // 低质量内容过滤
  async isLowQuality(article: Article): Promise<boolean> {
    // 标题过短
    if (article.title.length < 5) return true
    
    // 内容过短
    if (article.content.length < 200) return true
    
    // 标题党检测
    if (this.isClickbait(article.title)) return true
    
    // 重复内容检测
    if (await this.isDuplicate(article)) return true
    
    return false
  }
  
  // 标题党检测
  private isClickbait(title: string): boolean {
    const patterns = [
      /震惊/,
      /必看/,
      /不看后悔/,
      /你绝对不知道/
    ]
    return patterns.some(pattern => pattern.test(title))
  }
}

2.6 前端集成模块
📌 功能点12：前端API调用
// src/api/articles.ts
import axios from 'axios'

class ArticleAPI {
  // 获取推荐文章
  async getRecommendArticles(params: {
    page?: number
    page_size?: number
    category?: string
  }) {
    return axios.get('/api/articles/recommend', { params })
  }
  
  // 获取最新文章
  async getLatestArticles(params: {
    page?: number
    page_size?: number
  }) {
    return axios.get('/api/articles/latest', { params })
  }
  
  // 获取文章详情
  async getArticleDetail(id: string) {
    return axios.get(`/api/articles/${id}`)
  }
  
  // 搜索文章
  async searchArticles(keyword: string) {
    return axios.get('/api/articles/search', {
      params: { keyword }
    })
  }
}
📌 功能点13：状态管理
// stores/articleStore.ts
import { defineStore } from 'pinia'

export const useArticleStore = defineStore('article', {
  state: () => ({
    recommendArticles: [] as Article[],
    latestArticles: [] as Article[],
    currentArticle: null as Article | null,
    loading: false,
    error: null as string | null
  }),
  
  actions: {
    async fetchRecommendArticles() {
      this.loading = true
      try {
        const { data } = await articleAPI.getRecommendArticles()
        this.recommendArticles = data.articles
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async refreshArticles() {
      await Promise.all([
        this.fetchRecommendArticles(),
        this.fetchLatestArticles()
      ])
    }
  }
})

三、部署和运维
3.1 Docker容器化部署
# docker-compose.yml
version: '3.8'

services:
  # 爬虫服务
  crawler:
    build: ./crawler
    environment:
      - MONGODB_URI=mongodb://mongo:27017/juejin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    restart: always
  
  # API服务
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/juejin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
  
  # MongoDB
  mongo:
    image: mongo:6.0
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"
  
  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
volumes:
  mongo-data:
3.2 监控和告警
// 功能点14：监控指标
interface MonitorMetrics {
  // 爬虫健康度
  crawler: {
    success_rate: number      // 成功率
    avg_response_time: number // 平均响应时间
    error_count: number       // 错误次数
    articles_per_hour: number // 每小时爬取文章数
  }
  
  // 数据库指标
  database: {
    total_articles: number
    today_added: number
    storage_size: number
  }
  
  // API性能
  api: {
    qps: number              // 每秒查询数
    avg_latency: number      // 平均延迟
    cache_hit_rate: number   // 缓存命中率
  }
}

// 告警配置
const alertConfig = {
  crawler_error_threshold: 10,      // 错误次数超过10次
  api_latency_threshold: 1000,      // API延迟超过1秒
  storage_warning_threshold: 0.8    // 存储空间使用超过80%
}

四、风险和注意事项
4.1 法律和道德风险
⚠️ 重要提示：
1. 遵守网站robots.txt协议
2. 尊重原创内容版权
3. 标注文章来源和原文链接
4. 不进行商业化使用
5. 控制爬取频率，避免对服务器造成压力
6. 建议：优先使用掘金官方API（如果提供）
4.2 技术风险
1. 反爬虫升级导致爬虫失效
   → 解决：定期维护爬虫代码，快速适配

2. API接口变更
   → 解决：版本兼容处理，多版本适配

3. 数据存储膨胀
   → 解决：定期清理、数据归档

4. IP被封禁
   → 解决：IP代理池、降低爬取频率

5. 掘金加密和混淆
   → 解决：浏览器自动化（Puppeteer）

五、实施路线图
阶段一：MVP（最小可行产品）- 2周
Week 1:
✅ 搭建基础项目架构
✅ 实现简单的HTTP爬虫
✅ 设计数据库Schema
✅ 完成基础API接口

Week 2:
✅ 实现定时任务
✅ 前端集成展示
✅ 基础测试和调试
阶段二：功能完善 - 2周
Week 3:
✅ 添加反爬虫策略
✅ 实现数据去重
✅ 添加缓存机制
✅ 质量评分系统

Week 4:
✅ 监控和日志系统
✅ 错误处理和重试
✅ 性能优化
✅ 文档编写
阶段三：优化和扩展 - 持续
✅ 支持更多内容源（CSDN、博客园等）
✅ 智能推荐算法
✅ 用户行为分析
✅ 全文搜索（Elasticsearch）
✅ 内容分类优化
✅ 移动端适配

六、代码示例（核心模块）
爬虫核心代码框架
// src/crawler/JuejinCrawler.ts
export class JuejinCrawler {
  private httpClient: AxiosInstance
  private rateLimiter: RateLimiter
  
  async crawlRecommendArticles(page: number = 1): Promise<Article[]> {
    try {
      // 请求限流
      await this.rateLimiter.wait()
      
      // 发送请求
      const response = await this.httpClient.post(
        'https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed',
        {
          id_type: 2,
          client_type: 2608,
          sort_type: 300,
          cursor: String((page - 1) * 20),
          limit: 20
        },
        {
          headers: this.getHeaders()
        }
      )
      
      // 提取数据
      const articles = this.extractArticles(response.data)
      
      // 保存到数据库
      await this.saveArticles(articles)
      
      return articles
    } catch (error) {
      await this.handleError(error)
      throw error
    }
  }
  
  private getHeaders() {
    return {
      'User-Agent': this.getRandomUserAgent(),
      'Referer': 'https://juejin.cn/',
      'Cookie': this.getCookie()
    }
  }
}

这个方案涵盖了从爬虫、存储、API到前端展示的完整技术栈，你觉得哪部分需要我详细展开实现？🚀
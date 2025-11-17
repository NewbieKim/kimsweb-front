<template>
  <div class="blog-container">
    <!-- 头部导航标签 -->
    <div class="tabs-container">
      <div class="tabs-wrapper">
        <div class="tabs-left">
          <div 
            v-for="tab in tabs" 
            :key="tab"
            class="tab-item"
            :class="{ 'active': selectedTab === tab }"
            @click="selectTab(tab)"
          >
            {{ tab }}
          </div>
        </div>
        <div class="tabs-right">
          <button class="write-btn" @click="goToEditor">
            <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0-32 14.3-32 32V144c0-17.7-14.3-32-32-32zM513.1 518.1l-192 161c-5.2 4.4-13.1.7-13.1-6.1v-62.7c0-2.3 1.1-4.6 2.9-6.1L420.7 512l-109.8-92.2a7.63 7.63 0 0 1-2.9-6.1V351c0-6.8 7.9-10.5 13.1-6.1l192 160.9c3.9 3.2 3.9 9.1 0 12.3z" fill="currentColor"/>
            </svg>
            写文章
          </button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <!-- 文章列表 -->
      <div class="article-list">
        <article 
          v-for="article in filteredArticles" 
          :key="article.id"
          class="article-item"
          @click="navigateToArticle(article.link, article)"
        >
          <!-- 左侧内容区域 -->
          <div class="article-content">
            <!-- 文章标题 -->
            <h2 class="article-title">
              {{ article.title }}
              <span v-if="article.status === 'draft'" class="draft-badge">草稿</span>
            </h2>
            
            <!-- 文章摘要 -->
            <p class="article-summary">{{ article.content }}</p>
            
            <!-- 底部信息栏 -->
            <div class="article-footer">
              <!-- 作者信息 -->
              <div class="author-info">
                <span class="author-name">{{ article.author }}</span>
                <span class="separator">·</span>
                <span class="article-date">{{ article.date }}</span>
              </div>
              
              <!-- 统计信息 -->
              <div class="article-stats">
                <span class="stat-item">
                  <svg class="stat-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path d="M512 128C300.8 128 128 300.8 128 512s172.8 384 384 384 384-172.8 384-384S723.2 128 512 128z m0 704c-176 0-320-144-320-320s144-320 320-320 320 144 320 320-144 320-320 320z" fill="currentColor"/>
                    <path d="M512 288c-17.6 0-32 14.4-32 32v192c0 17.6 14.4 32 32 32s32-14.4 32-32V320c0-17.6-14.4-32-32-32z" fill="currentColor"/>
                    <path d="M512 640m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z" fill="currentColor"/>
                  </svg>
                  {{ article.views }}
                </span>
                <span class="stat-item">
                  <svg class="stat-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path d="M885.9 533.7c16.8-22.2 26.1-49.4 26.1-77.7 0-44.9-25.1-87.4-65.5-111.1a67.67 67.67 0 0 0-34.3-9.3H572.4l6-122.9c1.4-29.7-9.1-57.9-29.5-79.4-20.5-21.5-48.1-33.4-77.9-33.4-52 0-98 35-111.8 85.1l-85.9 311h-.3v428h472.3c9.2 0 18.2-1.8 26.5-5.4 47.6-20.3 78.3-66.8 78.3-118.4 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7-.2-12.6-2-25.1-5.6-37.1zM112 528v364c0 17.7 14.3 32 32 32h65V496h-65c-17.7 0-32 14.3-32 32z" fill="currentColor"/>
                  </svg>
                  {{ article.likes }}
                </span>
              </div>
            </div>
            
            <!-- 标签 -->
            <div class="article-tags">
              <span 
                v-for="tag in article.tags.slice(0, 3)" 
                :key="tag"
                class="tag-item"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          
          <!-- 右侧图片 -->
          <div class="article-image">
            <img :src="article.image" :alt="article.title" />
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// 定义文章接口
interface Article {
  id: number | string
  title: string
  category: string
  content: string
  image: string
  link: string
  author: string
  date: string
  views: number
  likes: number
  tags: string[]
  status?: 'draft' | 'published'
}

// Mock数据 - 丰富的技术文章
const mockArticleData: Article[] = [
  {
    id: 1,
    title: "Java大厂面试版，来自字节跳动（亲自经历）",
    category: "Java",
    content: "**1.1 该谈你对ThreadLocal的理解？ ** ThreadLocal的作用主要是做数据隔离，填充的数据只属于当前线程，变量的数据对别的线程而言是相对隔离的，在多线程环境下，防止自己的变量被其它线程篡改。",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/java-interview-bytedance",
    author: "Java水解",
    date: "2024-01-20",
    views: 101,
    likes: 1,
    tags: ["Java", "面试", "架构"]
  },
  {
    id: 2,
    title: 'React 5 个 "隐形坑"：上线前没注意，debug 到凌晨 3 点',
    category: "前端",
    content: 'React 5 个 "隐形坑"：上线前没注意，debug 到凌晨 3 点 用了这么久的React，我发现一个扎心的事实：React 自己不会出 bug，但你的代码会。',
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/react-hidden-pitfalls",
    author: "zzpper",
    date: "2024-01-19",
    views: 72,
    likes: 7,
    tags: ["前端", "React.js", "JavaScript"]
  },
  {
    id: 3,
    title: "电子发票解析工具-golang服务端开发案例详解",
    category: "后端",
    content: "本项目是上一篇【# 电子发票解析工具-c#桌面应用开发案例详解】的服务端开发案例详解，采用MVC架构模式设计，主要涉及技术：Gin框架、GORM、JWT、跨域处理等。",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/golang-invoice-parser",
    author: "光头闪亮亮",
    date: "2024-01-18",
    views: 169,
    likes: 1,
    tags: ["Go", "后端", "开发"]
  },
  {
    id: 4,
    title: '🍀面试追问："除了 Promise，还有哪些微任务？"',
    category: "前端",
    content: "本文用 3 分钟 + 3 个实战，带你吃透 queueMicrotask 与 MutationObserver。",
    image: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/microtask-interview",
    author: "404星球的猫",
    date: "2024-01-17",
    views: 3500,
    likes: 51,
    tags: ["前端", "JavaScript", "面试"]
  },
  {
    id: 5,
    title: "学习React-DnD: 核心组件与Hooks",
    category: "前端",
    content: "上一篇我们完成了React-DnD的环境搭建，通过安装依赖和全局注入后端，让整个应用具备了拖拽能力。接下来，就让我们一起深入探索 React-DnD 的核心组件和 Hooks，看看它们是如何协同工作的。",
    image: "https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/react-dnd-tutorial",
    author: "Wect",
    date: "2024-01-16",
    views: 34,
    likes: 0,
    tags: ["前端", "React", "DnD"]
  },
  {
    id: 6,
    title: "Spring Boot中很多Advice后缀的注解和类，都是干什么的",
    category: "后端",
    content: '在Spring Boot中，"Advice"这个词确实出现在不同的上下文，主要分为两大职责：面向切面编程（AOP）中的增强、异常处理和全局响应处理。',
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/spring-boot-advice",
    author: "Java技术指北",
    date: "2024-01-15",
    views: 256,
    likes: 12,
    tags: ["Spring Boot", "Java", "后端"]
  },
  {
    id: 7,
    title: "Vue 3.5 新特性深度解读：性能优化与开发体验提升",
    category: "前端",
    content: "Vue 3.5 带来了许多令人兴奋的新特性和优化，包括响应式系统优化、Suspense稳定版、Teleport增强等。本文将深入解读这些新特性。",
    image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/vue3-5-new-features",
    author: "Vue技术栈",
    date: "2024-01-14",
    views: 892,
    likes: 45,
    tags: ["Vue3", "前端", "性能优化"]
  },
  {
    id: 8,
    title: "TypeScript 类型体操：从入门到精通",
    category: "前端",
    content: "TypeScript的类型系统非常强大，掌握类型体操能让你的代码更加健壮。本文通过实例讲解泛型、条件类型、映射类型等高级特性。",
    image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/typescript-gymnastics",
    author: "TypeScript专家",
    date: "2024-01-13",
    views: 445,
    likes: 28,
    tags: ["TypeScript", "前端", "类型系统"]
  },
  {
    id: 9,
    title: "微前端架构实战：qiankun + Vue3 完整方案",
    category: "架构",
    content: "微前端是当下热门的前端架构方案。本文介绍如何使用qiankun框架搭建基于Vue3的微前端应用，包括主应用配置、子应用接入、状态共享等。",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/micro-frontend-qiankun",
    author: "前端架构师",
    date: "2024-01-12",
    views: 678,
    likes: 34,
    tags: ["微前端", "架构", "Vue3"]
  },
  {
    id: 10,
    title: "Vite 5.0 性能优化实践：构建速度提升 300%",
    category: "前端",
    content: "Vite 5.0 带来了显著的性能提升。本文分享在大型项目中使用Vite的优化经验，包括依赖预构建、按需加载、缓存策略等。",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/vite5-performance",
    author: "Vite开发者",
    date: "2024-01-11",
    views: 1234,
    likes: 89,
    tags: ["Vite", "性能优化", "前端工程化"]
  },
  {
    id: 11,
    title: "Nest.js 企业级应用开发实战指南",
    category: "后端",
    content: "Nest.js是一个强大的Node.js框架，适合构建企业级应用。本文详细介绍Nest.js的模块化架构、依赖注入、中间件、守卫等核心概念。",
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/nestjs-enterprise",
    author: "后端工程师",
    date: "2024-01-10",
    views: 567,
    likes: 23,
    tags: ["Nest.js", "Node.js", "后端"]
  },
  {
    id: 12,
    title: "Docker + Kubernetes 容器化部署完整实践",
    category: "运维",
    content: "容器化是现代应用部署的标准方式。本文介绍如何使用Docker构建镜像，并通过Kubernetes进行容器编排和自动化部署。",
    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=200&h=120&fit=crop",
    link: "https://juejin.cn/post/docker-k8s-deploy",
    author: "DevOps专家",
    date: "2024-01-09",
    views: 789,
    likes: 41,
    tags: ["Docker", "Kubernetes", "运维"]
  }
]

const router = useRouter()
const route = useRoute()

// 标签页
const tabs = ref(['推荐', '最新', '我的'])
const selectedTab = ref('推荐')

// 文章列表
const articles = ref<Article[]>(mockArticleData)
const myDrafts = ref<Article[]>([])
const myPublished = ref<Article[]>([])

// 根据选择的标签过滤文章
const filteredArticles = computed(() => {
  if (selectedTab.value === '最新') {
    return [...articles.value].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  } else if (selectedTab.value === '我的') {
    // 显示我的草稿和已发布文章
    return [...myPublished.value, ...myDrafts.value]
  }
  return articles.value
})

// 加载我的文章
const loadMyArticles = () => {
  // 从localStorage加载草稿
  const drafts = JSON.parse(localStorage.getItem('article_drafts') || '[]')
  myDrafts.value = drafts.map((draft: any) => ({
    id: draft.id,
    title: draft.title,
    category: draft.category || '未分类',
    content: draft.content.replace(/[#*`\[\]]/g, '').trim().substring(0, 200),
    image: draft.image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=120&fit=crop',
    link: '',
    author: 'kim',
    date: new Date(draft.updatedAt).toLocaleDateString('zh-CN'),
    views: 0,
    likes: 0,
    tags: draft.tags || [],
    status: 'draft'
  }))
  
  // 从localStorage加载已发布文章
  const published = JSON.parse(localStorage.getItem('article_published') || '[]')
  myPublished.value = published.map((article: any) => ({
    ...article,
    content: article.summary || article.content.replace(/[#*`\[\]]/g, '').trim().substring(0, 200),
    status: 'published'
  }))
}

// 选择标签
const selectTab = (tab: string) => {
  selectedTab.value = tab
  if (tab === '我的') {
    loadMyArticles()
  }
}

// 跳转到文章
const navigateToArticle = (link: string, article?: any) => {
  // 如果是我的文章，且状态是草稿，跳转到编辑页面
  if (selectedTab.value === '我的') {
    router.push({ path: '/blog/editor', query: { draftId: article.id } })
    return
  }
  
  if (link && link.startsWith('http')) {
    window.open(link, '_blank')
  } else if (link) {
    router.push(link)
  }
}

// 跳转到编辑器
const goToEditor = () => {
  router.push('/blog/editor')
}

// 组件挂载时检查URL参数
onMounted(() => {
  const tab = route.query.tab as string
  if (tab && tabs.value.includes(tab === 'mine' ? '我的' : tab)) {
    selectedTab.value = tab === 'mine' ? '我的' : tab
    if (selectedTab.value === '我的') {
      loadMyArticles()
    }
  }
})
</script>

<style scoped lang="scss">
.blog-container {
  min-height: 100vh;
  background: #f4f5f5;
  
  // 顶部标签栏
  .tabs-container {
    background: #ffffff;
    border-bottom: 1px solid #e4e6eb;
    position: sticky;
    top: 0;
    z-index: 100;
    
    .tabs-wrapper {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      
      .tabs-left {
        display: flex;
        gap: 30px;
        
        .tab-item {
          padding: 18px 0;
          font-size: 16px;
          color: #71777c;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
          font-weight: 500;
          
          &:hover {
            color: #1e80ff;
          }
          
          &.active {
            color: #1e80ff;
            
            &::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: #1e80ff;
              border-radius: 1.5px;
            }
          }
        }
      }
      
      .tabs-right {
        .write-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: #1e80ff;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          
          .icon {
            width: 16px;
            height: 16px;
            fill: currentColor;
          }
          
          &:hover {
            background: #0066e6;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(30, 128, 255, 0.3);
          }
        }
      }
    }
  }
  
  // 内容容器
  .content-container {
    max-width: 960px;
    margin: 0 auto;
    padding: 20px;
    
    // 文章列表
    .article-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      
      // 单个文章项
      .article-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        background: #ffffff;
        padding: 18px 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 1px solid #e4e6eb;
        
        &:hover {
          background: #fafbfc;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          
          .article-title {
            color: #1e80ff;
          }
        }
        
        // 左侧内容区域
        .article-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 20px;
          
          // 文章标题
          .article-title {
            font-size: 18px;
            font-weight: 600;
            color: #252933;
            line-height: 1.5;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: color 0.2s;
            
            .draft-badge {
              display: inline-flex;
              align-items: center;
              padding: 2px 8px;
              background: #ffeaa7;
              color: #e17055;
              font-size: 12px;
              font-weight: 500;
              border-radius: 3px;
              flex-shrink: 0;
            }
          }
          
          // 文章摘要
          .article-summary {
            font-size: 14px;
            color: #8a919f;
            line-height: 1.6;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          // 底部信息栏
          .article-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            color: #8a919f;
            margin-top: auto;
            
            .author-info {
              display: flex;
              align-items: center;
              gap: 8px;
              
              .author-name {
                color: #8a919f;
              }
              
              .separator {
                color: #c2c8d1;
              }
              
              .article-date {
                color: #8a919f;
              }
            }
            
            .article-stats {
              display: flex;
              align-items: center;
              gap: 16px;
              
              .stat-item {
                display: flex;
                align-items: center;
                gap: 4px;
                color: #8a919f;
                
                .stat-icon {
                  width: 16px;
                  height: 16px;
                  fill: currentColor;
                }
              }
            }
          }
          
          // 标签区域
          .article-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
            
            .tag-item {
              padding: 3px 10px;
              background: #f4f5f5;
              color: #8a919f;
              font-size: 12px;
              border-radius: 2px;
              transition: all 0.2s;
              
              &:hover {
                background: #e4e6eb;
              }
            }
          }
        }
        
        // 右侧图片
        .article-image {
          flex-shrink: 0;
          width: 120px;
          height: 80px;
          border-radius: 4px;
          overflow: hidden;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }
        }
        
        &:hover .article-image img {
          transform: scale(1.05);
        }
      }
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .blog-container {
    .tabs-container .tabs-wrapper {
      padding: 0 15px;
      gap: 20px;
      
      .tab-item {
        font-size: 15px;
        padding: 15px 0;
      }
    }
    
    .content-container {
      padding: 10px;
      
      .article-list .article-item {
        padding: 15px;
        
        .article-content {
          padding-right: 12px;
          
          .article-title {
            font-size: 16px;
          }
          
          .article-summary {
            font-size: 13px;
            -webkit-line-clamp: 1;
            line-clamp: 1;
          }
          
          .article-footer {
            font-size: 12px;
            
            .article-stats {
              gap: 12px;
            }
          }
          
          .article-tags {
            display: none; // 移动端隐藏标签
          }
        }
        
        .article-image {
          width: 100px;
          height: 67px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .blog-container {
    .content-container {
      .article-list .article-item {
        flex-direction: column-reverse;
        
        .article-content {
          width: 100%;
          padding-right: 0;
        }
        
        .article-image {
          width: 100%;
          height: 180px;
          margin-bottom: 12px;
        }
      }
    }
  }
}
</style>
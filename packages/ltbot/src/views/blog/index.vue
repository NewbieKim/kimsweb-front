<template>
  <div class="min-h-screen bg-gray-50 py-8">
    123
    <!-- 头部区域 -->
    <div class="container mx-auto px-4 mb-8">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-4 md:mb-0">技术博客</h1>
        <div class="flex space-x-4">
          <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            写文章
          </button>
          <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            关注
          </button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- 左侧边栏 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 class="text-lg font-semibold mb-4">分类</h3>
            <div class="space-y-2">
              <div 
                v-for="category in categories" 
                :key="category"
                class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                :class="{ 'bg-blue-50 text-blue-600': selectedCategory === category }"
                @click="selectCategory(category)"
              >
                <span>{{ category }}</span>
                <span class="text-gray-400 text-sm">{{ getCategoryCount(category) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 文章列表 -->
        <div class="lg:col-span-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article 
              v-for="article in filteredArticles" 
              :key="article.id"
              class="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer group"
              @click="navigateToArticle(article.link)"
            >
              <!-- 文章图片 -->
              <div class="relative h-48 overflow-hidden">
                <img 
                  :src="article.image" 
                  :alt="article.title"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div class="absolute top-3 left-3">
                  <span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {{ article.category }}
                  </span>
                </div>
              </div>

              <!-- 文章内容 -->
              <div class="p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {{ article.title }}
                </h2>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">
                  {{ article.content }}
                </p>
                
                <!-- 标签区域 -->
                <div class="flex flex-wrap gap-2 mb-4">
                  <span 
                    v-for="tag in article.tags.slice(0, 3)" 
                    :key="tag"
                    class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                  >
                    {{ tag }}
                  </span>
                </div>

                <!-- 文章信息 -->
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <div class="flex items-center space-x-4">
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                      </svg>
                      {{ article.author }}
                    </span>
                    <span>{{ article.date }}</span>
                  </div>
                  <div class="flex items-center space-x-4">
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                      </svg>
                      {{ article.readTime }}
                    </span>
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                      </svg>
                      {{ article.likes }}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <!-- 分页 -->
          <div class="flex justify-center mt-8">
            <div class="flex space-x-2">
              <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                上一页
              </button>
              <button class="px-4 py-2 bg-blue-500 text-white rounded-lg">1</button>
              <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                2
              </button>
              <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// 定义文章接口
interface Article {
  id: number;
  title: string;
  category: string;
  content: string;
  image: string;
  link: string;
  author: string;
  date: string;
  readTime: string;
  likes: number;
  tags: string[];
}

// 模拟数据
const mockArticleData: Article[] = [
  {
    id: 1,
    title: "Vue3 + TypeScript 最佳实践：从入门到精通",
    category: "前端",
    content: "本文详细介绍了Vue3和TypeScript的结合使用，包括组合式API、类型定义、组件开发等最佳实践。通过实际案例演示如何构建类型安全的Vue应用。",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop",
    link: "/article/1",
    author: "前端小王子",
    date: "2024-01-15",
    readTime: "8分钟",
    likes: 256,
    tags: ["Vue3", "TypeScript", "前端", "最佳实践"]
  },
  {
    id: 2,
    title: "深入理解React Hooks：useEffect的完整指南",
    category: "前端",
    content: "React Hooks是React 16.8引入的重要特性，本文重点解析useEffect的使用场景、依赖数组、清理函数等核心概念。",
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=400&h=200&fit=crop",
    link: "/article/2",
    author: "React专家",
    date: "2024-01-14",
    readTime: "12分钟",
    likes: 189,
    tags: ["React", "Hooks", "useEffect", "前端"]
  },
  {
    id: 3,
    title: "Node.js性能优化：从基础到高级技巧",
    category: "后端",
    content: "Node.js作为服务端JavaScript运行时，性能优化至关重要。本文分享内存管理、事件循环、集群模式等优化策略。",
    image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=200&fit=crop",
    link: "/article/3",
    author: "Node.js大师",
    date: "2024-01-13",
    readTime: "15分钟",
    likes: 324,
    tags: ["Node.js", "性能优化", "后端", "JavaScript"]
  },
  {
    id: 4,
    title: "微服务架构设计模式与实践",
    category: "架构",
    content: "微服务架构已经成为现代应用开发的主流选择。本文介绍服务发现、配置管理、熔断器等核心设计模式。",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop",
    link: "/article/4",
    author: "架构师老王",
    date: "2024-01-12",
    readTime: "20分钟",
    likes: 421,
    tags: ["微服务", "架构", "设计模式", "分布式"]
  },
  {
    id: 5,
    title: "Docker容器化部署完整指南",
    category: "运维",
    content: "Docker彻底改变了应用部署方式。本文从基础概念到生产环境部署，全面讲解Docker的使用技巧和最佳实践。",
    image: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=200&fit=crop",
    link: "/article/5",
    author: "DevOps工程师",
    date: "2024-01-11",
    readTime: "10分钟",
    likes: 298,
    tags: ["Docker", "容器化", "运维", "部署"]
  },
  {
    id: 6,
    title: "机器学习入门：从线性回归到神经网络",
    category: "AI",
    content: "机器学习是人工智能的核心技术。本文通过Python代码示例，循序渐进地介绍机器学习的基本概念和算法实现。",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop",
    link: "/article/6",
    author: "AI研究员",
    date: "2024-01-10",
    readTime: "18分钟",
    likes: 567,
    tags: ["机器学习", "AI", "Python", "神经网络"]
  }
];

const router = useRouter();
const articles = ref<Article[]>(mockArticleData);
const selectedCategory = ref<string>('全部');

// 获取所有分类
const categories = computed(() => {
  const allCategories = ['全部', ...new Set(articles.value.map(article => article.category))];
  return allCategories;
});

// 根据选择分类过滤文章
const filteredArticles = computed(() => {
  if (selectedCategory.value === '全部') {
    return articles.value;
  }
  return articles.value.filter(article => article.category === selectedCategory.value);
});

// 获取分类文章数量
const getCategoryCount = (category: string) => {
  if (category === '全部') {
    return articles.value.length;
  }
  return articles.value.filter(article => article.category === category).length;
};

// 选择分类
const selectCategory = (category: string) => {
  selectedCategory.value = category;
};

// 跳转到文章
const navigateToArticle = (link: string) => {
  if (link.startsWith('http')) {
    window.open(link, '_blank');
  } else {
    router.push(link);
  }
};

onMounted(() => {
  // 初始化数据
  articles.value = mockArticleData;
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 掘金风格的平滑过渡效果 */
.group:hover {
  transform: translateY(-2px);
}
</style>
<template>
  <div class="search-box-container">
    <!-- Tab 切换 -->
    <div class="search-tabs">
      <div 
        v-for="tab in tabs" 
        :key="tab.key"
        class="search-tab"
        :class="{ 'active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-input-wrapper">
      <input 
        v-model="searchKeyword"
        type="text"
        class="search-input"
        :placeholder="getPlaceholder()"
        @keyup.enter="handleSearch"
      />
      <!-- <button class="search-button" @click="handleSearch">
        <svg class="search-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path d="M945.066667 898.133333l-189.866667-189.866666c55.466667-64 87.466667-149.333333 87.466667-241.066667 0-204.8-168.533333-373.333333-373.333334-373.333333S96 264.533333 96 469.333333 264.533333 842.666667 469.333333 842.666667c91.733333 0 174.933333-34.133333 241.066667-87.466667l189.866667 189.866667c6.4 6.4 14.933333 8.533333 23.466666 8.533333s17.066667-2.133333 23.466667-8.533333c8.533333-12.8 8.533333-34.133333-2.133333-46.933334zM469.333333 778.666667C298.666667 778.666667 160 640 160 469.333333S298.666667 160 469.333333 160 778.666667 298.666667 778.666667 469.333333 640 778.666667 469.333333 778.666667z" />
        </svg>
      </button> -->
    </div>

    <!-- 快捷链接 -->
    <div class="quick-links">
      <a 
        v-for="link in currentLinks" 
        :key="link.name"
        class="quick-link-item"
        @click="handleLinkClick(link)"
      >
        <span class="link-icon" v-if="link.icon">{{ link.icon }}</span>
        <span class="link-name">{{ link.name }}</span>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 搜索关键词
const searchKeyword = ref('')

// 当前激活的 Tab
const activeTab = ref('search')

// Tab 配置
const tabs = [
  { key: 'agent', label: 'Agent对话' },
  { key: 'search', label: '搜索' },
  { key: 'community', label: '社区' },
  { key: 'life', label: '生活' },
  { key: 'article', label: '站内文章' }
]

// 链接配置
interface Link {
  name: string
  icon?: string
  url?: string
  searchUrl?: string
  route?: string
}

const searchLinks: Link[] = [
  { 
    name: 'Bing', 
    icon: '🔍',
    searchUrl: 'https://www.bing.com/search?q='
  },
  { 
    name: '百度', 
    icon: '🔍',
    searchUrl: 'https://www.baidu.com/s?wd='
  },
  { 
    name: 'Google', 
    icon: '🌐',
    searchUrl: 'https://www.google.com/search?q='
  }
]

const communityLinks: Link[] = [
  { 
    name: 'GitHub', 
    icon: '🐱',
    url: 'https://github.com',
    searchUrl: 'https://github.com/search?q='
  },
  { 
    name: '掘金', 
    icon: '⛏️',
    url: 'https://juejin.cn',
    searchUrl: 'https://juejin.cn/search?query='
  },
  { 
    name: '知乎', 
    icon: '🎓',
    url: 'https://www.zhihu.com',
    searchUrl: 'https://www.zhihu.com/search?q='
  },
  { 
    name: 'Hugging Face', 
    icon: '🤗',
    url: 'https://huggingface.co',
    searchUrl: 'https://huggingface.co/search/full-text?q='
  },
  { 
    name: '飞桨', 
    icon: '🚣',
    url: 'https://www.paddlepaddle.org.cn',
    searchUrl: 'https://www.paddlepaddle.org.cn/search?q='
  },
  { 
    name: '魔搭', 
    icon: '🎨',
    url: 'https://modelscope.cn',
    searchUrl: 'https://modelscope.cn/search?keyword='
  }
]

const lifeLinks: Link[] = [
  { 
    name: '京东', 
    icon: '🛒',
    url: 'https://www.jd.com',
    searchUrl: 'https://search.jd.com/Search?keyword='
  },
  { 
    name: '淘宝', 
    icon: '🛍️',
    url: 'https://www.taobao.com',
    searchUrl: 'https://s.taobao.com/search?q='
  },
  { 
    name: '小红书', 
    icon: '📕',
    url: 'https://www.xiaohongshu.com',
    searchUrl: 'https://www.xiaohongshu.com/search_result?keyword='
  }
]

// 当前显示的链接
const currentLinks = computed(() => {
  switch (activeTab.value) {
    case 'search':
      return searchLinks
    case 'community':
      return communityLinks
    case 'life':
      return lifeLinks
    case 'article':
      return []
    default:
      return searchLinks
  }
})

// 获取占位符文本
const getPlaceholder = () => {
  switch (activeTab.value) {
    case 'search':
      return '输入关键词，点击下方搜索引擎进行搜索...'
    case 'community':
      return '输入关键词，点击下方社区网站进行搜索...'
    case 'life':
      return '输入关键词，点击下方生活网站进行搜索...'
    case 'article':
      return '搜索站内文章...'
    default:
      return '请输入搜索关键词...'
  }
}

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    return
  }

  if (activeTab.value === 'article') {
    // 站内搜索，跳转到搜索结果页（这里可以根据实际情况调整）
    console.log('站内搜索:', searchKeyword.value)
    // router.push({ path: '/search', query: { keyword: searchKeyword.value } })
    return
  }

  // 默认使用第一个搜索引擎
  const firstLink = currentLinks.value[0]
  if (firstLink && firstLink.searchUrl) {
    window.open(firstLink.searchUrl + encodeURIComponent(searchKeyword.value), '_blank')
  }
}

// 处理链接点击
const handleLinkClick = (link: Link) => {
  const keyword = searchKeyword.value.trim()
  
  if (keyword && link.searchUrl) {
    // 如果有关键词，进行搜索
    window.open(link.searchUrl + encodeURIComponent(keyword), '_blank')
  } else if (link.url) {
    // 否则直接打开网站
    window.open(link.url, '_blank')
  } else if (link.route) {
    // 站内路由跳转
    router.push(link.route)
  }
}
</script>

<style scoped lang="less">
.search-box-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

// Tab 切换
.search-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  padding: 3px;
  background: #f5f7fa;
  border-radius: 10px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 2px;
  }
}

.search-tab {
  flex: 1;
  min-width: 75px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  text-align: center;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap;

  &:hover {
    color: #409eff;
    background: rgba(64, 158, 255, 0.08);
  }

  &.active {
    color: #ffffff;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
  }
}

// 搜索框
.search-input-wrapper {
  position: relative;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 40px;
  padding: 3px 3px 3px 20px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:focus-within {
    background: #ffffff;
    border-color: #667eea;
    box-shadow: 0 2px 12px rgba(102, 126, 234, 0.15);
  }
}

.search-input {
  flex: 1;
  height: 38px;
  padding: 0 14px;
  font-size: 15px;
  color: #303133;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: #909399;
  }
}

.search-button {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 3px 10px rgba(102, 126, 234, 0.35);
  }

  &:active {
    transform: scale(0.95);
  }

  .search-icon {
    width: 18px;
    height: 18px;
    fill: #ffffff;
  }
}

// 快捷链接
.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 42px;
}

.quick-link-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  background: #f5f7fa;
  border: 1.5px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  user-select: none;

  &:hover {
    color: #667eea;
    background: #ffffff;
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 3px 10px rgba(102, 126, 234, 0.18);
  }

  &:active {
    transform: translateY(0);
  }

  .link-icon {
    font-size: 16px;
    line-height: 1;
  }

  .link-name {
    font-weight: 500;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .search-box-container {
    padding: 12px 16px;
    border-radius: 10px;
  }

  .search-tabs {
    gap: 4px;
    padding: 3px;
    margin-bottom: 12px;
  }

  .search-tab {
    min-width: 60px;
    padding: 7px 12px;
    font-size: 13px;
  }

  .search-input-wrapper {
    padding: 3px 3px 3px 16px;
    margin-bottom: 12px;
  }

  .search-input {
    height: 36px;
    font-size: 14px;
  }

  .search-button {
    width: 36px;
    height: 36px;

    .search-icon {
      width: 16px;
      height: 16px;
    }
  }

  .quick-link-item {
    padding: 7px 14px;
    font-size: 12px;

    .link-icon {
      font-size: 15px;
    }
  }
}

// 深色主题适配（可选）
@media (prefers-color-scheme: dark) {
  .search-box-container {
    background: #1e1e1e;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  .search-tabs {
    background: #2a2a2a;
  }

  .search-tab {
    color: #b4b4b4;

    &:hover {
      background: rgba(64, 158, 255, 0.15);
    }
  }

  .search-input-wrapper {
    background: #2a2a2a;

    &:focus-within {
      background: #333333;
    }
  }

  .search-input {
    color: #e4e4e4;

    &::placeholder {
      color: #6a6a6a;
    }
  }

  .quick-link-item {
    color: #b4b4b4;
    background: #2a2a2a;

    &:hover {
      color: #667eea;
      background: #333333;
    }
  }
}
</style>


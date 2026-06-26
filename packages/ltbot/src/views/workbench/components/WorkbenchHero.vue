<template>
  <div class="hero-main">
    <div class="eyebrow">{{ hero.eyebrow }}</div>
    <h1 class="title">{{ hero.title }}</h1>
    <div class="subtitle">{{ hero.subtitle }}</div>

    <div class="agent-console">
      <div class="console-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="console-tab"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <form class="command-area" @submit.prevent="handleSubmit">
        <input
          v-model="commandText"
          class="command-input"
          :placeholder="placeholder"
        />
        <button class="primary-btn" type="submit">{{ primaryButtonText }}</button>
      </form>

      <div v-if="activeTab === 'agent'" class="quick-prompts">
        <button
          v-for="prompt in hero.quickPrompts"
          :key="prompt"
          class="chip"
          type="button"
          @click="commandText = prompt"
        >
          {{ prompt }}
        </button>
      </div>
      <div v-else class="quick-links">
        <button
          v-for="link in currentLinks"
          :key="link.name"
          class="quick-link"
          type="button"
          @click="handleLinkClick(link)"
        >
          <span v-if="link.icon" class="link-icon">{{ link.icon }}</span>
          <span>{{ link.name }}</span>
        </button>
        <div v-if="currentLinks.length === 0" class="empty-links">
          输入关键词后按 Enter，可进入站内文章检索。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { WorkbenchHero } from '../types'

const props = defineProps<{
  hero: WorkbenchHero
}>()

interface ConsoleTab {
  key: 'agent' | 'search' | 'community' | 'life' | 'article'
  label: string
}

interface QuickLink {
  name: string
  icon?: string
  url?: string
  searchUrl?: string
  route?: string
}

const router = useRouter()
const commandText = ref(props.hero.command)
const activeTab = ref<ConsoleTab['key']>('agent')

const tabs: ConsoleTab[] = [
  { key: 'agent', label: props.hero.tabs[0] ?? 'Agent对话' },
  { key: 'search', label: props.hero.tabs[1] ?? '搜索' },
  { key: 'community', label: props.hero.tabs[2] ?? '社区' },
  { key: 'life', label: props.hero.tabs[3] ?? '生活' },
  { key: 'article', label: props.hero.tabs[4] ?? '站内文章' }
]

const searchLinks: QuickLink[] = [
  { name: 'Bing', icon: '🔍', searchUrl: 'https://www.bing.com/search?q=' },
  { name: '百度', icon: '🔍', searchUrl: 'https://www.baidu.com/s?wd=' },
  { name: 'Google', icon: '🌐', searchUrl: 'https://www.google.com/search?q=' }
]

const communityLinks: QuickLink[] = [
  { name: 'GitHub', icon: '🐱', url: 'https://github.com', searchUrl: 'https://github.com/search?q=' },
  { name: '掘金', icon: '⛏️', url: 'https://juejin.cn', searchUrl: 'https://juejin.cn/search?query=' },
  { name: '知乎', icon: '🎓', url: 'https://www.zhihu.com', searchUrl: 'https://www.zhihu.com/search?q=' },
  { name: 'Hugging Face', icon: '🤗', url: 'https://huggingface.co', searchUrl: 'https://huggingface.co/search/full-text?q=' },
  { name: '飞桨', icon: '🚣', url: 'https://www.paddlepaddle.org.cn', searchUrl: 'https://www.paddlepaddle.org.cn/search?q=' },
  { name: '魔搭', icon: '🎨', url: 'https://modelscope.cn', searchUrl: 'https://modelscope.cn/search?keyword=' }
]

const lifeLinks: QuickLink[] = [
  { name: '京东', icon: '🛒', url: 'https://www.jd.com', searchUrl: 'https://search.jd.com/Search?keyword=' },
  { name: '淘宝', icon: '🛍️', url: 'https://www.taobao.com', searchUrl: 'https://s.taobao.com/search?q=' },
  { name: '小红书', icon: '📕', url: 'https://www.xiaohongshu.com', searchUrl: 'https://www.xiaohongshu.com/search_result?keyword=' }
]

const currentLinks = computed(() => {
  switch (activeTab.value) {
    case 'search':
      return searchLinks
    case 'community':
      return communityLinks
    case 'life':
      return lifeLinks
    default:
      return []
  }
})

const placeholder = computed(() => {
  switch (activeTab.value) {
    case 'agent':
      return '描述你想让 AI 完成的任务...'
    case 'search':
      return '输入关键词，选择下方搜索引擎搜索...'
    case 'community':
      return '输入关键词，选择下方社区网站搜索...'
    case 'life':
      return '输入关键词，选择下方生活网站搜索...'
    case 'article':
      return '搜索站内文章...'
    default:
      return '请输入关键词...'
  }
})

const primaryButtonText = computed(() => {
  return activeTab.value === 'agent' ? '开始执行' : '立即搜索'
})

function handleSubmit() {
  const keyword = commandText.value.trim()

  if (!keyword) {
    return
  }

  if (activeTab.value === 'agent') {
    router.push({ path: '/chat', query: { prompt: keyword } })
    return
  }

  if (activeTab.value === 'article') {
    router.push({ path: '/blog', query: { keyword } })
    return
  }

  const firstLink = currentLinks.value[0]
  if (firstLink?.searchUrl) {
    window.open(firstLink.searchUrl + encodeURIComponent(keyword), '_blank', 'noopener,noreferrer')
  }
}

function handleLinkClick(link: QuickLink) {
  const keyword = commandText.value.trim()

  if (keyword && link.searchUrl) {
    window.open(link.searchUrl + encodeURIComponent(keyword), '_blank', 'noopener,noreferrer')
    return
  }

  if (link.url) {
    window.open(link.url, '_blank', 'noopener,noreferrer')
    return
  }

  if (link.route) {
    router.push(link.route)
  }
}
</script>

<style lang="scss" scoped>
.hero-main {
  grid-column: span 2;
  min-height: 430px;
  padding: 28px;
  border: 1px solid var(--workbench-line);
  border-radius: 12px;
  background:
    radial-gradient(circle at 82% 18%, rgba(63, 124, 255, 0.18), transparent 28%),
    radial-gradient(circle at 98% 72%, rgba(22, 163, 111, 0.12), transparent 28%),
    linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
  box-shadow: var(--workbench-shadow);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding: 7px 12px;
  border-radius: 99px;
  color: var(--workbench-blue);
  background: var(--workbench-blue-soft);
  font-size: 13px;
  font-weight: 700;
}

h1 {
  margin: 0 0 10px;
  color: var(--workbench-text);
  font-size: 34px;
  letter-spacing: 0;
}

.title {
  align-items: center;
          display: flex;
          justify-content: center;
          margin: 0 20px;
          background: linear-gradient(90deg, #5c4de7, #8edb75, #00ccff);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradient-flow 3s linear infinite;
}

@keyframes gradient-flow {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

.subtitle {
  margin: 10px;
  color: var(--workbench-muted);
  font-size: 15px;
  line-height: 1.7;
}

.agent-console {
  overflow: hidden;
  border: 1px solid #bfd6ff;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 12px 32px rgba(63, 124, 255, 0.16);
}

.console-tabs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid #e4ecf8;
  background: #f8fbff;
}

.console-tab {
  border: 0;
  padding: 10px 12px;
  border-radius: 8px;
  color: #60708a;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  transition: all 0.25s ease;
}

.console-tab:hover {
  color: var(--workbench-blue);
  background: #eef4ff;
}

.console-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #3f7cff, #7a47d8);
  box-shadow: 0 8px 18px rgba(63, 124, 255, 0.22);
}

.command-area {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.command-input {
  height: 48px;
  min-width: 0;
  padding: 0 14px;
  border: 1px solid #dbe4f3;
  border-radius: 10px;
  outline: 0;
  color: var(--workbench-text);
  background: #fff;
  font-size: 15px;
}

.primary-btn {
  height: 48px;
  padding: 0 20px;
  border: 0;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(135deg, #3f7cff, #245ee8);
  cursor: pointer;
  font-weight: 800;
  box-shadow: 0 10px 22px rgba(63, 124, 255, 0.22);
}

.quick-prompts {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 0 16px 16px;
}

.chip {
  padding: 9px 10px;
  border: 1px solid var(--workbench-line);
  border-radius: 8px;
  color: #3c4963;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
  transition: all 0.25s ease;
}

.chip:hover {
  color: var(--workbench-blue);
  border-color: #bcd2ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(63, 124, 255, 0.12);
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 58px;
  padding: 0 16px 16px;
}

.quick-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1px solid var(--workbench-line);
  border-radius: 999px;
  color: #3c4963;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.25s ease;
}

.quick-link:hover {
  color: var(--workbench-blue);
  border-color: #bcd2ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(63, 124, 255, 0.12);
}

.link-icon {
  font-size: 15px;
  line-height: 1;
}

.empty-links {
  width: 100%;
  padding: 10px 12px;
  border: 1px dashed #dbe4f3;
  border-radius: 10px;
  color: var(--workbench-muted);
  background: #fbfcff;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .hero-main {
    grid-column: auto;
  }
}

@media (max-width: 700px) {
  .hero-main {
    min-height: auto;
    padding: 20px;
  }

  h1 {
    font-size: 26px;
  }

  .console-tabs {
    grid-template-columns: repeat(2, 1fr);
  }

  .command-area {
    grid-template-columns: 1fr;
  }

  .quick-prompts {
    grid-template-columns: 1fr;
  }

  .quick-links {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="dynamic-card-wrapper">
    <div class="card-stack">
      <div
        v-for="(card, index) in cards"
        :key="card.id"
        :class="[
          'code-card',
          { 'is-dropped': droppedCards.includes(card.id) },
          { 'is-active': activeCardIndex === index }
        ]"
        :style="getCardStyle(index)"
        @click="handleCardClick(card.id, index)"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="traffic-lights">
            <span class="light red"></span>
            <span class="light yellow"></span>
            <span class="light green"></span>
          </div>
          <span class="filename">{{ card.filename }}</span>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <pre><code v-html="card.content"></code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Card {
  id: string
  filename: string
  content: string
}

const props = defineProps<{
  autoLoop?: boolean
  loopDelay?: number
}>()

// 卡片数据
const cards = ref<Card[]>([
  {
    id: 'person',
    filename: 'person.js',
    content: `<span class="keyword">const</span> <span class="variable">person</span> = {
  <span class="property">姓名</span>: <span class="string">"张三"</span>,
  <span class="property">职业</span>: <span class="string">"全栈开发工程师"</span>,
  <span class="property">年龄</span>: <span class="number">28</span>,
  <span class="property">性别</span>: <span class="string">"男"</span>,
  <span class="property">爱好</span>: [
    <span class="string">"编程"</span>,
    <span class="string">"阅读"</span>,
    <span class="string">"旅行"</span>,
    <span class="string">"摄影"</span>
  ],
  <span class="property">座右铭</span>: <span class="string">"代码改变世界"</span>
};`
  },
  {
    id: 'skills',
    filename: 'skills.js',
    content: `<span class="keyword">const</span> <span class="variable">skills</span> = {
  <span class="property">前端</span>: {
    <span class="property">Vue</span>: <span class="string">"精通"</span>,
    <span class="property">React</span>: <span class="string">"熟练"</span>,
    <span class="property">TypeScript</span>: <span class="string">"精通"</span>
  },
  <span class="property">后端</span>: {
    <span class="property">Node.js</span>: <span class="string">"精通"</span>,
    <span class="property">Python</span>: <span class="string">"熟练"</span>,
    <span class="property">数据库</span>: <span class="string">"熟练"</span>
  },
  <span class="property">工具</span>: {
    <span class="property">Git</span>: <span class="string">"精通"</span>,
    <span class="property">Docker</span>: <span class="string">"熟练"</span>
  }
};`
  },
  {
    id: 'projects',
    filename: 'projects.js',
    content: `<span class="keyword">const</span> <span class="variable">projects</span> = [
  {
    <span class="property">名称</span>: <span class="string">"AI 聊天助手"</span>,
    <span class="property">描述</span>: <span class="string">"智能对话系统"</span>,
    <span class="property">技术栈</span>: [<span class="string">"Vue3"</span>, <span class="string">"Node.js"</span>],
    <span class="property">状态</span>: <span class="string">"已上线"</span>
  },
  {
    <span class="property">名称</span>: <span class="string">"在线作品廊"</span>,
    <span class="property">描述</span>: <span class="string">"艺术作品展示平台"</span>,
    <span class="property">技术栈</span>: [<span class="string">"React"</span>, <span class="string">"MongoDB"</span>],
    <span class="property">状态</span>: <span class="string">"开发中"</span>
  }
];`
  },
  {
    id: 'contact',
    filename: 'contact.js',
    content: `<span class="keyword">const</span> <span class="variable">contact</span> = {
  <span class="property">邮箱</span>: <span class="string">"zhangsan@example.com"</span>,
  <span class="property">GitHub</span>: <span class="string">"github.com/zhangsan"</span>,
  <span class="property">微信</span>: <span class="string">"zhangsan_dev"</span>,
  <span class="property">博客</span>: <span class="string">"blog.zhangsan.com"</span>,
  <span class="property">位置</span>: <span class="string">"中国·北京"</span>,
  <span class="property">状态</span>: <span class="string">"在线"</span>
};`
  }
])

// 已掉落的卡片ID列表
const droppedCards = ref<string[]>([])

// 当前激活的卡片索引
const activeCardIndex = computed(() => {
  return cards.value.findIndex(card => !droppedCards.value.includes(card.id))
})

// 获取卡片样式（扑克牌折叠效果）
const getCardStyle = (index: number) => {
  const droppedCount = droppedCards.value.length
  const adjustedIndex = index - droppedCount

  if (index < droppedCount) {
    // 已掉落的卡片
    return {
      transform: 'translateY(120vh) rotate(12deg)',
      opacity: '0',
      pointerEvents: 'none' as const
    }
  }

  // 扑克牌折叠效果 - 从左上角叠加，只露出一点边缘
  return {
    transform: `translate(${adjustedIndex * 8}px, ${adjustedIndex * 8}px)`,
    zIndex: cards.value.length - index,
    opacity: '1'
  }
}

// 处理卡片点击
const handleCardClick = (cardId: string, index: number) => {
  // 只有当前最上面的卡片可以点击
  if (index === activeCardIndex.value) {
    droppedCards.value.push(cardId)
  }
}

// 自动循环逻辑
watch(droppedCards, (newVal) => {
  if (newVal.length === cards.value.length && props.autoLoop !== false) {
    // 所有卡片都掉落完了，延迟后重置
    setTimeout(() => {
      droppedCards.value = []
    }, props.loopDelay || 1500)
  }
})
</script>

<style scoped>
.dynamic-card-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.card-stack {
  position: relative;
  width: 100%;
  max-width: 650px;
  height: 500px;
  perspective: 1200px;
}

/* 卡片样式 */
.code-card {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  cursor: pointer;
  transition: all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-origin: top left;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* 激活状态的卡片 */
.code-card.is-active {
  cursor: pointer;
}

.code-card.is-active:hover {
  transform: translate(0, -12px) !important;
  box-shadow: 
    0 24px 64px rgba(0, 0, 0, 0.3),
    0 0 0 2px rgba(59, 130, 246, 0.4);
}

/* 已掉落的卡片 */
.code-card.is-dropped {
  pointer-events: none;
  transition: all 1.2s cubic-bezier(0.6, -0.28, 0.735, 0.045);
}

/* 卡片头部 */
.card-header {
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.traffic-lights {
  display: flex;
  gap: 8px;
}

.light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.light.red {
  background: #ff5f57;
}

.light.yellow {
  background: #ffbd2e;
}

.light.green {
  background: #28ca42;
}

.filename {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  color: #8b949e;
  font-weight: 500;
}

/* 卡片内容 */
.card-content {
  padding: 24px;
  height: calc(100% - 50px);
  overflow-y: auto;
  font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
}

.card-content::-webkit-scrollbar {
  width: 8px;
}

.card-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

.card-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.card-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

code {
  color: #e6edf3;
  display: block;
  text-align: left;
}

/* 代码高亮 */
.keyword {
  color: #ff79c6;
  font-weight: 600;
}

.variable {
  color: #50fa7b;
}

.property {
  color: #8be9fd;
}

.string {
  color: #f1fa8c;
}

.number {
  color: #bd93f9;
}

/* 响应式 */
@media (max-width: 768px) {
  .dynamic-card-wrapper {
    padding: 20px;
  }

  .card-stack {
    max-width: 100%;
    height: 450px;
  }

  .card-content {
    font-size: 12px;
    padding: 20px;
  }
}
</style>


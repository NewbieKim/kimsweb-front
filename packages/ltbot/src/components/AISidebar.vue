<template>
  <div class="ai-sidebar-container">
    <!-- 遮罩层 -->
    <transition name="fade">
      <div 
        v-if="visible && !isFloating" 
        class="sidebar-overlay"
        @click="handleClose"
      ></div>
    </transition>
    
    <!-- 侧边栏 -->
    <transition :name="isFloating ? 'float' : 'slide'">
      <div 
        v-if="visible" 
        class="ai-sidebar"
        :class="{ 
          'is-floating': isFloating,
          'is-docked': !isFloating 
        }"
        :style="floatingStyle"
        @mousedown="handleMouseDown"
      >
        <div class="sidebar-content">
          <!-- 远程聊天组件（内嵌模式，填满侧边栏） -->
          <RemoteChat ref="chatBotRef" embedded @close="handleClose" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RemoteChat from './RemoteChat/index.vue'

// Props
interface Props {
  modelValue: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// State
const visible = ref(props.modelValue)
const isFloating = ref(false)
const chatBotRef = ref<InstanceType<typeof RemoteChat> | null>(null)

// 浮动窗口位置和拖拽状态
const floatingPosition = ref({ x: 100, y: 100 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

// 监听 visible 变化，同步到父组件
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 计算浮动窗口样式
const floatingStyle = computed(() => {
  if (!isFloating.value) return {}
  
  return {
    left: `${floatingPosition.value.x}px`,
    top: `${floatingPosition.value.y}px`,
  }
})

// 切换浮动/吸附状态
const handleToggleFloat = () => {
  isFloating.value = !isFloating.value
  
  if (isFloating.value) {
    // 切换到浮动模式时，设置初始位置
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    floatingPosition.value = {
      x: windowWidth - 650 - 50, // 窗口宽度 - 侧边栏宽度 - 边距
      y: 50
    }
  }
}

// 关闭侧边栏
const handleClose = () => {
  visible.value = false
}

// 拖拽功能
const handleMouseDown = (e: MouseEvent) => {
  if (!isFloating.value) return
  
  // 只有点击header区域才能拖拽
  const target = e.target as HTMLElement
  if (!target.closest('.sidebar-header')) return
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - floatingPosition.value.x,
    y: e.clientY - floatingPosition.value.y
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  e.preventDefault()
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  
  floatingPosition.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
}

const handleMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

// 暴露方法给父组件
defineExpose({
  open: () => { visible.value = true },
  close: () => { visible.value = false },
  toggle: () => { visible.value = !visible.value }
})
</script>

<style scoped lang="less">
.ai-sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
  
  * {
    pointer-events: auto;
  }
}

// 遮罩层
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1000;
}

// 侧边栏主体
.ai-sidebar {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  box-shadow: -2px 0 16px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  
  // 吸附模式 - 靠右全高
  &.is-docked {
    top: 0;
    right: 0;
    bottom: 0;
    width: 650px;
  }
  
  // 浮动模式
  &.is-floating {
    width: 650px;
    height: 700px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    
    .sidebar-header {
      cursor: move;
      user-select: none;
      border-radius: 12px 12px 0 0;
    }
  }
}

// 内容区域
.sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

// 动画效果
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.float-enter-active,
.float-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.float-enter-from,
.float-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

// 响应式设计
@media (max-width: 1024px) {
  .ai-sidebar {
    &.is-docked {
      width: 600px !important;
    }
    
    &.is-floating {
      width: 550px !important;
    }
  }
}

@media (max-width: 768px) {
  .ai-sidebar {
    &.is-docked {
      width: 100% !important;
    }
    
    &.is-floating {
      width: calc(100% - 40px) !important;
      left: 20px !important;
      right: 20px !important;
      height: calc(100vh - 80px) !important;
    }
  }
}
</style>
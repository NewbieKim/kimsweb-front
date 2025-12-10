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
        <!-- 顶部操作栏 -->
        <div class="sidebar-header">
          <div class="header-left">
            <span class="ai-icon">🤖</span>
            <span class="ai-title">AI助手</span>
          </div>
          
          <div class="header-actions">
            <!-- 清空对话 -->
            <button 
              class="action-btn"
              @click="handleClear"
              title="清空对话"
            >
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6c-0.3 1.5-0.4 3-0.4 4.4 0 14.4 11.6 26 26 26h723c1.5 0 3-0.1 4.4-0.4 14.2-2.4 23.7-15.9 21.2-30zM204 390h272V182h72v208h272v104H204V390z m468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z" />
              </svg>
              <span class="action-text">清空</span>
            </button>
            
            <!-- 浮动/吸附 -->
            <button 
              class="action-btn"
              @click="handleToggleFloat"
              :title="isFloating ? '吸附到侧边栏' : '浮动窗口'"
            >
              <svg v-if="!isFloating" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M917.333333 106.666667v810.666666H106.666667V106.666667h810.666666z m-64 64H170.666667v682.666666h682.666666V170.666667z m-128 128v426.666666H298.666667V298.666667h426.666666z m-64 64H362.666667v298.666666h298.666666V362.666667z" />
              </svg>
              <svg v-else class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M917.333333 106.666667v810.666666H106.666667V106.666667h810.666666z m-64 64H170.666667v682.666666h682.666666V170.666667z m-554.666666 128h426.666666v426.666666H298.666667V298.666667z m64 64v298.666666h298.666666V362.666667H362.666667z" />
              </svg>
              <span class="action-text">{{ isFloating ? '吸附' : '浮动' }}</span>
            </button>
            
            <!-- 关闭 -->
            <button 
              class="action-btn close-btn"
              @click="handleClose"
              title="关闭侧边栏"
            >
              <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M557.312 513.248l265.28-263.904c12.544-12.48 12.608-32.704 0.128-45.248-12.512-12.576-32.704-12.608-45.248-0.128L512.128 467.904 249.024 204.8c-12.544-12.48-32.704-12.48-45.248 0-12.48 12.544-12.48 32.704 0 45.248l263.072 263.168L201.6 776.8c-12.544 12.48-12.608 32.704-0.128 45.248 6.24 6.272 14.464 9.44 22.688 9.44 8.16 0 16.32-3.104 22.56-9.312l265.216-263.552 265.248 263.552c6.24 6.208 14.432 9.312 22.56 9.312 8.224 0 16.448-3.168 22.688-9.44 12.48-12.544 12.416-32.768-0.128-45.248L557.312 513.248z" />
              </svg>
              <span class="action-text">关闭</span>
            </button>
          </div>
        </div>
        
        <!-- ChatBot组件区域 -->
        <div class="sidebar-content">
          <ChatBot ref="chatBotRef" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ChatBot from './ChatBot/index.vue'

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
const chatBotRef = ref<InstanceType<typeof ChatBot> | null>(null)

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

// 清空对话
const handleClear = () => {
  // 使用原生confirm而不是MessagePlugin，因为可能未安装
  if (confirm('确定要清空所有对话记录吗？此操作不可恢复。')) {
    // 调用 ChatBot 组件的清空方法
    if (chatBotRef.value && chatBotRef.value.$el) {
      // 查找ChatBot内的清空按钮并触发点击
      const clearBtn = chatBotRef.value.$el.querySelector('.t-chat__clear-btn')
      if (clearBtn) {
        clearBtn.click()
      }
    }
  }
}

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
  
  // 吸附模式 - 问题1：加宽弹框宽度
  &.is-docked {
    top: 0;
    right: 0;
    bottom: 0;
    width: 1200px; /* 从750px改为1200px */
    max-width: 90vw; /* 响应式支持 */
  }
  
  // 浮动模式
  &.is-floating {
    width: 900px; /* 从650px改为900px */
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

// 顶部操作栏
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .ai-icon {
      font-size: 28px;
      animation: pulse 2s ease-in-out infinite;
    }
    
    .ai-title {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .action-btn {
    min-width: 36px;
    height: 36px;
    padding: 0 12px;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    
    .icon {
      width: 18px;
      height: 18px;
      fill: #ffffff;
      transition: transform 0.3s ease;
      flex-shrink: 0;
    }
    
    .action-text {
      color: #ffffff;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
      
      .icon {
        transform: scale(1.1);
      }
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &.close-btn:hover {
      background: rgba(239, 68, 68, 0.8);
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
  
  // 让ChatBot组件填充整个内容区域
  :deep(.chat-box) {
    height: 100% !important;
    width: 100%;
    display: flex; /* 问题3：确保flex布局 */
    flex-direction: row;
    
    .main-chat-area {
      flex: 1;
      display: flex; /* 问题3：确保flex布局 */
      flex-direction: column;
    }
    
    // 调整ChatBot的欢迎页面高度
    .chat-welcome {
      height: 100%;
    }
  }
  
  // 问题2：对话内容左对齐
  :deep(.t-chat__content) {
    text-align: left !important;
    justify-content: flex-start !important;
  }
  
  :deep(.t-chat-content) {
    text-align: left !important;
  }
  
  :deep(.t-chat-reasoning) {
    text-align: left !important;
  }
  
  // 问题3：修复输入框固定在底部
  :deep(.t-chat) {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
  }
  
  :deep(.t-chat__list) {
    flex: 1 !important;
    overflow-y: auto !important;
  }
  
  :deep(.t-chat__footer) {
    position: sticky !important;
    bottom: 0 !important;
    background: #fff !important;
    padding: 16px !important;
    border-top: 1px solid #e1e5e9 !important;
    z-index: 10 !important;
    flex-shrink: 0 !important;
  }
  
  // 浮动模式下隐藏ChatBot的历史记录侧边栏
  .is-floating & {
    :deep(.chat-box) {
      .sidebar {
        display: none !important;
      }
      
      .main-chat-area {
        width: 100% !important;
        
        &.expanded {
          width: 100% !important;
        }
      }
    }
  }
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

// 脉冲动画
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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
  
  .action-btn {
    .action-text {
      display: none;
    }
  }
}
</style>


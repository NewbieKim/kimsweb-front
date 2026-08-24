<template>
  <div class="app-wrapper">
    <!-- <SliderBar class="sidebar-container" /> -->
    <div class="main-container" id="mainContainer">
      <topNav @open-ai-sidebar="handleOpenAISidebar" />
      <mainContain />
      <!-- <el-scrollbar
        style="margin-top: 30px;"
        class="main-scrollbar-wrapper"
        wrap-class="main-scrollbar-wrapper"
      >
        <mainContain />
      </el-scrollbar> -->
    </div>
    <el-backtop />
    
    <!-- AI助手侧边栏 -->
    <AISidebar ref="aiSidebarRef" v-model="showAISidebar" />

    <button
      class="ai-float-button"
      :class="{ dragging: isAIFloatDragging }"
      :style="aiFloatButtonStyle"
      type="button"
      aria-label="打开AI助手"
      title="AI助手"
      @click="handleAIFloatClick"
      @mousedown="handleAIFloatPointerDown"
      @touchstart.prevent="handleAIFloatPointerDown"
    >
      <span class="ai-float-orbit"></span>
      <span class="ai-float-icon">AI</span>
      <span class="ai-float-dot"></span>
    </button>
  </div>
</template>

<script lang="ts">
import mainContain from './components/mainContain.vue'
import topNav from "./components/topNav.vue";
import AISidebar from "@/components/AISidebar.vue";
import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref, unref } from 'vue'
export default defineComponent ({
  name: 'Layout',
  components: { 
    mainContain,
    topNav,
    AISidebar
  },
  setup () {
    const showAISidebar = ref(false)
    const aiSidebarRef = ref()
    const aiFloatSize = ref(64)
    const aiFloatPosition = reactive({ x: 0, y: 0 })
    const aiFloatDragStart = reactive({ x: 0, y: 0, pointerX: 0, pointerY: 0 })
    const isAIFloatDragging = ref(false)
    const hasAIFloatMoved = ref(false)
    
    const handleOpenAISidebar = () => {
      showAISidebar.value = true
    }

    const getViewportLimit = () => {
      const margin = 12
      return {
        minX: margin,
        minY: margin,
        maxX: Math.max(margin, window.innerWidth - aiFloatSize.value - margin),
        maxY: Math.max(margin, window.innerHeight - aiFloatSize.value - margin)
      }
    }

    const clampAIFloatPosition = (x: number, y: number) => {
      const limit = getViewportLimit()
      aiFloatPosition.x = Math.min(Math.max(x, limit.minX), limit.maxX)
      aiFloatPosition.y = Math.min(Math.max(y, limit.minY), limit.maxY)
    }

    const syncAIFloatInitialPosition = () => {
      aiFloatSize.value = window.innerWidth <= 768 ? 56 : 64
      if (aiFloatPosition.x === 0 && aiFloatPosition.y === 0) {
        clampAIFloatPosition(
          24,
          window.innerHeight - aiFloatSize.value - 32
        )
        return
      }

      clampAIFloatPosition(aiFloatPosition.x, aiFloatPosition.y)
    }

    const getPointer = (event: MouseEvent | TouchEvent) => {
      if ('touches' in event) {
        const touch = event.touches[0] || event.changedTouches[0]
        return { x: touch.clientX, y: touch.clientY }
      }

      return { x: event.clientX, y: event.clientY }
    }

    const handleAIFloatPointerMove = (event: MouseEvent | TouchEvent) => {
      if (!isAIFloatDragging.value) {
        return
      }

      const pointer = getPointer(event)
      const deltaX = pointer.x - aiFloatDragStart.pointerX
      const deltaY = pointer.y - aiFloatDragStart.pointerY

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasAIFloatMoved.value = true
      }

      clampAIFloatPosition(aiFloatDragStart.x + deltaX, aiFloatDragStart.y + deltaY)
    }

    const handleAIFloatPointerUp = () => {
      isAIFloatDragging.value = false
      document.removeEventListener('mousemove', handleAIFloatPointerMove)
      document.removeEventListener('mouseup', handleAIFloatPointerUp)
      document.removeEventListener('touchmove', handleAIFloatPointerMove)
      document.removeEventListener('touchend', handleAIFloatPointerUp)
      document.removeEventListener('touchcancel', handleAIFloatPointerUp)
    }

    const handleAIFloatPointerDown = (event: MouseEvent | TouchEvent) => {
      const pointer = getPointer(event)
      isAIFloatDragging.value = true
      hasAIFloatMoved.value = false
      aiFloatDragStart.x = aiFloatPosition.x
      aiFloatDragStart.y = aiFloatPosition.y
      aiFloatDragStart.pointerX = pointer.x
      aiFloatDragStart.pointerY = pointer.y

      document.addEventListener('mousemove', handleAIFloatPointerMove)
      document.addEventListener('mouseup', handleAIFloatPointerUp)
      document.addEventListener('touchmove', handleAIFloatPointerMove, { passive: false })
      document.addEventListener('touchend', handleAIFloatPointerUp)
      document.addEventListener('touchcancel', handleAIFloatPointerUp)
    }

    // 点击AI助手浮动按钮
    const handleAIFloatClick = () => {
      if (hasAIFloatMoved.value) {
        hasAIFloatMoved.value = false
        return
      }

      handleOpenAISidebar()
    }

    const aiFloatButtonStyle = computed(() => ({
      left: `${aiFloatPosition.x}px`,
      top: `${aiFloatPosition.y}px`
    }))

    onMounted(() => {
      syncAIFloatInitialPosition()
      window.addEventListener('resize', syncAIFloatInitialPosition)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', syncAIFloatInitialPosition)
      handleAIFloatPointerUp()
    })
    
    return {
      showAISidebar,
      aiSidebarRef,
      handleOpenAISidebar,
      aiFloatButtonStyle,
      isAIFloatDragging,
      handleAIFloatClick,
      handleAIFloatPointerDown
    }
  }
})
</script>

<style scoped>
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}
.main-container {
  height: 100%;
  transition: margin-left .28s;
  position: relative;
  background: #f6f7f9;
  padding-top: 40px;
}
.sidebar-container {
  transition: width 0.28s;
  width: 205px !important;
  height: 100%;
  position: fixed;
  font-size: 0px;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
}

.ai-float-button {
  position: fixed;
  z-index: 9998;
  width: 64px;
  height: 64px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(96, 165, 250, 0.35);
  border-radius: 50%;
  color: #ffffff;
  background:
    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 30%),
    linear-gradient(135deg, #7dd3fc 0%, #60a5fa 45%, #3b82f6 100%);
  box-shadow:
    0 14px 32px rgba(59, 130, 246, 0.28),
    0 0 0 8px rgba(147, 197, 253, 0.16);
  cursor: pointer;
  outline: none;
  touch-action: none;
  user-select: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.ai-float-button:hover,
.ai-float-button.dragging {
  transform: translateY(-4px) scale(1.04);
  box-shadow:
    0 18px 40px rgba(59, 130, 246, 0.34),
    0 0 0 10px rgba(147, 197, 253, 0.2);
}

.ai-float-button:active {
  transform: translateY(-1px) scale(0.98);
}

.ai-float-button:focus-visible {
  box-shadow:
    0 18px 40px rgba(59, 130, 246, 0.34),
    0 0 0 4px rgba(255, 255, 255, 0.95),
    0 0 0 8px rgba(96, 165, 250, 0.48);
}

.ai-float-orbit {
  position: absolute;
  inset: -7px;
  border: 1px solid rgba(125, 211, 252, 0.5);
  border-radius: 50%;
  animation: ai-float-pulse 2.4s ease-in-out infinite;
}

.ai-float-icon {
  position: relative;
  z-index: 1;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.5px;
  backdrop-filter: blur(6px);
}

.ai-float-dot {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 10px;
  height: 10px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #22c55e;
}

@keyframes ai-float-pulse {
  0% {
    transform: scale(0.92);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.12);
    opacity: 0;
  }
  100% {
    transform: scale(1.12);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .ai-float-button {
    width: 56px;
    height: 56px;
  }

  .ai-float-icon {
    width: 34px;
    height: 34px;
    border-radius: 13px;
    font-size: 14px;
  }
}
</style>
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
    <AISidebar v-model="showAISidebar" :initial-draft="pendingDraft" />

    <button
      v-if="activeOverlay !== 'chat'"
      class="ai-float-button"
      :class="{ dragging: isAIFloatDragging }"
      :style="aiFloatButtonStyle"
      type="button"
      aria-label="打开AI助手"
      title="AI助手"
      @click="handleAIFloatClick"
      @pointerdown="handleAIFloatPointerDown"
      @pointermove="handleAIFloatPointerMove"
      @pointerup="handleAIFloatPointerUp"
      @pointercancel="handleAIFloatPointerCancel"
    >
      <span class="ai-float-orbit"></span>
      <span class="ai-float-icon">AI</span>
      <span class="ai-float-dot"></span>
    </button>
  </div>
</template>

<script lang="ts">
import mainContain from './components/mainContain.vue'
import topNav from "./components/topNavResponsive.vue";
import AISidebar from "@/components/AISidebar.vue";
import { computed, defineComponent, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { activeOverlay, closeOverlay, openOverlay } from './mobileOverlay'
import { openAIChatKey, type OpenAIChatOptions } from './aiChatContext'
export default defineComponent ({
  name: 'Layout',
  components: { 
    mainContain,
    topNav,
    AISidebar
  },
  setup () {
    const route = useRoute()
    const pendingDraft = ref('')
    const showAISidebar = computed({
      get: () => activeOverlay.value === 'chat',
      set: (value: boolean) => {
        if (value) openOverlay('chat')
        else if (activeOverlay.value === 'chat') closeOverlay()
      }
    })
    const aiFloatSize = ref(64)
    const aiFloatPosition = reactive({ x: 0, y: 0 })
    const aiFloatDragStart = reactive({ x: 0, y: 0, pointerX: 0, pointerY: 0 })
    const isAIFloatDragging = ref(false)
    const hasAIFloatMoved = ref(false)
    let activePointerId: number | null = null
    let suppressClick = false
    
    const handleOpenAISidebar = (options: OpenAIChatOptions = {}, trigger?: HTMLElement | null) => {
      if (activeOverlay.value === 'chat') return
      pendingDraft.value = options.draft?.trim() ?? ''
      openOverlay('chat', trigger)
    }
    provide(openAIChatKey, handleOpenAISidebar)

    const getViewportLimit = () => {
      const margin = 8
      const bottomInset = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom')) || 0
      return {
        minX: margin,
        minY: margin,
        maxX: Math.max(margin, window.innerWidth - aiFloatSize.value - margin),
        maxY: Math.max(margin, window.innerHeight - aiFloatSize.value - margin - bottomInset)
      }
    }

    const clampAIFloatPosition = (x: number, y: number) => {
      const limit = getViewportLimit()
      aiFloatPosition.x = Math.min(Math.max(x, limit.minX), limit.maxX)
      aiFloatPosition.y = Math.min(Math.max(y, limit.minY), limit.maxY)
    }

    const avoidCriticalControls = () => {
      const limit = getViewportLimit()
      const preferred = aiFloatPosition.x < window.innerWidth / 2 ? limit.minX : limit.maxX
      const sides = [preferred, preferred === limit.minX ? limit.maxX : limit.minX]
      const heights = [aiFloatPosition.y, limit.maxY, Math.max(limit.minY, limit.maxY - 70), limit.minY + 72]
      const controls = [...document.querySelectorAll<HTMLElement>('.primary-btn,.todo-actions button,.task-card button,.kb-toolbar button,.kb-page__select,.kb-split__mobile-actions button')]
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width && rect.height && rect.bottom > 0 && rect.top < window.innerHeight)
      for (const y of heights) {
        const top = Math.min(Math.max(y, limit.minY), limit.maxY)
        for (const left of sides) {
          if (controls.every((rect) => left >= rect.right + 4 || left + aiFloatSize.value + 4 <= rect.left || top >= rect.bottom + 4 || top + aiFloatSize.value + 4 <= rect.top)) {
            aiFloatPosition.x = left
            aiFloatPosition.y = top
            return
          }
        }
      }
    }

    const syncAIFloatInitialPosition = () => {
      aiFloatSize.value = window.innerWidth <= 768 ? 56 : 64
      if (aiFloatPosition.x === 0 && aiFloatPosition.y === 0) {
        clampAIFloatPosition(
          window.innerWidth - aiFloatSize.value - 8,
          window.innerHeight - aiFloatSize.value - 88
        )
        requestAnimationFrame(avoidCriticalControls)
        return
      }

      clampAIFloatPosition(aiFloatPosition.x, aiFloatPosition.y)
      requestAnimationFrame(avoidCriticalControls)
    }

    const handleAIFloatPointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return
      const deltaX = event.clientX - aiFloatDragStart.pointerX
      const deltaY = event.clientY - aiFloatDragStart.pointerY
      if (Math.hypot(deltaX, deltaY) > 6) {
        hasAIFloatMoved.value = true
        isAIFloatDragging.value = true
      }
      if (hasAIFloatMoved.value) clampAIFloatPosition(aiFloatDragStart.x + deltaX, aiFloatDragStart.y + deltaY)
    }

    const handleAIFloatPointerUp = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return
      activePointerId = null
      suppressClick = true
      if (hasAIFloatMoved.value) {
        const limit = getViewportLimit()
        aiFloatPosition.x = aiFloatPosition.x < window.innerWidth / 2 ? limit.minX : limit.maxX
        avoidCriticalControls()
      } else {
        handleOpenAISidebar({}, event.currentTarget as HTMLElement)
      }
      isAIFloatDragging.value = false
      window.setTimeout(() => { suppressClick = false }, 0)
    }

    const handleAIFloatPointerCancel = () => {
      activePointerId = null
      isAIFloatDragging.value = false
    }

    const handleAIFloatPointerDown = (event: PointerEvent) => {
      activePointerId = event.pointerId
      ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
      hasAIFloatMoved.value = false
      aiFloatDragStart.x = aiFloatPosition.x
      aiFloatDragStart.y = aiFloatPosition.y
      aiFloatDragStart.pointerX = event.clientX
      aiFloatDragStart.pointerY = event.clientY
    }

    // 点击AI助手浮动按钮
    const handleAIFloatClick = () => {
      if (suppressClick) return
      handleOpenAISidebar({}, document.activeElement as HTMLElement)
    }

    const aiFloatButtonStyle = computed(() => ({
      left: `${aiFloatPosition.x}px`,
      top: `${aiFloatPosition.y}px`
    }))

    onMounted(() => {
      syncAIFloatInitialPosition()
      window.addEventListener('resize', syncAIFloatInitialPosition)
      window.addEventListener('scroll', avoidCriticalControls, true)
    })
    watch(() => route.fullPath, () => {
      closeOverlay(false)
      pendingDraft.value = ''
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', syncAIFloatInitialPosition)
      window.removeEventListener('scroll', avoidCriticalControls, true)
      handleAIFloatPointerCancel()
      closeOverlay(false)
    })
    
    return {
      showAISidebar,
      pendingDraft,
      activeOverlay,
      handleOpenAISidebar,
      aiFloatButtonStyle,
      isAIFloatDragging,
      handleAIFloatClick,
      handleAIFloatPointerDown,
      handleAIFloatPointerMove,
      handleAIFloatPointerUp,
      handleAIFloatPointerCancel
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
  min-height: 100vh;
  width: 100%;
  transition: margin-left .28s;
  position: relative;
  background: #f5f7fb;
  padding-top: var(--app-header-height);
  box-sizing: border-box;
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

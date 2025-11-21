<template>
  <div class="gallery-container">
    <!-- 顶部装饰背景 -->
    <div class="hero-background">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <div class="content-wrapper">
      <!-- 页面标题 -->
      <header class="page-header">
        <div class="title-decoration"></div>
        <h1 class="main-title">AI 艺术廊</h1>
        <p class="subtitle">探索人工智能创作的视觉艺术之美</p>
        <div class="title-underline"></div>
      </header>

      <!-- 图片展示区 -->
      <section class="gallery-section">
        <div class="section-header">
          <div class="section-title-wrapper">
            <span class="section-icon">📸</span>
            <h2 class="section-title">图片作品集</h2>
          </div>
          <div class="artworks-count">
            <span class="count-number">{{ images.length }}</span>
            <span class="count-text">件作品</span>
          </div>
        </div>

        <!-- 图片网格 - 采用精致的卡片设计 -->
        <div class="images-grid">
          <div
            v-for="(image, index) in images"
            :key="image.id"
            class="image-card"
            :style="{ animationDelay: `${index * 0.08}s` }"
            @click="openLightbox(image, index)"
          >
            <div class="card-glow"></div>
            <div class="image-wrapper">
              <img 
                :src="image.url" 
                :alt="image.title"
                class="artwork-image"
                loading="lazy"
              />
              <div class="image-overlay">
                <div class="overlay-content">
                  <h3 class="image-title">{{ image.title }}</h3>
                  <p class="image-description">{{ image.description }}</p>
                  <div class="image-tags">
                    <span 
                      v-for="tag in image.tags" 
                      :key="tag"
                      class="tag"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div class="zoom-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 视频展示区 -->
      <section class="video-section">
        <div class="section-header">
          <div class="section-title-wrapper">
            <span class="section-icon">🎬</span>
            <h2 class="section-title">视频作品集</h2>
          </div>
          <div class="artworks-count">
            <span class="count-number">{{ videos.length }}</span>
            <span class="count-text">个视频</span>
          </div>
        </div>

        <!-- 视频横向滚动 -->
        <div class="videos-container">
          <div 
            ref="videoScrollContainer"
            class="videos-scroll"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          >
            <div
              v-for="(video, index) in videos"
              :key="video.id"
              class="video-card"
              :style="{ animationDelay: `${index * 0.1}s` }"
              @click="openVideoModal(video)"
            >
              <div class="video-card-inner">
                <div class="video-thumbnail">
                  <img 
                    :src="video.thumbnail" 
                    :alt="video.title"
                    class="thumbnail-image"
                  />
                  <div class="play-overlay">
                    <div class="play-btn">
                      <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor">
                        <path d="M16 10v28l22-14z"/>
                      </svg>
                    </div>
                  </div>
                  <div class="video-duration">{{ video.duration }}</div>
                </div>
                <div class="video-info">
                  <h3 class="video-title">{{ video.title }}</h3>
                  <p class="video-description">{{ video.description }}</p>
                  <div class="video-stats">
                    <span class="stat-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      {{ video.views }}
                    </span>
                    <span class="stat-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      {{ video.likes }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 滚动导航按钮 -->
          <button 
            v-if="showLeftArrow"
            @click="scrollVideos('left')"
            class="nav-arrow nav-left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button 
            v-if="showRightArrow"
            @click="scrollVideos('right')"
            class="nav-arrow nav-right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </section>

    </div>

    <!-- 图片灯箱 -->
    <Teleport to="body">
      <Transition name="fade-scale">
        <div 
          v-if="lightboxOpen" 
          class="lightbox"
          @click="closeLightbox"
        >
          <div class="lightbox-bg"></div>
          
          <button class="btn-close" @click="closeLightbox" title="关闭 (ESC)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <button 
            v-if="currentImageIndex > 0"
            class="btn-nav btn-prev"
            @click.stop="prevImage"
            title="上一张 (←)"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <div class="lightbox-main" @click.stop>
            <div class="lightbox-image-wrapper">
              <img 
                :src="currentImage?.url" 
                :alt="currentImage?.title"
                class="lightbox-img"
              />
            </div>
            <div class="lightbox-details">
              <h3 class="details-title">{{ currentImage?.title }}</h3>
              <p class="details-desc">{{ currentImage?.description }}</p>
              <div class="details-tags">
                <span 
                  v-for="tag in currentImage?.tags" 
                  :key="tag"
                  class="details-tag"
                >
                  {{ tag }}
                </span>
              </div>
              <div class="details-counter">
                {{ currentImageIndex + 1 }} / {{ images.length }}
              </div>
            </div>
          </div>
          
          <button 
            v-if="currentImageIndex < images.length - 1"
            class="btn-nav btn-next"
            @click.stop="nextImage"
            title="下一张 (→)"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- 视频播放模态框 -->
    <Teleport to="body">
      <Transition name="fade-scale">
        <div 
          v-if="videoModalOpen" 
          class="video-modal"
          @click="closeVideoModal"
        >
          <div class="modal-bg"></div>
          
          <button class="btn-close" @click="closeVideoModal" title="关闭 (ESC)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div class="modal-main" @click.stop>
            <div class="video-player">
              <div class="player-placeholder">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <p class="placeholder-title">{{ currentVideo?.title }}</p>
                <p class="placeholder-text">视频播放器</p>
                <p class="placeholder-hint">(实际项目中这里嵌入真实视频)</p>
              </div>
            </div>
            <div class="modal-info">
              <h3 class="modal-title">{{ currentVideo?.title }}</h3>
              <p class="modal-desc">{{ currentVideo?.description }}</p>
              <div class="modal-meta">
                <span class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  {{ currentVideo?.views }} 次观看
                </span>
                <span class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {{ currentVideo?.likes }} 人点赞
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 图片接口
interface Image {
  id: string
  url: string
  title: string
  description: string
  tags: string[]
}

// 视频接口
interface Video {
  id: string
  thumbnail: string
  title: string
  description: string
  duration: string
  views: string
  likes: string
}

// 图片数据
const images = ref<Image[]>([
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1686904423955-b2b47f1b3f71?w=600',
    title: '赛博朋克都市',
    description: 'AI生成的未来主义城市景观，霓虹灯与摩天大楼的完美融合',
    tags: ['赛博朋克', '城市', '3D渲染']
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1707327956851-30a531b70cda?w=600',
    title: '抽象梦境',
    description: '超现实主义的抽象艺术，色彩与形状的奇妙碰撞',
    tags: ['抽象艺术', '色彩', '超现实']
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1706885093487-7eda37b48a60?w=600',
    title: '数字肖像',
    description: 'AI增强的人像摄影，展现科技与人文的完美结合',
    tags: ['人像', '数字艺术', '摄影']
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1706049379414-437ec3a54e93?w=600',
    title: '自然融合',
    description: '自然与科技的奇妙融合，生命力与未来感的交织',
    tags: ['自然', '科技', '融合']
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1707327956851-30a531b70cda?w=600',
    title: '宇宙波纹',
    description: '太空主题艺术创作，探索宇宙深处的奥秘',
    tags: ['太空', '宇宙', '抽象']
  },
  {
    id: '6',
    url: 'https://images.unsplash.com/photo-1686904423955-b2b47f1b3f71?w=600',
    title: '霓虹之夜',
    description: '充满活力的霓虹城市夜景，现代都市的璀璨光芒',
    tags: ['霓虹', '夜景', '都市']
  },
  {
    id: '7',
    url: 'https://images.unsplash.com/photo-1706885093487-7eda37b48a60?w=600',
    title: '数字花园',
    description: '未来主义的植物艺术，科技改造的自然之美',
    tags: ['花园', '数字', '自然']
  },
  {
    id: '8',
    url: 'https://images.unsplash.com/photo-1707327956851-30a531b70cda?w=600',
    title: '量子领域',
    description: '微观量子世界的可视化，科学与艺术的完美呈现',
    tags: ['量子', '科学', '抽象']
  }
])

// 视频数据
const videos = ref<Video[]>([
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600',
    title: 'AI动画作品集',
    description: 'AI生成的动画集锦，展现人工智能的创作潜力',
    duration: '2:30',
    views: '1.2万',
    likes: '1205'
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600',
    title: '动态图形演示',
    description: '创意动态图形展示，流畅的视觉表现力',
    duration: '1:45',
    views: '8300',
    likes: '890'
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600',
    title: '3D角色动画',
    description: 'AI驱动的角色动作，自然流畅的运动表现',
    duration: '3:20',
    views: '1.5万',
    likes: '2100'
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600',
    title: '视觉特效合集',
    description: '令人惊叹的AI创作视觉特效，科技与艺术的碰撞',
    duration: '4:15',
    views: '2.0万',
    likes: '3500'
  },
  {
    id: '5',
    thumbnail: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600',
    title: '抽象运动艺术',
    description: '流动的抽象动画艺术，色彩与形状的律动之美',
    duration: '2:10',
    views: '9800',
    likes: '1500'
  }
])

// 灯箱状态
const lightboxOpen = ref(false)
const currentImage = ref<Image | null>(null)
const currentImageIndex = ref(0)

// 视频模态框状态
const videoModalOpen = ref(false)
const currentVideo = ref<Video | null>(null)

// 视频滚动相关
const videoScrollContainer = ref<HTMLElement | null>(null)
const showLeftArrow = ref(false)
const showRightArrow = ref(true)
const isDragging = ref(false)
const startX = ref(0)
const scrollLeft = ref(0)

// 打开灯箱
const openLightbox = (image: Image, index: number) => {
  currentImage.value = image
  currentImageIndex.value = index
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

// 关闭灯箱
const closeLightbox = () => {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

// 上一张图片
const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    currentImage.value = images.value[currentImageIndex.value]
  }
}

// 下一张图片
const nextImage = () => {
  if (currentImageIndex.value < images.value.length - 1) {
    currentImageIndex.value++
    currentImage.value = images.value[currentImageIndex.value]
  }
}

// 打开视频模态框
const openVideoModal = (video: Video) => {
  currentVideo.value = video
  videoModalOpen.value = true
  document.body.style.overflow = 'hidden'
}

// 关闭视频模态框
const closeVideoModal = () => {
  videoModalOpen.value = false
  document.body.style.overflow = ''
}

// 视频滚动
const scrollVideos = (direction: 'left' | 'right') => {
  if (!videoScrollContainer.value) return
  const scrollAmount = 400
  const newScrollLeft = direction === 'left'
    ? videoScrollContainer.value.scrollLeft - scrollAmount
    : videoScrollContainer.value.scrollLeft + scrollAmount
  
  videoScrollContainer.value.scrollTo({
    left: newScrollLeft,
    behavior: 'smooth'
  })
}

// 处理滚动箭头显示
const updateScrollArrows = () => {
  if (!videoScrollContainer.value) return
  const { scrollLeft, scrollWidth, clientWidth } = videoScrollContainer.value
  showLeftArrow.value = scrollLeft > 0
  showRightArrow.value = scrollLeft < scrollWidth - clientWidth - 10
}

// 鼠标拖拽滚动
const handleMouseDown = (e: MouseEvent) => {
  if (!videoScrollContainer.value) return
  isDragging.value = true
  startX.value = e.pageX - videoScrollContainer.value.offsetLeft
  scrollLeft.value = videoScrollContainer.value.scrollLeft
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !videoScrollContainer.value) return
  e.preventDefault()
  const x = e.pageX - videoScrollContainer.value.offsetLeft
  const walk = (x - startX.value) * 2
  videoScrollContainer.value.scrollLeft = scrollLeft.value - walk
}

const handleMouseUp = () => {
  isDragging.value = false
}

// 键盘导航
const handleKeydown = (e: KeyboardEvent) => {
  if (lightboxOpen.value) {
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') prevImage()
    if (e.key === 'ArrowRight') nextImage()
  }
  if (videoModalOpen.value && e.key === 'Escape') {
    closeVideoModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (videoScrollContainer.value) {
    videoScrollContainer.value.addEventListener('scroll', updateScrollArrows)
    updateScrollArrows()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (videoScrollContainer.value) {
    videoScrollContainer.value.removeEventListener('scroll', updateScrollArrows)
  }
})
</script>

<style scoped>
/* ==================== 全局样式 ==================== */
* {
  box-sizing: border-box;
}

.gallery-container {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    #0a0e27 0%, 
    #1a1333 25%, 
    #2d1b4e 50%, 
    #1a1333 75%, 
    #0a0e27 100%
  );
  position: relative;
  overflow-x: hidden;
  padding: 80px 20px;
}

/* 顶部装饰背景 */
.hero-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
  top: -200px;
  left: -200px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #ec4899 0%, transparent 70%);
  top: 20%;
  right: -150px;
  animation-delay: -7s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
  bottom: 10%;
  left: 30%;
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
  }
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* ==================== 页面标题 ==================== */
.page-header {
  text-align: center;
  margin-bottom: 100px;
  animation: fadeSlideDown 1s ease-out;
}

@keyframes fadeSlideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title-decoration {
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
  margin: 0 auto 30px;
  border-radius: 2px;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.main-title {
  font-size: 72px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #ec4899 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
  letter-spacing: -2px;
  text-shadow: 0 0 80px rgba(139, 92, 246, 0.3);
}

.subtitle {
  font-size: 20px;
  color: #a0aec0;
  font-weight: 300;
  letter-spacing: 2px;
  margin-bottom: 40px;
}

.title-underline {
  width: 120px;
  height: 2px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899, #3b82f6);
  margin: 0 auto;
  border-radius: 1px;
  animation: expand 1s ease-out;
}

@keyframes expand {
  from {
    width: 0;
  }
  to {
    width: 120px;
  }
}

/* ==================== 区块标题 ==================== */
.gallery-section,
.video-section {
  margin-bottom: 120px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60px;
  padding-bottom: 30px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-icon {
  font-size: 42px;
  filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.5));
}

.section-title {
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.artworks-count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 16px 24px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.count-number {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin-bottom: 4px;
}

.count-text {
  font-size: 14px;
  color: #a0aec0;
  letter-spacing: 1px;
}

/* ==================== 图片展示区 ==================== */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 32px;
}

.image-card {
  position: relative;
  animation: floatUp 0.8s ease-out forwards;
  opacity: 0;
  cursor: pointer;
}

@keyframes floatUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.card-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6);
  background-size: 300% 300%;
  border-radius: 24px;
  opacity: 0;
  transition: opacity 0.4s ease;
  animation: gradientRotate 6s ease infinite;
  z-index: -1;
  filter: blur(20px);
}

.image-card:hover .card-glow {
  opacity: 0.8;
}

@keyframes gradientRotate {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.image-wrapper {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(20, 20, 40, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-card:hover .image-wrapper {
  transform: translateY(-8px);
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 
    0 20px 60px rgba(139, 92, 246, 0.3),
    0 0 40px rgba(236, 72, 153, 0.2);
}

.artwork-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-card:hover .artwork-image {
  transform: scale(1.08);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(10, 14, 39, 0.95) 0%,
    rgba(10, 14, 39, 0.7) 40%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.overlay-content {
  transform: translateY(20px);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-card:hover .overlay-content {
  transform: translateY(0);
}

.image-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.image-description {
  font-size: 14px;
  color: #cbd5e0;
  line-height: 1.6;
  margin-bottom: 12px;
}

.image-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 14px;
  background: rgba(139, 92, 246, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 20px;
  font-size: 12px;
  color: #e9d5ff;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tag:hover {
  background: rgba(139, 92, 246, 0.5);
  border-color: rgba(139, 92, 246, 0.6);
  transform: translateY(-2px);
}

.zoom-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  opacity: 0;
  transform: scale(0.8) rotate(-90deg);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-card:hover .zoom-icon {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

/* ==================== 视频展示区 ==================== */
.videos-container {
  position: relative;
}

.videos-scroll {
  display: flex;
  gap: 32px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 20px 0 40px;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  cursor: grab;
}

.videos-scroll:active {
  cursor: grabbing;
}

.videos-scroll::-webkit-scrollbar {
  display: none;
}

.video-card {
  flex: 0 0 auto;
  width: 420px;
  animation: floatUp 0.8s ease-out forwards;
  opacity: 0;
}

.video-card-inner {
  background: rgba(20, 20, 40, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
}

.video-card-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.1), 
    rgba(236, 72, 153, 0.1)
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 0;
}

.video-card:hover .video-card-inner {
  transform: translateY(-12px);
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 
    0 25px 70px rgba(139, 92, 246, 0.3),
    0 10px 30px rgba(236, 72, 153, 0.2);
}

.video-card:hover .video-card-inner::before {
  opacity: 1;
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: #000;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.video-card:hover .thumbnail-image {
  transform: scale(1.05);
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.4s ease;
}

.video-card:hover .play-overlay {
  background: rgba(0, 0, 0, 0.2);
}

.play-btn {
  width: 80px;
  height: 80px;
  background: rgba(139, 92, 246, 0.9);
  backdrop-filter: blur(10px);
  border: 3px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5);
  animation: pulse 2.5s ease-in-out infinite;
}

.video-card:hover .play-btn {
  transform: scale(1.15);
  background: rgba(236, 72, 153, 0.95);
  box-shadow: 0 12px 50px rgba(236, 72, 153, 0.6);
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5),
                0 0 0 0 rgba(139, 92, 246, 0.7);
  }
  50% {
    box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5),
                0 0 0 20px rgba(139, 92, 246, 0);
  }
}

.video-duration {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.video-info {
  padding: 24px;
  position: relative;
  z-index: 1;
}

.video-title {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 10px;
  transition: color 0.3s ease;
  line-height: 1.4;
}

.video-card:hover .video-title {
  color: #a78bfa;
}

.video-description {
  font-size: 14px;
  color: #a0aec0;
  line-height: 1.6;
  margin-bottom: 16px;
}

.video-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #718096;
  transition: color 0.3s ease;
}

.stat-item svg {
  opacity: 0.7;
}

.stat-item:hover {
  color: #8b5cf6;
}

.stat-item:hover svg {
  opacity: 1;
}

/* 导航按钮 */
.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  background: rgba(139, 92, 246, 0.9);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.4);
  outline: none;
}

.nav-arrow:hover {
  background: rgba(236, 72, 153, 0.95);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 12px 40px rgba(236, 72, 153, 0.5);
}

.nav-arrow:active {
  transform: translateY(-50%) scale(0.95);
}

.nav-left {
  left: -28px;
}

.nav-right {
  right: -28px;
}

/* ==================== 灯箱 ==================== */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.lightbox-bg {
  position: absolute;
  inset: 0;
  background: rgba(10, 14, 39, 0.97);
  backdrop-filter: blur(20px);
}

.lightbox-main {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.lightbox-image-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lightbox-img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 16px;
  box-shadow: 
    0 30px 90px rgba(139, 92, 246, 0.4),
    0 0 60px rgba(236, 72, 153, 0.3);
  border: 2px solid rgba(139, 92, 246, 0.3);
}

.lightbox-details {
  width: 100%;
  max-width: 700px;
  background: rgba(20, 20, 40, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
}

.details-title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #ffffff, #a78bfa);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.details-desc {
  font-size: 16px;
  color: #cbd5e0;
  line-height: 1.7;
  margin-bottom: 20px;
}

.details-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.details-tag {
  padding: 8px 18px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 20px;
  font-size: 14px;
  color: #e9d5ff;
  font-weight: 500;
}

.details-counter {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
  letter-spacing: 2px;
}

.btn-close {
  position: absolute;
  top: 30px;
  right: 30px;
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.btn-close:hover {
  background: rgba(239, 68, 68, 0.9);
  border-color: rgba(239, 68, 68, 0.5);
  transform: rotate(90deg) scale(1.1);
}

.btn-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 64px;
  height: 64px;
  background: rgba(139, 92, 246, 0.9);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
}

.btn-nav:hover {
  background: rgba(236, 72, 153, 0.95);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-50%) scale(1.15);
  box-shadow: 0 15px 50px rgba(236, 72, 153, 0.5);
}

.btn-prev {
  left: 30px;
}

.btn-next {
  right: 30px;
}

/* ==================== 视频模态框 ==================== */
.video-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.modal-bg {
  position: absolute;
  inset: 0;
  background: rgba(10, 14, 39, 0.97);
  backdrop-filter: blur(20px);
}

.modal-main {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
}

.video-player {
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 
    0 30px 90px rgba(139, 92, 246, 0.4),
    0 0 60px rgba(236, 72, 153, 0.3);
  border: 2px solid rgba(139, 92, 246, 0.3);
}

.player-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  gap: 20px;
}

.player-placeholder svg {
  opacity: 0.6;
}

.placeholder-title {
  font-size: 28px;
  font-weight: 700;
}

.placeholder-text {
  font-size: 18px;
  color: #a0aec0;
}

.placeholder-hint {
  font-size: 14px;
  color: #718096;
  margin-top: 10px;
}

.modal-info {
  background: rgba(20, 20, 40, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  padding: 32px;
  text-align: center;
}

.modal-title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #ffffff, #a78bfa);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.modal-desc {
  font-size: 16px;
  color: #cbd5e0;
  line-height: 1.7;
  margin-bottom: 24px;
}

.modal-meta {
  display: flex;
  gap: 32px;
  justify-content: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #a0aec0;
}

.meta-item svg {
  opacity: 0.7;
}

/* ==================== 过渡动画 ==================== */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
}

.fade-scale-enter-from .lightbox-img,
.fade-scale-leave-to .lightbox-img,
.fade-scale-enter-from .video-player,
.fade-scale-leave-to .video-player {
  transform: scale(0.85) translateY(30px);
}

.fade-scale-enter-from .lightbox-details,
.fade-scale-leave-to .lightbox-details,
.fade-scale-enter-from .modal-info,
.fade-scale-leave-to .modal-info {
  transform: translateY(30px);
  opacity: 0;
}

/* ==================== 响应式 ==================== */
@media (max-width: 1200px) {
  .main-title {
    font-size: 56px;
  }

  .section-title {
    font-size: 40px;
  }

  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }

  .video-card {
    width: 380px;
  }
}

@media (max-width: 768px) {
  .gallery-container {
    padding: 60px 16px;
  }

  .main-title {
    font-size: 40px;
  }

  .subtitle {
    font-size: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 40px;
  }

  .section-icon {
    font-size: 32px;
  }

  .section-title {
    font-size: 32px;
  }

  .artworks-count {
    align-self: flex-end;
  }

  .images-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .video-card {
    width: 320px;
  }

  .nav-arrow {
    display: none;
  }

  .lightbox,
  .video-modal {
    padding: 20px;
  }

  .btn-close {
    top: 15px;
    right: 15px;
    width: 44px;
    height: 44px;
  }

  .btn-nav {
    width: 48px;
    height: 48px;
  }

  .btn-prev {
    left: 15px;
  }

  .btn-next {
    right: 15px;
  }

  .lightbox-details,
  .modal-info {
    padding: 24px;
  }

  .details-title,
  .modal-title {
    font-size: 24px;
  }

  .details-desc,
  .modal-desc {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 32px;
  }

  .section-title {
    font-size: 28px;
  }

  .video-card {
    width: 280px;
  }

  .btn-nav {
    width: 40px;
    height: 40px;
  }

  .btn-nav svg {
    width: 20px;
    height: 20px;
  }
}
</style>
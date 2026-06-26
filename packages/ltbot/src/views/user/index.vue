<template>
  <div class="user-profile-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
          </div>
          
    <!-- 主要内容区 -->
    <div class="content-container">
      
      <!-- 左侧：动态卡片区域 -->
      <div class="left-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">💼</span>
            <span>个人信息</span>
          </h2>
          <p class="section-subtitle">点击卡片查看详细信息</p>
        </div>
        <DynamicCard :auto-loop="true" :loop-delay="2000" />
      </div>

      <!-- 右侧：个人资料卡片 -->
      <div class="right-section">
        <div class="section-header">
          <h2 class="section-title">
            <span class="title-icon">👤</span>
            <span>关于我</span>
          </h2>
          <p class="section-subtitle">开发者档案</p>
        </div>
        <div class="profile-wrapper">
          <ProfileCard 
            :avatar-url="'https://q1.qlogo.cn/g?b=qq&nk=190848757&s=640'"
            :name="'jinming jiang'"
            :title="'前端工程师'"
            :handle="'newbiekim'"
            :status="'Online'"
            :contact-text="'联系'"
            class="profile-card-animation"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DynamicCard from '@/components/DynamicCard.vue'
import ProfileCard from '@/components/ProfileCard.vue'
import { getProjectInfo } from '@/mcp/index'

const projectInfo = ref({})

onMounted(async () => {
  const projectInfo = await getProjectInfo('7001433749907333120')
  console.log(projectInfo)
})
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.user-profile-page {
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, 
    #f0f4f8 0%, 
    #e2e8f0 25%, 
    #cbd5e1 50%, 
    #e2e8f0 75%, 
    #f0f4f8 100%
  );
  position: relative;
  overflow: hidden;
}

/* ==================== 背景装饰 ==================== */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
  animation: float 25s ease-in-out infinite;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #60a5fa 0%, transparent 70%);
  top: -250px;
  left: -250px;
  animation-delay: 0s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #a78bfa 0%, transparent 70%);
  top: 30%;
  right: -200px;
  animation-delay: -10s;
}

.orb-3 {
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, #34d399 0%, transparent 70%);
  bottom: -150px;
  left: 40%;
  animation-delay: -20s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(80px, -80px) scale(1.1);
  }
  66% {
    transform: translate(-50px, 50px) scale(0.9);
  }
}

/* ==================== 主要内容区 ==================== */
.content-container {
  position: relative;
  z-index: 1;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 40px 80px;
  max-width: 1600px;
  margin: 0 auto;
}

/* ==================== 左右区域 ==================== */
.left-section,
.right-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.section-header {
  margin-bottom: 24px;
  animation: slideDown 0.8s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  text-shadow: none;
}

.title-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.section-subtitle {
  font-size: 15px;
  color: #64748b;
  font-weight: 400;
  letter-spacing: 0.5px;
  padding-left: 48px;
}

/* ==================== Profile卡片包装 ==================== */
.profile-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 10px;
  animation: fadeIn 1s ease-out 0.3s backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
}
  to {
    opacity: 1;
    transform: scale(1);
}
}

.profile-wrapper::-webkit-scrollbar {
  width: 8px;
}

.profile-wrapper::-webkit-scrollbar-track {
  background: rgba(226, 232, 240, 0.5);
  border-radius: 4px;
}

.profile-wrapper::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  border-radius: 4px;
}

.profile-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1400px) {
  .content-container {
    padding: 30px;
    gap: 30px;
  }

  .section-title {
    font-size: 28px;
  }

  .title-icon {
    font-size: 32px;
  }

  .section-subtitle {
    font-size: 14px;
  }
}

@media (max-width: 1024px) {
  .content-container {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 20px;
    height: auto;
    min-height: 100vh;
  }

  .left-section,
  .right-section {
    height: auto;
    min-height: 600px;
  }

  .profile-wrapper {
    max-height: 800px;
  }

  .section-title {
    font-size: 26px;
  }

  .section-subtitle {
    padding-left: 0;
    margin-top: 8px;
  }
}

@media (max-width: 768px) {
  .user-profile-page {
    height: auto;
    min-height: 100vh;
  }

  .content-container {
    padding: 16px;
    gap: 30px;
  }

  .section-header {
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 24px;
  }

  .title-icon {
    font-size: 28px;
}

  .section-subtitle {
    font-size: 13px;
  }

  .left-section,
  .right-section {
    min-height: 500px;
  }

  .profile-wrapper {
    max-height: 600px;
  }
}

@media (max-width: 480px) {
  .content-container {
    padding: 12px;
    gap: 24px;
  }

  .section-title {
    font-size: 22px;
  }

  .title-icon {
    font-size: 26px;
  }

  .orb {
    filter: blur(80px);
    opacity: 0.1;
  }
}
</style>
<template>
  <section class="section-block resource-section" :class="variant">
    <WorkbenchSectionHead
      :title="title"
      :badge="badge"
      :badge-class="badgeClass"
    />
    <div class="resource-grid">
      <article
        v-for="resource in resources"
        :key="resource.name"
        class="glow-card"
        :class="{ clickable: Boolean(resource.url) }"
        @click="handleOpen(resource)"
      >
        <div class="resource-icon">
          <img
            v-if="resource.image"
            :src="resource.image"
            :alt="resource.name"
            @error="handleImageError"
          >
          <span v-else>{{ resource.iconText }}</span>
        </div>
        <div class="resource-content">
          <h3 class="resource-name">{{ resource.name }}</h3>
          <p class="resource-desc">{{ resource.introduce }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import defaultImg from '@/assets/vue-favicon.png'
import type { WorkbenchResource, WorkbenchResourceVariant } from '../types'
import WorkbenchSectionHead from './WorkbenchSectionHead.vue'

defineProps<{
  title: string
  resources: WorkbenchResource[]
  variant: WorkbenchResourceVariant
  badge?: string
  badgeClass?: string
}>()

function handleOpen(resource: WorkbenchResource) {
  if (!resource.url) {
    return
  }

  window.open(resource.url, '_blank', 'noopener,noreferrer')
}

function handleImageError(event: Event) {
  const image = event.target as HTMLImageElement
  image.src = defaultImg
}
</script>

<style lang="scss" scoped>
.section-block {
  padding: 20px;
  border: 1px solid var(--workbench-line);
  border-radius: 12px;
  background: var(--workbench-panel);
  box-shadow: var(--workbench-shadow);
}

.resource-section {
  margin-top: 20px;
}

.resource-section.hot-tools {
  border-color: rgba(255, 69, 0, 0.1);
  background: linear-gradient(135deg, rgba(255, 69, 0, 0.05), rgba(255, 140, 0, 0.05));
}

.resource-section.hot-tutorials {
  border-color: rgba(34, 139, 34, 0.1);
  background: linear-gradient(135deg, rgba(34, 139, 34, 0.05), rgba(50, 205, 50, 0.05));
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 14px;
}

.glow-card {
  position: relative;
  min-height: 104px;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e8eaed;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.glow-card.clickable {
  cursor: pointer;
}

.glow-card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, #08c96f, transparent);
  animation: rotate 3s linear infinite;
  opacity: 0;
  transition: opacity 0.3s;
}

.glow-card:hover {
  border-color: #4285f4;
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.glow-card:hover::before {
  opacity: 1;
}

.resource-icon,
.resource-content {
  position: relative;
  z-index: 1;
}

.resource-icon {
  width: 50px;
  height: 50px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  color: var(--workbench-blue);
  background: #f2f6ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 18px;
  font-weight: 800;
}

.resource-icon img {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
}

.resource-name {
  margin: 0 0 8px;
  color: #1a1a1a;
  font-size: 16px;
  font-weight: 700;
}

.resource-desc {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 1100px) {
  .resource-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .resource-grid {
    grid-template-columns: 1fr;
  }
}
</style>

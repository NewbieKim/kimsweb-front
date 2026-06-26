<template>
  <section class="section-block">
    <WorkbenchSectionHead title="项目地址" />
    <div class="project-grid">
      <div v-for="project in projects" :key="project.title" class="flip-card">
        <div class="flip-inner">
          <div class="front">
            <div class="project-name">
              <span class="project-icon">{{ project.iconText }}</span>
              <span>{{ project.title }}</span>
            </div>
            <p class="project-desc">项目简介：{{ project.introduce }}</p>
          </div>
          <div class="back">
            <div class="url-goto">
              <a
                v-for="link in project.links"
                :key="`${project.title}-${link.label}`"
                class="env-add"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ link.label }}
              </a>
              <span v-if="project.links.length === 0" class="empty-link">暂无可跳转地址</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { WorkbenchProject } from '../types'
import WorkbenchSectionHead from './WorkbenchSectionHead.vue'

defineProps<{
  projects: WorkbenchProject[]
}>()
</script>

<style lang="scss" scoped>
.section-block {
  padding: 20px;
  border: 1px solid var(--workbench-line);
  border-radius: 12px;
  background: var(--workbench-panel);
  box-shadow: var(--workbench-shadow);
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 14px;
}

.flip-card {
  width: 100%;
  height: 180px;
  perspective: 1000px;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card:hover .flip-inner {
  transform: rotateY(180deg);
}

.front,
.back {
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 20px;
  border: 1px solid #e8eaed;
  border-radius: 12px;
  backface-visibility: hidden;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.flip-card:hover .front,
.flip-card:hover .back {
  border-color: #4285f4;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(66, 133, 244, 0.2);
}

.front {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
}

.back {
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotateY(180deg);
  background: #f8f9fa;
}

.project-name {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
  color: var(--workbench-text);
  font-size: 20px;
  font-weight: 800;
}

.project-icon {
  width: 44px;
  height: 44px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  color: #1f6ff2;
  background: #eef4ff;
  font-size: 15px;
  font-weight: 800;
}

.project-desc {
  margin: 0;
  color: var(--workbench-muted);
  font-size: 15px;
  line-height: 1.6;
}

.url-goto {
  width: 100%;
  display: grid;
  gap: 10px;
}

.env-add {
  display: block;
  padding: 10px 16px;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(45deg, #4285f4, #34a853);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.env-add:hover {
  transform: translateY(-2px);
  background: linear-gradient(45deg, #3367d6, #2d7d32);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.empty-link {
  color: var(--workbench-muted);
  text-align: center;
}

@media (max-width: 1100px) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
</style>

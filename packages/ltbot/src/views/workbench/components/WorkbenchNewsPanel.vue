<template>
  <aside class="panel news-panel">
    <WorkbenchSectionHead title="今日 AI 资讯" tag="每日精选" />
    <div class="news-list">
      <article v-for="item in news" :key="item.title" class="news-card">
        <h3 class="card-title">{{ item.title }}</h3>
        <p class="card-desc">{{ item.description }}</p>
        <div class="news-meta">
          <span>{{ item.category }}</span>
          <span>{{ item.time }}</span>
        </div>
      </article>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { WorkbenchNews } from '../types'
import WorkbenchSectionHead from './WorkbenchSectionHead.vue'

defineProps<{
  news: WorkbenchNews[]
}>()
</script>

<style lang="scss" scoped>
.panel {
  height: 100%;
  padding: 20px;
  border: 1px solid var(--workbench-line);
  border-radius: 12px;
  background: var(--workbench-panel);
  box-shadow: var(--workbench-shadow);
}

.news-list {
  display: grid;
  gap: 12px;
}

.news-card {
  padding: 14px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #fbfcff;
}

.card-title {
  margin: 0 0 6px;
  color: var(--workbench-text);
  font-size: 15px;
  font-weight: 800;
}

.card-desc {
  margin: 0;
  color: var(--workbench-muted);
  font-size: 13px;
  line-height: 1.55;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  color: #8a96aa;
  font-size: 12px;
  font-weight: 700;
}
</style>

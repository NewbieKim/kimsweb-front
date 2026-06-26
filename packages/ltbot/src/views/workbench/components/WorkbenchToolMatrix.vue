<template>
  <div class="panel tools-panel">
    <WorkbenchSectionHead title="AI 工具矩阵" tag="按场景推荐" />
    <div class="tool-grid">
      <div v-for="tool in tools" :key="tool.name" class="tool-card">
        <div>
          <div class="tool-card-top">
            <span class="tool-name">{{ tool.name }}</span>
            <span class="tool-type">{{ tool.type }}</span>
          </div>
          <p class="card-desc">{{ tool.description }}</p>
        </div>
        <div class="mini-actions">
          <span v-for="action in tool.actions" :key="action">{{ action }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkbenchTool } from '../types'
import WorkbenchSectionHead from './WorkbenchSectionHead.vue'

defineProps<{
  tools: WorkbenchTool[]
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

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.tool-card {
  display: flex;
  min-height: 140px;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #fbfcff;
  transition: all 0.25s ease;
}

.tool-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 22px rgba(25, 36, 64, 0.1);
}

.tool-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.tool-name {
  color: var(--workbench-text);
  font-size: 15px;
  font-weight: 800;
}

.tool-type {
  flex: 0 0 auto;
  padding: 3px 7px;
  border-radius: 99px;
  color: #16a36f;
  background: rgba(22, 163, 111, 0.1);
  font-size: 12px;
  font-weight: 700;
}

.card-desc {
  margin: 0;
  color: var(--workbench-muted);
  font-size: 13px;
  line-height: 1.55;
}

.mini-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-actions span {
  padding: 4px 7px;
  border-radius: 7px;
  color: #3c4963;
  background: #eef3fb;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 700px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>

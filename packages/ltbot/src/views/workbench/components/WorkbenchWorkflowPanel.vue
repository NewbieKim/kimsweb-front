<template>
  <div class="panel workflow-panel">
    <WorkbenchSectionHead title="高频工作流" tag="一键运行" />
    <div class="workflow-list">
      <div v-for="workflow in workflows" :key="workflow.title" class="workflow-card">
        <div class="icon">{{ workflow.icon }}</div>
        <div class="workflow-content">
          <h3 class="card-title">{{ workflow.title }}</h3>
          <p class="card-desc">{{ workflow.description }}</p>
        </div>
        <span class="tag">{{ workflow.tag }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkbenchWorkflow } from '../types'
import WorkbenchSectionHead from './WorkbenchSectionHead.vue'

defineProps<{
  workflows: WorkbenchWorkflow[]
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

.workflow-list {
  display: grid;
  gap: 12px;
}

.workflow-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #fbfcff;
  transition: all 0.25s ease;
}

.workflow-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 22px rgba(25, 36, 64, 0.1);
}

.icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(135deg, #3f7cff, #16a36f);
  font-size: 13px;
  font-weight: 800;
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

.tag {
  padding: 5px 9px;
  border-radius: 99px;
  color: var(--workbench-blue);
  background: var(--workbench-blue-soft);
  font-size: 12px;
  font-weight: 700;
}
</style>

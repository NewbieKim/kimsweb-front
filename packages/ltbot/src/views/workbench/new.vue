<template>
  <div class="workbench-page">
    <main class="page">
      <section class="hero">
        <WorkbenchHero :hero="hero" />
        <WorkbenchTodoPanel />
      </section>

      <section class="layout">
        <WorkbenchToolMatrix :tools="tools" />
        <WorkbenchWorkflowPanel :workflows="workflows" />
        <WorkbenchNewsPanel :news="news" />
      </section>

      <WorkbenchProjectGrid :projects="projects" />
      <WorkbenchResourceSection
        title="热门工具"
        badge="HOT"
        badge-class="hot-badge"
        variant="hot-tools"
        :resources="hotTools"
      />
      <WorkbenchResourceSection
        title="热门教程"
        badge="教程"
        badge-class="tutorial-badge"
        variant="hot-tutorials"
        :resources="hotTutorials"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import WorkbenchHero from './components/WorkbenchHero.vue'
import WorkbenchNewsPanel from './components/WorkbenchNewsPanel.vue'
import WorkbenchProjectGrid from './components/WorkbenchProjectGrid.vue'
import WorkbenchResourceSection from './components/WorkbenchResourceSection.vue'
import WorkbenchTodoPanel from './components/WorkbenchTodoPanel.vue'
import WorkbenchToolMatrix from './components/WorkbenchToolMatrix.vue'
import WorkbenchWorkflowPanel from './components/WorkbenchWorkflowPanel.vue'
import {
  hero,
  hotTools,
  hotTutorials,
  news,
  projects,
  tools,
  workflows
} from './data/workbench'
</script>

<style lang="scss" scoped>
.workbench-page {
  --workbench-bg: #f5f7fb;
  --workbench-panel: #ffffff;
  --workbench-line: #e6eaf2;
  --workbench-text: #172033;
  --workbench-muted: #667085;
  --workbench-blue: #3f7cff;
  --workbench-blue-soft: #ebf2ff;
  --workbench-shadow: 0 10px 30px rgba(25, 36, 64, 0.08);

  min-height: 100%;
  color: var(--workbench-text);
  background: var(--workbench-bg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-bottom: 1px solid var(--workbench-line);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 18px;
  font-weight: 700;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 22px;
  color: var(--workbench-muted);
  font-size: 14px;
  font-weight: 600;
}

.nav-links span:first-child {
  color: var(--workbench-blue);
}

.page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.hero,
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.92fr) minmax(300px, 0.75fr);
  align-items: stretch;
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 1100px) {
  .hero,
  .layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .top-nav {
    padding: 0 16px;
  }

  .nav-links {
    display: none;
  }

  .page {
    padding: 14px;
  }
}
</style>

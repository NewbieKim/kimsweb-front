<template>
  <div class="create-space-container">
    <div class="space-actions">
      <strong>睡眠空间是外部网站</strong>
      <a :href="openUrl" target="_blank" rel="noopener noreferrer">打开睡眠空间网站 ↗</a>
      <RouterLink to="/workbench">返回工作台</RouterLink>
    </div>
    <iframe v-if="openUrl" :src="openUrl" title="睡眠空间" />
  </div>
</template>

<script setup lang="ts">
const openUrl = 'https://space.ltbot.top'
</script>

<style scoped lang="scss">
.create-space-container {
  width: 100%;
  height: calc(100dvh - var(--app-header-height));
  min-width: 0;
  display: flex;
  flex-direction: column;
  iframe { width: 100%; flex: 1; min-height: 0; border: 0; }
  .space-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 10px 16px; background: #fff; }
  .space-actions a { display: inline-flex; min-height: 44px; align-items: center; }
}
</style>

<template>
  <div class="section-head">
    <h2 class="section-title">
      {{ title }}
      <span v-if="badge" class="badge" :class="badgeClass">{{ badge }}</span>
    </h2>
    <span v-if="tag" class="tag">{{ tag }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  tag?: string
  badge?: string
  badgeClass?: string
}>()
</script>

<style lang="scss" scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  margin: 0;
  color: var(--workbench-text);
  font-size: 17px;
  font-weight: 800;
}

.tag {
  flex: 0 0 auto;
  padding: 5px 9px;
  border-radius: 99px;
  color: var(--workbench-blue);
  background: var(--workbench-blue-soft);
  font-size: 12px;
  font-weight: 700;
}

.badge {
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  animation: pulse 2s infinite;
}

.hot-badge {
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
}

.tutorial-badge {
  background: linear-gradient(45deg, #32cd32, #90ee90);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>

<template>
  <div class="kb-menu">
    <div class="kb-menu__title">菜单列表</div>
    <div v-if="loading" class="kb-menu__hint">加载中…</div>
    <div v-else-if="error" class="kb-menu__hint kb-menu__hint--error">{{ error }}</div>
    <div v-else-if="!nodes.length" class="kb-menu__hint">暂无文档，请将 HTML 放入服务器 skillKnowledgeBase 目录</div>
    <ul v-else class="kb-menu__list">
      <KbMenuNode
        v-for="node in nodes"
        :key="node.path"
        :node="node"
        :active-path="activePath"
        :depth="0"
        @select="(path) => $emit('select', path)"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import type { KbTreeNode } from '../types'
import KbMenuNode from './KbMenuNode.vue'

defineProps<{
  nodes: KbTreeNode[]
  activePath: string
  loading?: boolean
  error?: string
}>()

defineEmits<{
  select: [path: string]
}>()
</script>

<style scoped lang="less">
.kb-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8faff;
  border-right: 1px solid #e6eaf2;
  overflow: hidden;
  text-align: left;

  &__title {
    flex-shrink: 0;
    padding: 16px 18px 12px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #667085;
  }

  &__hint {
    padding: 12px 18px;
    font-size: 13px;
    color: #667085;
    line-height: 1.5;

    &--error {
      color: #d97706;
    }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0 8px 16px;
    overflow-y: auto;
    flex: 1;
  }
}
</style>

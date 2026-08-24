<template>
  <li class="kb-node">
    <div
      class="kb-node__row"
      :class="{
        'is-active': node.type === 'file' && node.path === activePath,
        'is-dir': node.type === 'dir'
      }"
      :style="{ paddingLeft: `${12 + depth * 14}px` }"
      @click="onClick"
    >
      <span v-if="node.type === 'dir'" class="kb-node__arrow" :class="{ open: expanded }">▸</span>
      <span v-else class="kb-node__dot"></span>
      <span class="kb-node__label">{{ node.title }}</span>
    </div>
    <ul v-if="node.type === 'dir' && expanded && node.children?.length" class="kb-node__children">
      <KbMenuNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :active-path="activePath"
        :depth="depth + 1"
        @select="(path) => $emit('select', path)"
      />
    </ul>
  </li>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import type { KbTreeNode } from '../types'

const props = defineProps<{
  node: KbTreeNode
  activePath: string
  depth: number
}>()

const emit = defineEmits<{
  select: [path: string]
}>()

const expanded = ref(props.depth < 1)

watch(
  () => props.activePath,
  (path) => {
    if (props.node.type === 'dir' && path.startsWith(props.node.path + '/')) {
      expanded.value = true
    }
  },
  { immediate: true }
)

function onClick() {
  if (props.node.type === 'dir') {
    expanded.value = !expanded.value
    return
  }
  emit('select', props.node.path)
}
</script>

<script lang="ts">
export default {
  name: 'KbMenuNode'
}
</script>

<style scoped lang="less">
.kb-node {
  list-style: none;

  &__children {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding-right: 10px;
    border-radius: 8px;
    cursor: pointer;
    color: #172033;
    font-size: 14px;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: #ebf2ff;
      color: #3f7cff;
    }

    &.is-active {
      background: #ebf2ff;
      color: #3f7cff;
      font-weight: 700;
    }

    &.is-dir {
      color: #172033;
      font-weight: 600;
    }
  }

  &__arrow {
    display: inline-block;
    width: 12px;
    font-size: 11px;
    color: #667085;
    transition: transform 0.15s;

    &.open {
      transform: rotate(90deg);
    }
  }

  &__dot {
    width: 12px;
    height: 4px;
    border-radius: 2px;
    background: transparent;
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>

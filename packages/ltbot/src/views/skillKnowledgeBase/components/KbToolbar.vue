<template>
  <div class="kb-toolbar">
    <div class="kb-toolbar__path" :title="activePath || ''">
      {{ activePath || '请选择文档' }}
    </div>
    <div class="kb-toolbar__actions">
      <div class="kb-toolbar__segment">
        <button
          type="button"
          class="seg-btn"
          :class="{ active: mode === 'preview' }"
          :disabled="!activePath"
          @click="$emit('update:mode', 'preview')"
        >
          预览
        </button>
        <span
          class="seg-edit-wrap"
          :class="{ locked: editLocked }"
          @mouseenter="onEditHover(true)"
          @mouseleave="onEditHover(false)"
        >
          <button
            type="button"
            class="seg-btn"
            :class="{ active: mode === 'edit' && !editLocked, locked: editLocked }"
            :disabled="!activePath || editLocked"
            :aria-disabled="editLocked || !activePath"
            @click="onEditClick"
          >
            <svg
              v-if="editLocked"
              class="lock-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V6Zm7 12H7v-8h10v8Zm-5-3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
              />
            </svg>
            编辑
          </button>
          <span v-if="editLocked && showLockTip" class="lock-tip" role="tooltip">
            在线页面无法编辑
          </span>
        </span>
      </div>
      <div class="kb-toolbar__more" ref="moreRef">
        <button
          type="button"
          class="more-btn"
          :class="{ open }"
          :disabled="!activePath"
          title="更多操作"
          aria-label="更多操作"
          @click="open = !open"
        >
          <svg class="more-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="6" cy="12" r="1.75" />
            <circle cx="12" cy="12" r="1.75" />
            <circle cx="18" cy="12" r="1.75" />
          </svg>
        </button>
        <div v-if="open" class="more-menu">
          <button type="button" @click="onOpenTab">
            <span class="more-menu__label">打开标签页</span>
          </button>
          <button type="button" @click="onDownload">
            <span class="more-menu__label">下载源文件</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { KbViewMode } from '../types'

const props = defineProps<{
  mode: KbViewMode
  activePath: string
  /** 生产环境为 true：禁用编辑 */
  editLocked?: boolean
}>()

const emit = defineEmits<{
  'update:mode': [mode: KbViewMode]
  'open-tab': []
  download: []
}>()

const open = ref(false)
const showLockTip = ref(false)
const moreRef = ref<HTMLElement | null>(null)

function onEditHover(enter: boolean) {
  if (!props.editLocked) {
    showLockTip.value = false
    return
  }
  showLockTip.value = enter
}

function onEditClick() {
  if (props.editLocked || !props.activePath) return
  emit('update:mode', 'edit')
}

function onOpenTab() {
  open.value = false
  emit('open-tab')
}

function onDownload() {
  open.value = false
  emit('download')
}

function onDocClick(e: MouseEvent) {
  if (!moreRef.value?.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped lang="less">
.kb-toolbar {
  --kb-blue: #3f7cff;
  --kb-blue-soft: #ebf2ff;
  --kb-line: #e6eaf2;
  --kb-muted: #667085;
  --kb-text: #172033;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--kb-line);
  background: #ffffff;
  flex-shrink: 0;

  &__path {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: var(--kb-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    text-align: left;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  &__segment {
    display: flex;
    padding: 3px;
    border-radius: 10px;
    background: #f0f3f9;
    border: 1px solid var(--kb-line);
  }

  &__more {
    position: relative;
  }
}

.seg-edit-wrap {
  position: relative;
  display: inline-flex;

  &.locked {
    cursor: not-allowed;
  }
}

.seg-btn {
  border: none;
  background: transparent;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--kb-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &.active {
    background: var(--kb-blue);
    color: #fff;
    font-weight: 600;
    box-shadow: 0 6px 14px rgba(63, 124, 255, 0.22);
  }

  &.locked,
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    color: #98a2b3;
    pointer-events: none;
  }
}

.lock-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.lock-tip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 999px;
  background: #344054;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  box-shadow: 0 8px 20px rgba(25, 36, 64, 0.18);
  z-index: 30;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: #344054;
  }
}

.more-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--kb-line);
  border-radius: 10px;
  background: #fff;
  color: var(--kb-muted);
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;

  &__icon {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  &:hover:not(:disabled),
  &.open {
    color: var(--kb-blue);
    border-color: #bcd2ff;
    background: var(--kb-blue-soft);
    box-shadow: 0 6px 14px rgba(63, 124, 255, 0.12);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.more-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 148px;
  padding: 6px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--kb-line);
  box-shadow: 0 12px 28px rgba(25, 36, 64, 0.12);
  z-index: 20;

  button {
    display: block;
    width: 100%;
    border: none;
    background: transparent;
    color: var(--kb-text);
    text-align: left;
    padding: 9px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      background: var(--kb-blue-soft);
      color: var(--kb-blue);
    }
  }
}
</style>

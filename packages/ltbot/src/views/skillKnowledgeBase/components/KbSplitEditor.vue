<template>
  <div class="kb-split-wrap">
  <div class="kb-split__mobile-tabs">
    <button type="button" :aria-pressed="mobilePane === 'preview'" @click="mobilePane = 'preview'">预览</button>
    <button type="button" :aria-pressed="mobilePane === 'source'" @click="mobilePane = 'source'">源码</button>
  </div>
  <div class="kb-split" ref="rootRef" :class="'kb-split--' + mobilePane">
    <div class="kb-split__preview" :style="{ width: ratio + '%' }">
      <iframe
        class="kb-split__iframe"
        :src="previewSrc"
        title="文档预览"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
    <div
      class="kb-split__divider"
      title="拖拽调整宽度"
      @mousedown="onDragStart"
    />
    <div class="kb-split__editor" :style="{ width: 100 - ratio + '%' }">
      <div class="kb-split__editor-bar">
        <span class="kb-split__editor-title">源码</span>
        <div class="kb-split__editor-actions">
          <button type="button" class="action-btn" :disabled="saving" @click="$emit('save')">
            {{ saving ? '保存中…' : '保存' }}
          </button>
          <button type="button" class="action-btn" :disabled="saving" @click="$emit('close')">关闭</button>
        </div>
      </div>
      <textarea
        class="kb-split__textarea"
        :value="source"
        spellcheck="false"
        @input="onInput"
      />
    </div>
  </div>
  <div class="kb-split__mobile-actions">
    <button type="button" :disabled="saving" @click="$emit('close')">取消</button>
    <button type="button" :disabled="saving" @click="$emit('save')">{{ saving ? '保存中…' : '保存' }}</button>
  </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue'

defineProps<{
  previewSrc: string
  source: string
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:source': [value: string]
  save: []
  close: []
}>()

const ratio = ref(50)
const mobilePane = ref<'preview' | 'source'>('source')
const rootRef = ref<HTMLElement | null>(null)
let dragging = false

function onInput(e: Event) {
  emit('update:source', (e.target as HTMLTextAreaElement).value)
}

function onDragStart(e: MouseEvent) {
  e.preventDefault()
  dragging = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!dragging || !rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const next = (x / rect.width) * 100
  ratio.value = Math.min(80, Math.max(20, next))
}

function onDragEnd() {
  dragging = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

onBeforeUnmount(() => {
  onDragEnd()
})
</script>

<style scoped lang="less">
.kb-split-wrap{height:100%;min-height:0;display:flex;flex-direction:column}.kb-split__mobile-tabs,.kb-split__mobile-actions{display:none}
.kb-split {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  background: #fff;

  &__preview,
  &__editor {
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  &__iframe {
    flex: 1;
    width: 100%;
    border: none;
    background: #fff;
  }

  &__divider {
    width: 5px;
    flex-shrink: 0;
    cursor: col-resize;
    background: #e6eaf2;
    transition: background 0.15s;

    &:hover {
      background: #3f7cff;
    }
  }

  &__editor {
    background: #1e1e1e;
    border-left: 1px solid #2a2a2a;
  }

  &__editor-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
  }

  &__editor-title {
    font-size: 12px;
    color: #9ca3af;
  }

  &__editor-actions {
    display: flex;
    gap: 12px;
  }

  &__textarea {
    flex: 1;
    width: 100%;
    border: none;
    outline: none;
    resize: none;
    padding: 12px 14px;
    background: #1e1e1e;
    color: #d4d4d4;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 13px;
    line-height: 1.55;
    tab-size: 2;
  }
}
@media (max-width: 1023px) {
  .kb-split__mobile-tabs,.kb-split__mobile-actions{display:flex;flex:none;gap:8px;padding:7px 10px;background:#fff;border-bottom:1px solid #e6eaf2}
  .kb-split__mobile-actions{justify-content:flex-end;border-top:1px solid #e6eaf2;border-bottom:0;padding-bottom:calc(7px + env(safe-area-inset-bottom))}
  .kb-split__mobile-tabs button,.kb-split__mobile-actions button{min-width:72px;min-height:44px;border:1px solid #dbe4f3;border-radius:8px;background:#fff;color:#315db1;font-weight:700}
  .kb-split__mobile-tabs button[aria-pressed='true']{background:#3276f6;color:#fff}
  .kb-split__divider{display:none}
  .kb-split__preview,.kb-split__editor{width:100% !important;min-width:0}
  .kb-split--preview .kb-split__editor,.kb-split--source .kb-split__preview{display:none}
  .kb-split__editor-bar{display:none}
  .kb-split__textarea{font-size:16px}
}

.action-btn {
  border: none;
  background: transparent;
  color: #93c5fd;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    color: #3f7cff;
  }
}
</style>

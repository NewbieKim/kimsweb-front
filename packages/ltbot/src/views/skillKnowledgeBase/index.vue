<template>
  <div class="kb-page">
    <aside class="kb-page__aside">
      <KbMenuTree
        :nodes="tree"
        :active-path="activePath"
        :loading="treeLoading"
        :error="treeError"
        @select="onSelect"
      />
    </aside>

    <section class="kb-page__main">
      <KbToolbar
        v-model:mode="mode"
        :active-path="activePath"
        :edit-locked="editLocked"
        @open-tab="openInNewTab"
        @download="downloadSource"
      />

      <div class="kb-page__body">
        <div v-if="!activePath" class="kb-page__empty">
          从左侧菜单选择一篇 HTML 文档开始预览
        </div>

        <div v-else-if="fileLoading" class="kb-page__empty">加载文档中…</div>
        <div v-else-if="fileError" class="kb-page__empty kb-page__empty--error">{{ fileError }}</div>

        <template v-else>
          <iframe
            v-if="mode === 'preview'"
            class="kb-page__iframe"
            :src="staticPreviewSrc"
            title="文档预览"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
          <KbSplitEditor
            v-else
            :preview-src="editPreviewSrc"
            :source="source"
            :saving="saving"
            @update:source="onSourceChange"
            @save="onSave"
            @close="onCloseEdit"
          />
        </template>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import KbMenuTree from './components/KbMenuTree.vue'
import KbToolbar from './components/KbToolbar.vue'
import KbSplitEditor from './components/KbSplitEditor.vue'
import type { KbTreeNode, KbViewMode } from './types'
import {
  fetchKbTree,
  fetchKbFile,
  saveKbFile,
  kbContentUrl,
  kbContentDirUrl
} from '@/api/skillKnowledgeBase'

/** 生产构建禁用在线编辑 */
const editLocked = process.env.NODE_ENV === 'production' ? true : false // 生产环境为 true：禁用编辑

const tree = ref<KbTreeNode[]>([])
const treeLoading = ref(false)
const treeError = ref('')

const activePath = ref('')
const mode = ref<KbViewMode>('preview')
const source = ref('')
const savedSource = ref('')
const fileLoading = ref(false)
const fileError = ref('')
const saving = ref(false)
const previewTick = ref(Date.now())

const blobUrl = ref('')
let blobDebounce: ReturnType<typeof setTimeout> | null = null

const dirty = computed(() => source.value !== savedSource.value)

const staticPreviewSrc = computed(() => {
  if (!activePath.value) return ''
  return kbContentUrl(activePath.value, previewTick.value)
})

const editPreviewSrc = computed(() => blobUrl.value || staticPreviewSrc.value)

function injectBase(html: string, baseHref: string): string {
  const baseTag = `<base href="${baseHref}">`
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n${baseTag}`)
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, (m) => `${m}<head>${baseTag}</head>`)
  }
  return `<!DOCTYPE html><html><head>${baseTag}</head><body>${html}</body></html>`
}

function revokeBlob() {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = ''
  }
}

function refreshEditBlob() {
  if (!activePath.value || mode.value !== 'edit') return
  revokeBlob()
  const withBase = injectBase(source.value, kbContentDirUrl(activePath.value))
  const blob = new Blob([withBase], { type: 'text/html;charset=utf-8' })
  blobUrl.value = URL.createObjectURL(blob)
}

function scheduleEditBlob() {
  if (blobDebounce) clearTimeout(blobDebounce)
  blobDebounce = setTimeout(() => {
    refreshEditBlob()
  }, 280)
}

async function loadTree() {
  treeLoading.value = true
  treeError.value = ''
  try {
    tree.value = await fetchKbTree()
  } catch (e) {
    treeError.value = e instanceof Error ? e.message : '加载目录失败'
    tree.value = []
  } finally {
    treeLoading.value = false
  }
}

async function loadFile(path: string) {
  fileLoading.value = true
  fileError.value = ''
  try {
    const data = await fetchKbFile(path)
    source.value = data.content
    savedSource.value = data.content
    previewTick.value = Date.now()
    if (mode.value === 'edit') {
      refreshEditBlob()
    }
  } catch (e) {
    fileError.value = e instanceof Error ? e.message : '加载文件失败'
    source.value = ''
    savedSource.value = ''
  } finally {
    fileLoading.value = false
  }
}

async function onSelect(path: string) {
  if (path === activePath.value) return
  if (mode.value === 'edit' && dirty.value) {
    const ok = window.confirm('当前有未保存的修改，切换文档将丢弃修改，是否继续？')
    if (!ok) return
  }
  activePath.value = path
  mode.value = 'preview'
  revokeBlob()
  await loadFile(path)
}

function onSourceChange(value: string) {
  source.value = value
  scheduleEditBlob()
}

async function onSave() {
  if (!activePath.value || editLocked) return
  saving.value = true
  try {
    await saveKbFile(activePath.value, source.value)
    savedSource.value = source.value
    previewTick.value = Date.now()
    revokeBlob()
    refreshEditBlob()
  } catch (e) {
    window.alert(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

function onCloseEdit() {
  if (dirty.value) {
    const ok = window.confirm('有未保存的修改，关闭将丢弃，是否继续？')
    if (!ok) return
    source.value = savedSource.value
  }
  revokeBlob()
  mode.value = 'preview'
  previewTick.value = Date.now()
}

function openInNewTab() {
  if (!activePath.value) return
  window.open(kbContentUrl(activePath.value, Date.now()), '_blank')
}

function downloadSource() {
  if (!activePath.value) return
  const name = activePath.value.split('/').pop() || 'document.html'
  const blob = new Blob([source.value || ''], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

watch(mode, async (next, prev) => {
  if (editLocked && next === 'edit') {
    mode.value = 'preview'
    return
  }
  if (next === 'edit' && activePath.value) {
    if (!source.value && !fileLoading.value) {
      await loadFile(activePath.value)
    }
    refreshEditBlob()
  }
  if (next === 'preview' && prev === 'edit') {
    revokeBlob()
    previewTick.value = Date.now()
  }
})

loadTree()

onBeforeUnmount(() => {
  if (blobDebounce) clearTimeout(blobDebounce)
  revokeBlob()
})
</script>

<style scoped lang="less">
.kb-page {
  --kb-bg: #f5f7fb;
  --kb-panel: #ffffff;
  --kb-line: #e6eaf2;
  --kb-text: #172033;
  --kb-muted: #667085;
  --kb-blue: #3f7cff;
  --kb-blue-soft: #ebf2ff;

  display: flex;
  width: 100%;
  height: calc(100vh - 64px);
  min-height: 480px;
  color: var(--kb-text);
  background: var(--kb-bg);
  overflow: hidden;
  text-align: left;

  &__aside {
    width: 280px;
    flex-shrink: 0;
    height: 100%;
  }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--kb-panel);
    border-left: 1px solid var(--kb-line);
  }

  &__body {
    flex: 1;
    min-height: 0;
    position: relative;
    background: var(--kb-panel);
  }

  &__iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: #fff;
  }

  &__empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--kb-muted);
    font-size: 14px;
    padding: 24px;
    text-align: center;

    &--error {
      color: #d97706;
    }
  }
}

@media (max-width: 768px) {
  .kb-page {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 64px);

    &__aside {
      width: 100%;
      height: 220px;
      border-bottom: 1px solid var(--kb-line);
    }

    &__body {
      min-height: 60vh;
    }
  }
}
</style>

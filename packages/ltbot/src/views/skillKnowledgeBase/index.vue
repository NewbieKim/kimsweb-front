<template>
  <div class="kb-page">
    <aside class="kb-page__aside">
      <KbMenuTree
        :nodes="tree"
        :active-path="activePath"
        :loading="treeLoading"
        :error="treeError"
        @select="onSelect"
        @retry="loadTree"
      />
    </aside>

    <section class="kb-page__main">
      <KbToolbar
        :mode="mode"
        :active-path="activePath"
        :edit-locked="editLocked"
        @open-tab="openInNewTab"
        @download="downloadSource"
        @update:mode="requestMode"
      />
      <button class="kb-page__select" type="button" aria-label="选文档" @click="openDocumentMenu">☰ 选文档</button>

      <div class="kb-page__body">
        <div v-if="!activePath" class="kb-page__empty">
          从左侧菜单选择一篇 HTML 文档开始预览
        </div>

        <div v-else-if="fileLoading" class="kb-page__empty">加载文档中…</div>
        <div v-else-if="fileError" class="kb-page__empty kb-page__empty--error">{{ fileError }} <button type="button" @click="loadFile(activePath)">重试</button></div>

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
    <div v-if="activeOverlay === 'knowledge'" class="kb-page__backdrop" @click="closeOverlay()">
      <aside class="kb-page__drawer" aria-label="选择文档" @click.stop>
        <div class="kb-page__drawer-head"><strong>选择文档</strong><button type="button" aria-label="关闭目录" @click="closeOverlay()">×</button></div>
        <KbMenuTree :nodes="tree" :active-path="activePath" :loading="treeLoading" :error="treeError" @select="onSelect" @retry="loadTree" />
      </aside>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { activeOverlay, closeOverlay, openOverlay } from '@/layout/mobileOverlay'
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
const editLocked = import.meta.env.PROD

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
  if (activeOverlay.value === 'knowledge') closeOverlay()
  mode.value = 'preview'
  revokeBlob()
  await loadFile(path)
}

function onSourceChange(value: string) {
  source.value = value
  scheduleEditBlob()
}

async function onSave() {
  if (!activePath.value || editLocked || saving.value) return
  saving.value = true
  const submittedSource = source.value
  try {
    await saveKbFile(activePath.value, submittedSource)
    savedSource.value = submittedSource
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

function requestMode(next: KbViewMode) {
  if (next === 'preview' && mode.value === 'edit') { onCloseEdit(); return }
  mode.value = next
}

function openDocumentMenu(event: MouseEvent) {
  openOverlay('knowledge', event.currentTarget as HTMLElement)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && activeOverlay.value === 'knowledge') closeOverlay()
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (mode.value !== 'edit' || !dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(() => {
  if (mode.value === 'edit' && dirty.value && !window.confirm('有未保存的修改，离开将丢弃，是否继续？')) return false
  if (activeOverlay.value === 'knowledge') closeOverlay(false)
})
window.addEventListener('beforeunload', onBeforeUnload)
onMounted(() => window.addEventListener('keydown', onKeydown))

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
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('keydown', onKeydown)
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
  height: calc(100dvh - var(--app-header-height));
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

  &__select { display: none; }

  &__backdrop { position: fixed; inset: 0; z-index: 9999; background: #12244288; }
  &__drawer { width: min(320px, 86vw); height: 100%; background: #fff; display: flex; flex-direction: column; padding-top: env(safe-area-inset-top); }
  &__drawer-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; }
  &__drawer-head button { width: 44px; height: 44px; border: 0; background: transparent; font-size: 26px; }

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

@media (max-width: 1023px) {
  .kb-page {
    flex-direction: column;
    height: calc(100dvh - var(--app-header-height));
    min-height: 0;

    &__aside {
      display: none;
    }
    &__select {
      display: block;
      text-align: left;
      min-height: 44px;
      border: 0;
      border-bottom: 1px solid var(--kb-line);
      background: #fff;
      padding: 0 14px;
      color: var(--kb-blue);
      font-weight: 700;
    }

    &__body {
      min-height: 0;
    }
  }
}
</style>

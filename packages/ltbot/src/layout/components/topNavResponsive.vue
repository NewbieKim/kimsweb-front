<template>
  <header class="top-nav">
    <div class="brand">
      <button class="menu-button" type="button" aria-label="打开菜单" :aria-expanded="activeOverlay === 'navigation'" @click="openMenu">☰</button>
      <span class="logo" aria-hidden="true">Aion</span>
      <RouterLink to="/workbench" class="brand-title">工作台</RouterLink>
    </div>
    <nav class="desktop-nav" aria-label="主导航">
      <RouterLink to="/workbench">工作台</RouterLink>
      <RouterLink to="/skillKnowledgeBase">技能知识库</RouterLink>
      <a href="https://space.ltbot.top" target="_blank" rel="noopener noreferrer" @click="externalNotice = true">睡眠空间 ↗</a>
      <RouterLink to="/user">关于我</RouterLink>
      <button v-if="showDeveloperDemo" type="button" @click="runDemo">Run Demo</button>
    </nav>
  </header>
  <div v-if="activeOverlay === 'navigation'" class="nav-backdrop" @click="closeOverlay()">
    <nav class="nav-drawer" aria-label="手机导航" @click.stop>
      <div class="drawer-header"><strong>导航</strong><button type="button" aria-label="关闭菜单" @click="closeOverlay()">×</button></div>
      <RouterLink to="/workbench" @click="closeOverlay(false)">工作台</RouterLink>
      <RouterLink to="/skillKnowledgeBase" @click="closeOverlay(false)">技能知识库</RouterLink>
      <a href="https://space.ltbot.top" target="_blank" rel="noopener noreferrer" @click="externalNotice = true; closeOverlay()">睡眠空间 ↗<small>外部网站</small></a>
      <RouterLink to="/user" @click="closeOverlay(false)">关于我</RouterLink>
    </nav>
  </div>
  <div v-if="externalNotice" class="external-notice" role="status">
    若新标签未打开，请<a href="https://space.ltbot.top" target="_blank" rel="noopener noreferrer">手动打开睡眠空间</a>。
    <button type="button" aria-label="关闭提示" @click="externalNotice = false">×</button>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { activeOverlay, closeOverlay, openOverlay } from '../mobileOverlay'

const showDeveloperDemo = import.meta.env.DEV && import.meta.env.VITE_SHOW_RUN_DEMO === 'true'
const externalNotice = ref(false)
const runDemo = async () => {
  if (!showDeveloperDemo) return
  const { main } = await import('@/hooks/mockAgent/ch19_sdlc_pipeline')
  await main()
}
function openMenu(event: MouseEvent) { openOverlay('navigation', event.currentTarget as HTMLElement) }
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && activeOverlay.value === 'navigation') closeOverlay()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.top-nav{position:fixed;inset:0 0 auto;height:var(--app-header-height);z-index:100;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 max(18px,env(safe-area-inset-right)) 0 max(18px,env(safe-area-inset-left));box-shadow:0 2px 8px #0001}
.brand,.desktop-nav{display:flex;align-items:center;gap:20px}.brand{gap:12px;min-width:0}.logo{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#2f6bff,#16a36f);color:#fff;font-size:12px;font-weight:800}.brand-title{font-size:17px;font-weight:700;white-space:nowrap;color:#344054}.desktop-nav{gap:22px}.desktop-nav a,.desktop-nav button{border:0;background:none;color:#475467;font-size:15px;font-weight:600;white-space:nowrap}.desktop-nav .router-link-active{color:#3276f6}.menu-button{display:none;width:44px;height:44px;border:1px solid #dbe4f3;border-radius:10px;background:#fff;color:#344054;font-size:20px}
.nav-backdrop{position:fixed;inset:0;z-index:9999;background:#12244288}.nav-drawer{height:100%;width:min(290px,86vw);background:#fff;padding:calc(14px + env(safe-area-inset-top)) 14px 14px;display:flex;flex-direction:column;gap:4px;box-shadow:10px 0 30px #10284c33}.drawer-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.drawer-header button{width:44px;height:44px;border:0;background:none;font-size:26px}.nav-drawer>a{display:flex;align-items:center;justify-content:space-between;min-height:46px;padding:11px;border-radius:9px;color:#40516e}.nav-drawer>a.router-link-active{background:#edf4ff;color:#2266ce;font-weight:700}.nav-drawer small{font-size:11px;color:#8b6a2b}
.external-notice{position:fixed;z-index:1000;top:var(--app-header-height);right:12px;left:12px;max-width:430px;margin-left:auto;padding:10px 12px;border-radius:0 0 10px 10px;background:#fff8e9;box-shadow:0 8px 20px #0002;font-size:13px}.external-notice a{margin-left:4px}.external-notice button{float:right;width:28px;height:28px;border:0;background:none;font-size:20px}
@media(max-width:1023px){.top-nav{padding:0 max(12px,env(safe-area-inset-right)) 0 max(12px,env(safe-area-inset-left))}.desktop-nav{display:none}.menu-button{display:grid;place-items:center}}
</style>

import { ref, watch } from 'vue'

export type OverlayName = 'navigation' | 'chat' | 'knowledge' | null
export const activeOverlay = ref<OverlayName>(null)

let returnFocus: HTMLElement | null = null
let previousOverflow = ''

export function openOverlay(name: Exclude<OverlayName, null>, trigger?: HTMLElement | null) {
  if (trigger) returnFocus = trigger
  activeOverlay.value = name
}

export function closeOverlay(restoreFocus = true) {
  activeOverlay.value = null
  const target = returnFocus
  returnFocus = null
  if (restoreFocus) {
    const focusTrigger = () => {
      if (activeOverlay.value) return
      if (target?.isConnected) target.focus()
      else document.querySelector<HTMLElement>('.ai-float-button')?.focus()
    }
    requestAnimationFrame(focusTrigger)
    // Vue's leave transition keeps the closing panel in the DOM for 300 ms.
    // Restore focus again after it leaves if focus is still on a hidden control.
    window.setTimeout(() => {
      if (document.activeElement?.closest('.ai-sidebar, .kb-page__drawer, .nav-drawer')) focusTrigger()
    }, 350)
  }
}

watch(activeOverlay, (name, oldName) => {
  if (typeof document === 'undefined') return
  if (name && !oldName) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else if (!name && oldName) {
    document.body.style.overflow = previousOverflow
  }
})

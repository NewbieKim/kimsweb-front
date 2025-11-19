<template>
  <div class="create-space-container">
    <iframe v-if="openUrl" ref="windowPageIframe" :src="openUrl" style="width: 100%;height: 100%;border: none;" @load="adjustIframeHeight"></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const openUrl = ref('http://localhost:3060/')
const windowPageIframe = ref<HTMLIFrameElement | null>(null)

const adjustIframeHeight = () => {
    const iframe = windowPageIframe.value
    if (iframe) {
        const pageHeight = document.documentElement.scrollHeight || document.body.scrollHeight
        iframe.style.height = pageHeight-50 + 'px'
    }
}
</script>

<style scoped lang="scss">
.create-space-container {
  width: 100vw;
  height: 100vh;
}
</style>
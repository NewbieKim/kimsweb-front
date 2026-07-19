<script setup lang="ts">
import { RemoteProvider } from '@ain-framework/remote-chat-sdk'
import { startRemoteMcp } from './remote/webMcp'

const remoteToolClient = startRemoteMcp()
const remoteApiBaseUrl = import.meta.env.VITE_REMOTE_API_BASE_URL ?? ''

function getPageContext() {
  return {
    pageKey: window.location.pathname || 'ltbot',
    pageTitle: document.title || 'LTBOT',
    path: window.location.pathname,
    routeName: window.location.hash.replace(/^#/, ''),
  }
}
</script>

<template>
  <RemoteProvider
    :api-base-url="remoteApiBaseUrl"
    :tool-client="remoteToolClient"
    :page-context-provider="getPageContext"
  >
    <router-view></router-view>
  </RemoteProvider>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>

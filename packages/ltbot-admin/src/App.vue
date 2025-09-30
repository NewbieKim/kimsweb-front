<template>
  <tiny-config-provider :design="design">
    <router-view />
  </tiny-config-provider>
  <tiny-remoter session-id="5f8edea7-e3ae-4852-a334-1bb6b3a1cfa9" />
</template>
<script setup>
import { TinyConfigProvider } from '@opentiny/vue';
import { onMounted, provide } from 'vue'
import { WebMcpClient, createMessageChannelPairTransport } from '@opentiny/next-sdk'
import { TinyRemoter } from '@opentiny/next-remoter'
import '@opentiny/next-remoter/dist/style.css'
const design = {
  name: 'x-design', // 设计规范名称
  version: '1.0.0', // 设计规范版本号
  components: {
    Button: {
      props: {
        resetTime: 0,
        round: true,
      },
    },
  },
};
const [serverTransport, clientTransport] = createMessageChannelPairTransport()
provide('serverTransport', serverTransport)
const client = new WebMcpClient()

onMounted(async () => {
  await client.connect(clientTransport)
  const { sessionId } = await client.connect({
    agent: true,
    url: 'https://agent.opentiny.design/api/v1/webmcp-trial/mcp',
    sessionId: '5f8edea7-e3ae-4852-a334-1bb6b3a1cfa9'
  })
  console.log('sessionId:', sessionId)
})
</script>
<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100%;
}
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-corner {
  background: transparent;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

::-webkit-scrollbar-thumb:active {
  background: #aaa;
}
</style>

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const apiProxyTarget = 'http://localhost:3100' // 'https://space.ltbot.top';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    hmr: {
      overlay: true
    },
    port: 3060,
    open: true,
    host: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: true,
      },
    }
  }
});

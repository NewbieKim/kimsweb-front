import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createSvg } from './src/svg/index.ts'
const plugins:any = [];
// 打包生产环境才引入的插件
// process.env.NODE_ENV === "production"
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    createSvg('./src/svg/svg/'),
    ...plugins
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { createSvg } from './src/svg/index.ts'
const plugins:any = [];
// 打包生产环境才引入的插件
// process.env.NODE_ENV === "production"
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量 - 使用 __dirname 确保从当前目录加载
  // const env = loadEnv(mode, __dirname, '')
  
  return {
    plugins: [
      vue(),
      createSvg('./src/svg/svg/'),
      ...plugins
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      hmr: {
        overlay: true
      },
      port: 6688,
      open: true,
      host: true,
      proxy: {
        '/api': 'http://localhost:3000',
        '/wecagw': 'https://wecagw.qhhrly.cn' // 第三方接口代理
      }
    },
  }
})
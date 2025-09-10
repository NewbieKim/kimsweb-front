/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// TypeScript 声明文件，它的主要作用是为 Vite 项目提供类型声明和环境配置
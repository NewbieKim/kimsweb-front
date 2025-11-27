# LtBot Space - React 练手项目

一个完整的 React 全家桶示例项目，用于学习和练习 React 相关技术。

## 🚀 技术栈

- **React 18** - 最新版本的 React
- **TypeScript** - 类型安全
- **Redux Toolkit** - 状态管理
- **React Router DOM** - 路由管理
- **React Canvas Draw** - 画板功能
- **Vite** - 快速构建工具

## 📦 安装依赖

在项目根目录下执行：

```bash
# 安装所有依赖
pnpm install
```

## 🎯 启动项目

### 开发模式

```bash
# 方式1：在根目录执行
pnpm dev:space

# 方式2：进入项目目录
cd packages/ltbot-space
pnpm dev
```

项目会在 `http://localhost:5173` 启动

### 构建生产版本

```bash
# 在根目录执行
pnpm build:space

# 或在项目目录执行
cd packages/ltbot-space
pnpm build
```

### 预览生产版本

```bash
# 在根目录执行
pnpm preview:space

# 或在项目目录执行
cd packages/ltbot-space
pnpm preview
```

## 📖 项目结构

```
ltbot-space/
├── src/
│   ├── pages/              # 页面组件
│   │   ├── Home/          # 首页
│   │   ├── Counter/       # 计数器页面（Redux Demo）
│   │   ├── Canvas/        # 画板页面
│   │   └── NotFound/      # 404页面
│   ├── store/             # Redux 状态管理
│   │   ├── slices/        # Redux Slices
│   │   │   ├── counterSlice.ts
│   │   │   └── userSlice.ts
│   │   ├── hooks.ts       # Redux Hooks
│   │   └── index.ts       # Store 配置
│   ├── router/            # 路由配置
│   │   └── index.tsx
│   ├── App.tsx            # 根组件
│   ├── App.css            # 根组件样式
│   ├── main.tsx           # 入口文件
│   └── index.css          # 全局样式
├── index.html             # HTML 模板
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── package.json           # 依赖配置
```

## 🎨 功能特性

### 1. 首页（Home）
- 用户登录演示
- Redux 状态管理展示
- 技术栈介绍
- 响应式设计

### 2. 计数器（Counter）
- Redux Toolkit 完整示例
- 同步 action 演示
- 自定义增量功能
- TypeScript 类型安全

### 3. 画板（Canvas）
- 自由绘画功能
- 画笔颜色选择
- 画笔粗细调节
- 笔触平滑度控制
- 撤销功能
- 导出 JSON 数据
- 导出 PNG 图片

## 🔧 核心技术点

### Redux Toolkit 使用

```typescript
// 1. 创建 Slice
export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
  },
})

// 2. 使用自定义 Hooks
import { useAppDispatch, useAppSelector } from '@/store/hooks'

const count = useAppSelector(selectCount)
const dispatch = useAppDispatch()
dispatch(increment())
```

### React Router DOM v6

```typescript
// 创建路由
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'counter', element: <Counter /> },
    ],
  },
])

// 使用路由
<RouterProvider router={router} />
```

### React Canvas Draw

```typescript
import CanvasDraw from 'react-canvas-draw'

<CanvasDraw
  ref={canvasRef}
  brushColor="#444"
  brushRadius={4}
  canvasWidth={800}
  canvasHeight={500}
/>
```

## 📝 学习要点

### React 基础
- ✅ 函数组件
- ✅ Hooks (useState, useEffect, useRef)
- ✅ 组件通信
- ✅ 条件渲染
- ✅ 列表渲染

### Redux 状态管理
- ✅ Redux Toolkit
- ✅ Slice 创建
- ✅ Action 和 Reducer
- ✅ Selector
- ✅ TypeScript 类型定义

### React Router
- ✅ 嵌套路由
- ✅ 导航链接
- ✅ 404 处理
- ✅ Outlet 使用

### TypeScript
- ✅ 类型定义
- ✅ 接口（Interface）
- ✅ 泛型
- ✅ 类型推断

### CSS 样式
- ✅ 模块化 CSS
- ✅ 响应式设计
- ✅ Flexbox 布局
- ✅ CSS 动画

## 🎓 适合人群

- React 初学者
- 想学习 Redux Toolkit 的开发者
- 准备面试需要项目经验的同学
- 想了解 React 全家桶的前端工程师

## 📚 学习路径

1. **第一步**：熟悉项目结构，理解组件组织方式
2. **第二步**：学习 Redux Toolkit 的使用（Counter 页面）
3. **第三步**：掌握 React Router 的路由配置
4. **第四步**：练习 Hooks 的使用（Canvas 页面）
5. **第五步**：尝试添加新功能，自己实践

## 🔥 可扩展功能

- [ ] 添加用户认证系统
- [ ] 集成 Axios 进行 API 调用
- [ ] 添加表单验证
- [ ] 实现深色模式切换
- [ ] 添加国际化（i18n）
- [ ] 集成 CSS-in-JS 库（styled-components）
- [ ] 添加单元测试
- [ ] 实现懒加载和代码分割

## 📄 许可证

MIT License

## 👨‍💻 作者

Kim - React 学习者

---

**Happy Coding! 🎉**


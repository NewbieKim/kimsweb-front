# Next.js Learning Project

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features Implemented

- Dynamic routing with user pages
- Server-side rendering (SSR) examples
- Client and server components
- Data fetching strategies
- API routes
- Prisma integration with PostgreSQL
- Component demos

## Getting Started

## 技术栈

- React 18
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (ORM)
- SQLite (开发数据库)

## 项目结构

```
nextjs-learning/
├── src/
│   ├── app/                 # App Router 目录
│   │   ├── api/             # API 路由
│   │   ├── components/      # 组件
│   │   └── ...              # 页面路由
│   └── lib/                 # 工具库
├── prisma/                  # Prisma 数据库模式和迁移
├── public/                  # 静态资源
├── ...                      # 配置文件
```

## 核心功能演示

### 1. 路由系统
- **静态路由**: `/about`
- **动态路由**: `/users/[id]`
- **嵌套路由**: 所有页面都在 `src/app` 目录下组织

### 2. 渲染策略
- **静态生成 (SSG)**: About 页面在构建时预渲染
- **服务器端渲染 (SSR)**: 用户详情页在每次请求时渲染
- **客户端渲染 (CSR)**: 交互式组件在浏览器中渲染

### 3. 组件类型
- **服务器组件**: 默认类型，在服务器上执行
- **客户端组件**: 使用 `'use client'` 指令，在浏览器中执行

### 4. 数据获取
- **SSR 数据获取**: 在页面组件中使用 async/await
- **API 路由**: 创建 RESTful API 端点
- **数据库集成**: 使用 Prisma ORM 与 SQLite 数据库交互

### 5. API 路由
- **GET /api/users**: 获取用户列表
- **POST /api/users**: 创建新用户
- **GET /api/users-prisma**: 使用 Prisma 获取用户
- **POST /api/users-prisma**: 使用 Prisma 创建用户

## 运行项目

1. 安装依赖:
   ```bash
   npm install
   ```

2. 启动开发服务器:
   ```bash
   npm run dev
   ```

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

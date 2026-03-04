# kimsweb-front 项目文档

---

## 项目概览

**项目名称**：kimsweb-front — LTBot AI 技术进阶平台  
**项目类型**：全栈 Monorepo 前端工程（pnpm workspace）  
**核心定位**：集 AI 聊天助手、内容创作、电商管理、跨端应用于一体的综合性技术实践平台  
**项目地址**：`http://ltbot.top`

采用 **pnpm workspace** 管理 7 个功能独立的子包，覆盖 Vue 3、React/Next.js、uni-app、Node.js 后端、MCP 工具服务等多技术栈，充分展现全栈工程师的技术深度与广度。

---

## 工程目录总览

```
kimsweb-front/
├── packages/
│   ├── ltbot/          # 主前端应用（Vue 3 + AI 聊天机器人）
│   ├── ltbot-admin/    # 后台管理系统（Vue 3 + ECharts）
│   ├── ltbot-nextapp/  # AI 睡眠故事全栈应用（Next.js 16）
│   ├── ltbot-server/   # 后端 REST API 服务（Express 5 + Redis）
│   ├── ltbot-space/    # React 技术练习空间（Redux Toolkit）
│   ├── ltbot-uniapp/   # 跨端电商 App（uni-app X）
│   └── doc-mcp/        # 飞书文档 MCP 工具服务（AI IDE 集成）
└── package.json        # Monorepo 根配置
```

---

## 一、ltbot — 主前端应用（AI 聊天工作台）

### 项目简介

基于 Vue 3 的 AI 工作台应用，核心为集成 DeepSeek 大模型的智能聊天机器人，支持多轮对话、SSE 流式输出、推理链可视化展示。同时集成了博客系统、待办事项管理（MCP 工具驱动）、个人AI作品展示栏等完整功能模块。
<img width="1897" height="915" alt="image" src="https://github.com/user-attachments/assets/8f605bd0-2d91-4e6a-ac96-012359e073b0" />
<img width="1178" height="908" alt="image" src="https://github.com/user-attachments/assets/50a42cf3-b905-49ac-bbc1-c53d12aec96d" />
<img width="1893" height="897" alt="image" src="https://github.com/user-attachments/assets/c6001b39-2242-4925-ae91-de2b3cc050c3" />
<img width="1888" height="897" alt="image" src="https://github.com/user-attachments/assets/ca7c3f50-0868-4312-90f4-4a0b471d062f" />

### 技术栈

| 分类 | 技术选型 |
|------|---------|
| 核心框架 | Vue 3.5 + TypeScript + Composition API |
| 构建工具 | Vite 5（自定义 SVG 插件 + API 代理） |
| 状态管理 | Pinia 3（模块化 Store：user/chat/menus/app/agency/tags） |
| 路由 | Vue Router 4（Hash 模式 + 路由守卫 + 模块化路由） |
| UI 框架 | TDesign Vue Next 1.17 + TDesign Chat |
| 样式方案 | Tailwind CSS 4 + Less + Sass |
| AI 集成 | DeepSeek API（SSE 流式） + MCP SDK |
| 编辑器 | md-editor-v3（Markdown 富文本编辑） |
| 3D 渲染 | Three.js |
| 数据校验 | Zod |

### 项目亮点

**1. 浏览器端 MCP（Model Context Protocol）工具系统**  
基于 `@modelcontextprotocol/sdk` 在浏览器端实现 MCP 协议，注册了 `add_todo`、`query_todos`、`update_todo_status` 三个 AI 工具。LLM 可自主决策调用这些工具操作数据库，实现了 AI Agent 级别的任务自动化能力，而无需后端中转。

**2. 流式对话 + 推理链可视化**  
ChatBot 核心组件（`ChatBot/index.vue`，1044 行）从零实现 SSE 流式接收、逐字渲染、推理思考过程独立展示，提升用户对 AI 响应过程的感知体验。

**3. 自定义 Vite SVG 插件**  
自主开发 Vite 构建插件，将项目 SVG 文件自动注入为 `<symbol>` 图标系统，支持按需使用，减少 HTTP 请求并保持图标可样式化。

**4. 模块化权限路由体系**  
路由按业务模块拆分（user/blog/workbench/system/aiWorks/createSpace），结合角色枚举（`roleEnum`）和自定义 `usePermission` Hook，实现动态菜单与按钮级别权限控制。

**5. 流体动画 UI**  
使用 Three.js + CSS 实现 `GooeyNav` 流体导航动画效果，结合 `DynamicCard`、`AISidebar` 等动态组件，打造现代化视觉体验。

**6. 多平台聚合搜索工作台**  
在工作台页面封装 `SearchBox` 组件，通过 Tab 分组将常用平台分为四大类：
- **搜索**：Bing / 百度 / Google
- **技术社区**：GitHub / 掘金 / 知乎 / Hugging Face / 飞桨 / 魔搭
- **生活购物**：京东 / 淘宝 / 小红书
- **站内文章**：站内全文检索

输入关键词后点击任意平台图标，自动将关键词拼接为对应平台的搜索 URL 并在新标签页打开，一键跳转精准搜索；无关键词时则直接打开平台首页。彻底替代逐个打开网站再手动输入的繁琐操作，显著提升日常开发检索效率。

**7. Markdown 博客编辑与发布系统**  
基于 `md-editor-v3` 构建完整的文章创作与管理闭环：
- **文章列表页**（`blog/index.vue`）：支持按分类 Tab 筛选（前端 / 后端 / 架构 / 运维 / AI），展示浏览量、点赞数统计及最多 3 个标签，草稿文章以 Badge 标注状态区分
- **在线编辑器**（`blog/editor.vue`）：集成 Markdown 实时预览、代码行号、自定义工具栏，支持 `Ctrl+S` 快捷暂存草稿
- **发布流程**：点击「发布文章」弹出发布弹窗，填写文章分类与标签（最多 3 个）后一键发布，文章状态流转 `draft → published`，并持久化至后端 API

---

## 二、ltbot-admin — 后台管理系统

### 项目简介

商品及运营数据的后台管理系统，提供商品 CRUD、上下架管理、数据统计大盘（ECharts 实时图表）等功能，采用企业级 UI 组件库 OpenTiny（华为开源）构建。

### 技术栈

| 分类 | 技术选型 |
|------|---------|
| 核心框架 | Vue 3.4 + TypeScript |
| 构建工具 | Vite 5 |
| 状态管理 | Pinia 2 |
| 路由 | Vue Router 4（History 模式 + 路由守卫） |
| UI 框架 | OpenTiny Vue 3.23（华为开源企业级组件库） |
| 数据可视化 | ECharts 5 |
| 样式 | Less |

### 项目亮点

**1. 实时数据看板**  
Dashboard 页面集成在线用户趋势、网络流量趋势 ECharts 折线图，每 30 秒自动轮询刷新统计数据，实现近实时业务监控。

**2. 全生命周期商品管理**  
商品管理模块完整实现新增、编辑、删除、上架/下架操作流，数据通过 Pinia Store 与后端 API 双向同步，涵盖状态管理最佳实践。

**3. 跨组件库技术选型实践**  
在同一 Monorepo 中主动选用不同 UI 组件库（主应用 TDesign vs. 管理端 OpenTiny），展示对多套企业级组件库的掌握能力。

---

## 三、ltbot-nextapp — AI 睡眠故事全栈平台

### 项目简介

"AI 睡眠空间" — 一款面向儿童的 AI 驱动睡前故事与音乐创作平台。用户通过选择年龄段、故事主题、人物设定触发异步 AI 内容生成；平台提供完整的积分体系、点赞/收藏/评论社交功能，以及基于 Clerk 的 OAuth 用户认证。
<img width="377" height="823" alt="image" src="https://github.com/user-attachments/assets/86706c45-ee4d-4fab-88e6-c4a97bdd334b" />
<img width="377" height="820" alt="image" src="https://github.com/user-attachments/assets/3ddd209d-130a-4d82-b955-6430b409aa7b" />
<img width="377" height="826" alt="image" src="https://github.com/user-attachments/assets/3a3a6d2a-0d69-4603-8f97-e7dba6ddb2a2" />
<img width="380" height="823" alt="image" src="https://github.com/user-attachments/assets/f1172cd0-5ee7-4651-b0ff-6b81e807ce74" />



### 技术栈

| 分类 | 技术选型 |
|------|---------|
| 核心框架 | Next.js 16 + React 19 + TypeScript |
| 认证系统 | Clerk（OAuth 第三方认证 + Webhook 用户同步 + 中文本地化） |
| 数据库 ORM | Prisma 6（含积分模型 userScore） |
| 状态管理 | Zustand 5 |
| UI 框架 | HeroUI（Button/Card/Input/Modal/Navbar/Radio） |
| 样式 | Tailwind CSS 4 |
| Webhook 验证 | Svix（Clerk 事件签名验证） |
| HTTP | Axios |
| 日期处理 | date-fns |

### 项目亮点

**1. 全栈 Next.js App Router 架构**  
全面采用 Next.js 15 App Router，Server Component + Client Component 混合渲染，API Route Handler 实现 BFF（Backend For Frontend）层，结合 Prisma 直连数据库，无需独立后端服务。

**2. AI 异步生成架构（Fire-and-Forget）**  
`/api/stories/generate-async` 接口采用非阻塞异步生成模式：用户提交请求立即返回，AI 内容生成在后台完成后更新数据库。避免长时间请求阻塞，提升用户体验。

**3. Clerk + Prisma 用户双向同步**  
通过 Clerk Webhook（Svix 验签）监听用户注册/更新事件，自动同步至 Prisma 数据库，实现认证系统与业务数据库的解耦与一致性保障。封装 `UserSyncProvider` + `useUserSync` Hook，确保客户端状态与服务端同步。

**4. 积分消费体系**  
完整实现积分充值（`/api/scores/recharge`）、消费（`/api/scores/consume`，生成故事消耗 10 积分）、查询三个维度，采用 Prisma 事务保障数据一致性。

**5. 完整社交互动功能**  
独立封装 `StoryLikeButton`、`StoryFavoriteButton`、`StoryCommentSection` 组件，分别对应点赞、收藏、评论三大社交能力，数据通过 Next.js Route Handler 持久化至 Prisma。

**6. Clerk 中文本地化定制**  
通过 `clerkLocalization.ts` 对 Clerk 内置 UI 进行中文本地化改造，降低中文用户的认知门槛。

**7. Docker 三阶段构建 + 容器化生产部署**  
基于 Docker 多阶段构建（Multi-stage Build）实现镜像体积极致优化：

- **第一阶段（deps）**：`node:22-alpine` 基础镜像安装 pnpm 依赖 + 执行 `prisma generate` 生成 ORM 客户端
- **第二阶段（builder）**：复用 deps 阶段产物执行 `next build`，生产构建与依赖安装完全隔离
- **第三阶段（runner）**：仅复制 `.next/standalone` 最小产物 + 静态资源，最终镜像不含源码与全量 `node_modules`，镜像体积大幅压缩

配合 `.dockerignore` 精准排除 `node_modules`、`.next`、测试文件、文档等无关内容，加速镜像构建上下文传输。

**8. Docker Compose 编排 + 健康检查**  
通过 `docker-compose.yml` 编排应用服务，关键配置包括：
- **容器重启策略**：`restart: always`，异常退出自动重启保障高可用
- **数据持久化**：通过 Volume 挂载 `./data:/app/data`，SQLite 数据库文件持久化至宿主机，容器销毁重建不丢数据
- **内置健康检查**：每 30 秒通过 Node.js HTTP 请求探测 `/api/health`，超过 3 次失败标记为不健康，`start_period: 40s` 避免启动期误判
- **网络隔离**：自定义 `ltbot-network` Bridge 网络，为后续多容器扩展预留接入点
- **环境变量注入**：敏感配置（Clerk Key 等）通过 Shell 环境变量动态注入，不固化在镜像内

**9. 自动化运维部署脚本（deploy.sh）**  
编写 Shell 运维脚本（v1.0.0），提供交互式菜单驱动的完整运维能力：
- **首次部署**：自动校验前置依赖（docker/git）、环境变量文件检查、目录初始化、镜像构建、容器启动、Prisma 数据库迁移一键串联
- **更新部署**：`git pull` 拉取最新代码 → 数据库备份 → 停容器 → 重建镜像 → 启动 → 自动执行 `prisma migrate deploy`，确保 Schema 变更随版本同步
- **数据库备份与恢复**：按时间戳命名 `.db.gz` 压缩备份，自动清理 7 天前历史备份，支持交互式选择备份文件恢复，操作前二次确认防误操作
- **容器安全加固**：runner 阶段创建非 root 系统用户（`nextjs:nodejs`），以最小权限原则运行 Node.js 进程，降低容器逃逸风险

---

## 四、ltbot-server — 后端 REST API 服务

### 项目简介

基于 Express 5 + TypeScript 的 Node.js 后端服务，为主前端（ltbot）和后台管理（ltbot-admin）提供统一 API，使用 Redis 存储聊天会话数据，JSON 文件实现商品数据持久化。

### 技术栈

| 分类 | 技术选型 |
|------|---------|
| 核心框架 | Express 5 + TypeScript |
| 数据库 | Redis（`redis` + `redis-om`，30 天 TTL） |
| 开发工具 | esno（热重载开发） |
| 构建 | esbuild（生产构建，支持跳过 TS 错误） |
| 运行端口 | 3000 |

### 项目亮点

**1. Redis 多数据结构聊天存储设计**  
精心设计 Redis 数据结构：
- `ZSET`（按时间戳排序）存储用户会话列表，支持高效分页
- `Hash` 存储会话元数据（标题、创建时间、消息数量）
- `List` 存储会话消息序列

统一设置 30 天 TTL 自动过期，兼顾存储效率与数据持久性。

**2. 完整的会话生命周期管理**  
实现会话创建、消息追加、会话重命名、单条删除、批量删除全套 API，满足聊天应用的完整交互需求。

**3. Express 5 Beta 先行实践**  
采用最新 Express 5 版本，体验原生异步路由错误处理改进，提前积累下一代 Express 开发经验。

---

## 五、ltbot-space — React 技术练习空间

### 项目简介

React 生态技术栈系统性学习与练习项目，涵盖 Redux Toolkit 状态管理、React Router 6、Canvas 画布绘图、自定义表单组件封装等核心实践。

### 技术栈

| 分类 | 技术选型 |
|------|---------|
| 核心框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| 状态管理 | Redux Toolkit + React-Redux |
| 路由 | React Router DOM 6 |
| 画布 | react-canvas-draw |
| HTTP | Axios |

### 项目亮点

**1. Redux Toolkit 现代化实践**  
采用 RTK 的 Slice 模式（counterSlice + userSlice），封装类型安全的 `useAppDispatch`/`useAppSelector` Hook，实践 Redux 最佳实践并对比 Pinia 的异同。

**2. 自定义表单组件体系**  
从零封装 `Input`、`FormItem`、`Form` 组件，实践 React 受控组件、Context 传递、Props 类型设计等核心技能。

---

## 六、ltbot-uniapp — 跨端电商 App

### 项目简介

基于 uni-app X 新一代跨端框架开发的电商应用，支持商品展示、购物车管理、二维码弹窗等功能，采用 UTS（Universal TypeScript）语言实现跨 Android/iOS/Web 的原生性能。

### 技术栈

| 分类 | 技术选型 |
|------|---------|
| 核心框架 | uni-app X + Vue 3 + UTS |
| 跨端目标 | Android / iOS / Web |
| 状态管理 | 自定义全局 Store（UTS 实现） |
| UI 组件 | OpenTiny Next |
| AI 集成 | @modelcontextprotocol/sdk |
| 功能库 | qrcode 1.5.1 |

### 项目亮点

**1. uni-app X 新范式实践**  
采用 uni-app X 最新架构，使用 `.uvue` 和 `.uts` 文件后缀，UTS 语言编译为各端原生代码（Kotlin/Swift/JavaScript），相比传统 uni-app 性能大幅提升，体现对新技术的快速跟进能力。

**2. 跨端原生能力调用**  
通过 `uni.openDialogPage` 实现原生弹窗交互，利用 qrcode 库动态生成二维码，展示 uni-app 的跨端原生 API 调用能力。

**3. 响应式购物车状态管理**  
在 UTS 环境下自主实现响应式全局 Store（`store.uts`），管理商品数据与购物车逻辑，实时更新购物车角标（红点徽标），不依赖第三方状态库。

---

## 七、doc-mcp — 飞书文档 MCP 工具服务

### 项目简介

为 AI IDE（Cursor、Claude Desktop 等）提供飞书知识库访问能力的 MCP（Model Context Protocol）服务端实现。AI 助手可通过标准 MCP 协议调用该服务，直接检索和读取飞书知识空间内容，实现 AI 辅助文档驱动开发。

### 技术栈

| 分类 | 技术选型 |
|------|---------|
| 运行时 | Node.js ESM + TypeScript |
| 开发工具 | tsx（热重载） |
| MCP SDK | @modelcontextprotocol/sdk 1.8 |
| HTTP 服务 | Express 5 |
| 飞书 API | 飞书开放平台 Wiki V2 API |
| 数据校验 | Zod |
| 配置 | dotenv |

### 项目亮点

**1. MCP 双模式传输架构**  
同时支持两种 MCP 传输模式：
- **Stdio 模式**：标准输入输出传输，供 Cursor/Claude Desktop 本地直接调用
- **HTTP/SSE 模式**：监听端口 7777，通过 SSE 长连接 + POST 消息端点提供网络 MCP 服务

一套代码适配所有主流 AI IDE 的接入方式，体现对 MCP 协议规范的深度理解。

**2. 飞书 Token 自动续期机制**  
`FeishuClient` 类实现 `tenant_access_token` 智能缓存策略：本地缓存 Token，在过期前 5 分钟自动触发续期请求，对上层调用方完全透明，保障 API 调用的高可用性。

**3. 前沿 AI 工具链实践**  
MCP（Model Context Protocol）是 Anthropic 主导的 AI 工具调用标准协议，代表 AI Agent 开发的最新范式。本项目通过自主实现 MCP Server，深度参与 AI 工具生态建设，体现对 AI 工程化前沿技术的持续关注与实践能力。

---

## 核心技术能力总结

### 全栈技术覆盖

| 技术方向 | 掌握情况 |
|---------|---------|
| **Vue 3 生态** | Vue 3 Composition API、Pinia、Vue Router、Vite、TDesign、OpenTiny |
| **React 生态** | React 18/19、Next.js 16 App Router、Redux Toolkit、Zustand、React Router 6 |
| **跨端开发** | uni-app X（UTS）、支持 Android/iOS/Web 多端编译 |
| **Node.js 后端** | Express 5、Redis 数据结构设计、Prisma ORM、RESTful API 设计 |
| **AI 工程化** | DeepSeek API 集成、SSE 流式处理、MCP 协议实现（Client + Server）|
| **工程化** | pnpm Monorepo、Vite 自定义插件开发、esbuild 构建优化 |
| **认证体系** | Clerk OAuth、Webhook 事件处理、Svix 签名验证 |
| **数据可视化** | ECharts 5、Three.js 3D 渲染 |

### 架构设计能力

- **Monorepo 工程架构**：设计并维护 7 个子包的 pnpm workspace，合理划分职责边界，统一工程化标准
- **AI Agent 架构**：在浏览器端实现 MCP Client，在服务端实现 MCP Server，具备完整的 AI 工具调用链路设计能力
- **全栈数据流设计**：Next.js BFF 层 → Prisma → PostgreSQL，Vue + Pinia → Express → Redis，两套完整的前后端数据流设计经验
- **异步生成架构**：Fire-and-Forget 模式的 AI 内容异步生成，解决 LLM 长时响应的用户体验问题

---

*文档生成时间：2026-03-02*

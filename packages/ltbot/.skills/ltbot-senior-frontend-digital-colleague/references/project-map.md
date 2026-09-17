# ltbot 代码地图

> 基于 2026-09-16 的 `packages/ltbot` 源码整理。这里记录可从代码确认的现状；页面文案、旧报告和演示代码不能单独证明功能已上线。改动前仍需核对目标文件与运行结果。

## 项目定位与边界

`ltbot` 是 `kimsweb-front` pnpm monorepo 中的 Vue 单页前端，界面品牌出现 **Aion / lt-bot**。它目前呈现个人 AI 效率工作台：聚合搜索和工具入口、待办、AI 对话、博客、AI 艺术廊、HTML 技能知识库及个人介绍。产品面向需要整理任务、查找资料、使用 AI 辅助办公与开发的用户；代码中没有足够证据证明具体用户规模或商业模式。

本包是前端。`ltbot-server`、`ltbot-nextapp`、`ltbot-space`、`ltbot-admin`、`doc-mcp` 是兄弟包，只有在用户明确要求跨包联动时才把它们纳入修改范围。顶部“睡眠空间”打开外站 `space.ltbot.top`，本包的 `/createSpace` 页面也嵌入该站；这并不表示本包实现了 nextapp 的睡前故事业务。

## 技术与运行

| 项目 | 源码依据与现状 |
| --- | --- |
| 框架 | Vue 3、TypeScript、Vite 5、Vue Router 4、Pinia 3；入口 `src/main.ts`，根组件 `src/App.vue`。 |
| 界面 | TDesign Vue Next / Chat、Tailwind 4、SCSS、Less、`md-editor-v3`、Three.js；同时存在局部自定义 CSS。 |
| AI 与协议 | `@ain-framework/remote-chat-sdk`、`@ain-framework/web-mcp-sdk`、MCP SDK、LangChain/LangGraph 等列于 `package.json`；是否用于生产流程须按调用点核实。 |
| 路由 | `src/router/index.ts` 使用 hash history；`src/router/routers/index.ts` 聚合 `modules/**/*.ts`。 |
| 开发 | 在本包运行 `pnpm dev`，Vite 端口 6688；`vite.config.ts` 把 `/api` 代理到本机 3000，另有 `/wecagw` 外部代理。 |
| 构建 | `pnpm build` 执行 `vue-tsc -b && vite build`；另有 `build:skip-ts`、`build:nocheck`。`package.json` 未定义 `lint` 或统一 `test` 脚本。 |
| 别名 | `@/` → `src/`，见 `vite.config.ts` 与 `tsconfig.app.json`。 |

`README.md` 仍是 Vue/Vite 模板说明，产品事实优先看当前源码。项目内也存在 npm/pnpm 锁文件，仓库根脚本使用 pnpm filter；按现有仓库习惯选命令，不为文档工作改锁文件。

## 入口、路由与页面

| 路由/入口 | 关键文件 | 当前可见行为 |
| --- | --- | --- |
| `/#/`、`/#/welcome` | `src/views/welcome/index.vue` | Three.js 欢迎视觉，点击进入工作台。 |
| `/#/workbench` | `src/router/routers/modules/workbench/workbench.ts` → `src/views/workbench/new.vue` | 当前工作台：Hero/搜索、待办、工具矩阵、工作流、新资讯、项目及资源卡片。文案与多数卡片数据在 `src/views/workbench/data/workbench.ts`；待办走真实 Store。旧版 `src/views/workbench/index.vue` 仍在仓库，但不是该路由的组件。 |
| `/#/chat` | `src/views/chat/index.vue` → `src/components/ChatBot/index.vue` | 独立聊天页，含会话 Store、LLM 请求与本地工具调用；与侧栏聊天实现不同。 |
| 全局 AI 悬浮入口 | `src/layout/index.vue` → `src/components/AISidebar.vue` → `src/components/RemoteChat/index.vue` | 布局内侧栏使用 remote-chat SDK，调用 `/api/chatAgent` 并复用会话 Store；与独立 `/chat` 页须分别验证。 |
| `/#/skillKnowledgeBase` | `src/views/skillKnowledgeBase/index.vue`、`components/Kb*` | HTML 目录树、预览、源码编辑、下载；数据接口在 `src/api/skillKnowledgeBase.ts`。编辑流程对未保存内容有切换确认。 |
| `/#/blog`、`/#/blog/editor` | `src/views/blog/index.vue`、`editor.vue` | 文章列表/编辑器。列表含 `mockArticleData` 初始数据，也请求 `/api/articles`；编辑器使用 `md-editor-v3`，草稿有浏览器本地自动保存与 API 保存。 |
| `/#/aiWorks` | `src/views/aiWorks/index.vue` | AI 艺术廊展示，当前图片/视频示例主要写在页面数据中。 |
| `/#/createSpace` | `src/views/createSpace/index.vue` | 以 iframe 展示外部睡眠空间；顶部导航实际直接打开外站。 |
| `/#/user` | `src/views/user/index.vue`、`src/components/ProfileCard.vue` | 个人介绍；2026-09-17 修复重复定义，使用 Layout 子路由。 |

`src/layout/index.vue` 提供顶部导航和 AI 悬浮按钮；`src/layout/components/mainContain.vue` 渲染子路由并使用 `keep-alive`。当前顶部导航是 `src/layout/components/topNavResponsive.vue`；旧 `topNav.vue` 的 Run Demo 代码保留，正式导航只有显式开发开关才展示演示入口。`src/router/routers/modules/system/system.ts` 当前为注释代码，不应写成已开放的系统管理功能。

## 状态、接口与 AI 链路

| 领域 | 读代码起点 | 数据流/注意点 |
| --- | --- | --- |
| 待办 | `src/views/workbench/components/WorkbenchTodoPanel.vue` → `src/stores/modules/agency.ts` → `/api/agencies` | 查询、新增、更新、删除；Store 使用 `credentials: include`。旧版 `src/components/ToDo.vue` 也是待办入口。 |
| 会话 | `src/stores/modules/chat.ts` → `src/api/chat.ts` → `/api/chat/sessions` | 会话和消息的读写、排序、删除；Store 内当前消息按“最新在前”保存，前后端顺序转换要谨慎。 |
| 独立聊天 | `src/components/ChatBot/index.vue` → `src/mcp/index.ts` | ChatBot 管理 LLM 请求及工具调用；`src/mcp/index.ts` 有 `add_todo`、`query_todos`、`update_todo_status` 等注册逻辑。文件里还含项目查询等逻辑，具体依赖与可用性需实测。 |
| 侧栏聊天 | `src/components/RemoteChat/index.vue` → remote-chat SDK、`chat` Store | SSE 运行时接 `/api/chatAgent`；源码注释同时保留旧 mock/localStorage 实现，判断当前行为应看运行时代码。 |
| 浏览器 Web MCP | `src/remote/webMcp.ts` | 定义页面信息工具，待办读取工具受 `VITE_REMOTE_ENABLE_TODO_TOOL` 控制；需核对实际启动调用点，不能把定义等同于已启用。 |
| 技能知识库 | `src/views/skillKnowledgeBase/index.vue` → `src/api/skillKnowledgeBase.ts` → `/api/skillKnowledgeBase/*` | 树、HTML 文件、静态内容 URL；生产编辑锁由 `import.meta.env.PROD` 控制，服务端写权限仍需独立确认。 |
| 博客 | `src/views/blog/index.vue`、`editor.vue` → `/api/articles` | 列表数据混有 mock，发布/草稿行为需按 API 与页面状态分别确认。 |
| 较早的接口封装 | `src/utils/request.ts`、`src/utils/http.ts`、`src/api/user.ts`、`menus.ts`、`thirdService.ts` | 与当前 `fetch` 路径并存，部分仍有硬编码地址与历史代码；修改前追踪实际调用点，不把它们视为统一请求层。 |

请求地址并不完全统一：Vite 有 `/api` 代理，部分模块却使用 `http://localhost:6688/api`、`https://ltbot.top/api` 或其他绝对地址。涉及环境切换、Cookie、跨域与部署时，逐条检查调用链；不要假设改一处全局配置就能覆盖所有接口。

## 目录速查

```text
src/
  main.ts, App.vue       应用挂载
  router/                hash 路由、模块路由
  layout/                顶部导航、子路由容器、AI 侧栏入口
  views/                 欢迎、工作台、聊天、知识库、博客等页面
  components/            ChatBot、RemoteChat、AISidebar、待办等组件
  stores/modules/        agency、chat、user、menus、tags、app 等 Pinia 状态
  api/                   会话、知识库及较早的用户/菜单/第三方接口
  mcp/, remote/          浏览器工具注册与 Web MCP
  hooks/mockAgent/       Agent 学习/演示代码；顶部导航 Run Demo 会调用其中示例
  types/, enums/         共用类型与枚举
  css/, style.css, svg/  样式与图标
markdown/                历史设计/集成说明，须与源码交叉核对
agent-learn-doc/         Agent 学习文档，不等同产品功能承诺
public/, src/assets/     静态资源
```

## 后续工作核查顺序

1. 从路由或实际入口找到当前组件，再确认有无旧版/演示版并存。
2. 沿组件 → Store/API → Vite 代理或远端服务追踪；区分静态数据、mock、真实接口和外部站点。
3. 在本包先做 `pnpm build` 作为可用验证；若失败，记录是否为改动前已有问题，再针对触及的链路做浏览器检查。
4. 涉及跨包接口时再阅读对应兄弟包的契约；工作区可能有未提交改动，先看 `git status` 并保留它们。

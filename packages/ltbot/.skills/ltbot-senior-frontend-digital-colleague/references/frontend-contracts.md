# ltbot 前端链路与契约

> 2026-09-16 从前端调用点整理。这里只记录本包能确认的请求形状；接口返回、鉴权和生产环境行为须与服务端及运行环境核对。

## 路由与入口

| 场景 | 入口 → 组件 | 状态来源 | 验证重点 |
| --- | --- | --- | --- |
| 工作台 | `/workbench` → `views/workbench/new.vue` | `data/workbench.ts` 静态内容 + `agency` Store | 卡片内容与真实待办不能混为一谈；Hero Agent tab 打开 Layout 的 RemoteChat 草稿，不自动发送。 |
| 独立聊天 | `/chat` → `ChatBot` | `chat` Store + LLM/工具调用 | 会话创建、流式输出、工具调用、消息落库与顺序。 |
| 全局侧栏聊天 | Layout 悬浮按钮 → `AISidebar` → `RemoteChat` | remote-chat SDK + `chat` Store | SSE `/api/chatAgent`、关闭/浮动、与独立聊天的会话兼容。 |
| 技能知识库 | `/skillKnowledgeBase` → `KbMenuTree`、`KbToolbar`、`KbSplitEditor` | `api/skillKnowledgeBase.ts` | 树/文件/预览/保存、未保存提示、生产编辑锁、下载内容。 |
| 博客 | `/blog`、`/blog/editor` | mock 初始文章 + `/api/articles`、localStorage 草稿 | 真实接口失败时如何呈现；草稿恢复、发布结果和导航。 |
| 睡眠空间 | 顶栏新标签；`/createSpace` iframe | 外站 | 外站可用性与 iframe 策略需独立验证。 |

## 核心请求链

| 调用点 | 前端请求 | 前端可确认行为 |
| --- | --- | --- |
| `stores/modules/agency.ts` | `GET/POST /api/agencies`、`PATCH/DELETE /api/agencies/:id` | `credentials: include`，维护待办 Store。 |
| `api/chat.ts` | `/api/chat/sessions` 与 `/:id/messages` | 会话列表、新建、详情、消息保存、更新、删除及批量删除。 |
| `components/RemoteChat/index.vue` | `/api/chatAgent`，可由 `VITE_REMOTE_CHAT_API` 覆盖 | SDK `createStreamingRuntime`；会话或流错误可见，具体 SSE 协议需按服务端核对。 |
| `components/ChatBot/index.vue` | LLM 代理及 `mcp/index.ts` 注册工具 | 页面内单独执行逻辑；不要套用 RemoteChat 的行为结论。 |
| `api/skillKnowledgeBase.ts` | `/api/skillKnowledgeBase/tree`、`file`、`content/*` | JSON 数据用 `success/data` 包装；内容 URL 用于 iframe/标签页。 |
| `views/blog/*.vue` | `/api/articles` 与 `/api/articles/:id` | 列表、草稿保存、发布等操作；还存在 mock 数据与浏览器自动保存。 |

## 关键状态和异常

### 待办

`WorkbenchTodoPanel.vue` 通过 `useAgencyStore` 加载并排序。创建/更新/删除会更新 Store；需求验收应覆盖空标题、请求超时、操作失败和重复点击。`agency.ts` 的 `fetchAgencies` 捕获错误后保存在 Store，调用者不一定收到异常，设计错误提示时要检查组件当前处理。

### 聊天

`chat.ts` 的 `currentMessages` 是倒序，读取后端详情时调用 `reverse()`，保存消息时用副本再反转。改动排序必须同时检查 ChatBot 和 RemoteChat。远程聊天的源码注释保留旧本地归档代码，当前实现由 `chat` Store 持久化。流式中断、工具失败与会话切换要分别验证。

### HTML 知识库

预览用 iframe，编辑态生成 Blob 预览，保存走 `PUT file`；当前页面有脏内容切换、关闭和离页确认。HTML 内容属于可执行内容，信任边界、iframe sandbox 配置和内容加载来源都要在需求中明确。前端用 `import.meta.env.PROD` 设置 `editLocked`，服务端仍需控制写权限。

### 环境与请求封装

`vite.config.ts` 代理 `/api` 到本机 3000；一些 API/Store/组件使用绝对地址，较早的 `utils/request.ts`、`utils/http.ts` 与新 `fetch` 调用并存。不要假设一个统一 baseURL 或统一鉴权拦截器。若要归一化，先枚举实际调用方与环境差异，再迁移。

## 验证清单

- 改页面：相关 hash 路由可达，导航入口与路由一致，加载/空/错/成功状态可见，桌面和窄屏可用。
- 改接口：确认方法、路径、Cookie、返回结构、失败消息、取消/重复提交与环境地址。
- 改聊天：检查首次会话、历史切换、流式中断、消息顺序、工具调用与落库。
- 改文档编辑：检查未保存切换、关闭、保存失败、预览与生产编辑锁。
- 源码变更跑 `pnpm build`；报告原始失败信息，不用 `build:skip-ts` 假装类型检查通过。

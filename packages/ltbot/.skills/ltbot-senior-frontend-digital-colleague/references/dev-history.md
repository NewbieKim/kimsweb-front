# ltbot 前端开发记录

> Markdown 源文件；运行 `python scripts/build_dev_history.py` 生成 `docs/dev-history.html`。最新记录在前。只记已发生的工作与可核对的结论。

## 档案卡

| 项目 | 内容 |
| --- | --- |
| 包 | `packages/ltbot`，Vue 3 + TypeScript + Vite 单页前端 |
| 核心界面 | 工作台、独立/侧栏聊天、待办、博客、技能知识库 |
| 服务边界 | 本包为前端；API 由其他服务提供，睡眠空间为外站 |
| 验证命令 | `pnpm build`；本包没有统一 lint/test 脚本 |

## 2026-09-17 H5 响应式改造

- 类型：前端功能与交互。
- 背景：用户批准四项功能与欢迎入口的 H5 改造计划，明确保留 Run Demo 演示代码但从正式导航隐藏，独立 `/chat` 等不在本期。
- 文件：`src/layout/`、`src/components/AISidebar.vue`、`src/components/RemoteChat/index.vue`、`src/router/routers/`、`src/views/workbench/components/`、`src/views/skillKnowledgeBase/`、`src/views/createSpace/`、`src/views/user/`、`src/views/welcome/`、`src/api/chat.ts`、`src/stores/modules/agency.ts`、`src/style.css`。
- 关键决定：导航与菜单、聊天、知识库目录共用互斥浮层及滚动锁；AI 球用 Pointer Events 区分拖动与点击；Hero 草稿待会话初始化后写 SDK 草稿键且不发送；会话失败显示重试；知识库编辑保护未保存源码。移动聊天/待办走同源 `/api`，外站用 HTTPS 及手动入口。
- 验证：浏览器检查 320、375、414、768、1024、1440px 的欢迎页、工作台、知识库、关于我、`/createSpace`，无页面级横向溢出；模拟聊天及知识库接口验证 Hero 草稿不发 SSE、浮层开关/焦点/滚动恢复、目录与编辑提示。`git diff --check -- src` 通过。`pnpm build` 仍被改造前的跨包/演示模块等存量类型错误阻断；触及模块无诊断。`pnpm build:skip-ts` 验证 Vite 产物。
- 遗留：尚无真机 iOS Safari、Android Chrome、微信浏览器和真实后端联调，不能声称 SSE、历史、待办与知识库保存端到端通过；外站 iframe 可用性依赖站点策略。存量 TypeScript 错误另行处理。

## 2026-09-16 数字同事档案重建

- 类型：文档/工程协作规则。
- 背景：用户指出前一版只有 `SKILL.md` 与顶层代码地图，不具备参考数字同事的档案、评审、生成脚本和可持续维护结构。
- 做了什么：重新阅读 nextapp 两份参考 Skill 的入口、目录与关键档案；把 ltbot 代码地图归入本 Skill 的 `references/`，新增前端链路契约、开发时间线、评审记录、HTML 生成脚本与 UI 元数据，并重写角色工作协议。
- 关键决定：参考通用性格和档案机制；技术与产品事实只从 ltbot 的当前源码提取。把 `ChatBot` / `RemoteChat`、静态卡片 / 真实待办、ltbot / 外站睡眠空间明确分开。
- 验证：Skill 结构校验、脚本生成和文档链接检查；未修改应用源码，不用应用构建代表文档质量。
- 遗留：后续功能开发时继续把具体决策和验证结果写入本文件。

## 2026-09-16 初版数字同事建立

- 类型：文档。
- 背景：用户要求从 ltbot 项目出发建立资深前端与产品经理数字同事。
- 做了什么：梳理包依赖、路由、主要页面、Store/API 与 AI 入口，建立初版代码地图和两个角色入口。
- 复盘：初版只覆盖角色简介和地图，档案结构明显不足；本次重建补齐。

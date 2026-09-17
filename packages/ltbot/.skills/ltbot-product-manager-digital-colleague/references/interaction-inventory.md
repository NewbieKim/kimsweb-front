# ltbot 交互现状清单

> 用于 PRD 与原型设计前的入口核对。2026-09-16 按源码整理，未替代浏览器走查。

| 起点 | 用户动作 | 当前去向或反馈 | 设计时要问 |
| --- | --- | --- | --- |
| 欢迎页 | 点击欢迎视觉 | 跳转工作台 | 是否需要明确的主按钮与跳过动画？ |
| 顶部“工作台” | 点击文字 | `/workBench`，路由大小写需实测 | 与实际 `/workbench` 路由是否一致？ |
| 顶部“技能知识库” | 点击文字 | `/skillKnowledgeBase` | 文档查找、预览、编辑分别给谁用？ |
| 顶部“睡眠空间” | 点击文字 | 新标签打开外站 | 是否说明离站、是否保留返回路径？ |
| 全局 AI 悬浮按钮 | 点击 | 打开 `AISidebar` 中的 `RemoteChat` | 与工作台 Agent tab 的关系是什么？ |
| 工作台 Hero Agent tab | 输入指令提交 | `/chat?prompt=...` | 独立聊天页是否读取 prompt 并自动执行？需浏览器验证。 |
| 工作台 Hero 搜索/社区/生活 | 输入关键词/点链接 | 外部搜索或网站 | 是否能清楚区分“站内功能”和“打开外站”？ |
| 工作台站内文章 tab | 输入关键词 | `/blog?keyword=...` | 博客列表是否消费该 query？需验证。 |
| 工作台待办 | 新增/完成/删除 | `agency` Store 请求后端 | 失败、重复点击和空数据怎么反馈？ |
| 知识库 | 选文档、切编辑、保存/下载 | API 读取和写入 HTML | 未保存离开、生产编辑锁、权限怎么说明？ |
| 博客 | 打开编辑器、保存草稿/发布 | 本地自动保存与文章 API | 两处草稿状态冲突时以谁为准？ |
| 顶部 Run Demo | 点击 | 调用 Agent 学习示例 | 是否应展示给普通用户？属待确认建议。 |

## 原型必须标注的状态

对每个新增或改动入口，标注默认、加载、空、错误、成功、离开/取消五类状态。聊天另标流式中断与会话切换；知识库另标脏内容；外站另标弹窗拦截和加载失败。若需求只影响其中一种入口，不强行扩展到其他页面。

## 证据入口

`src/layout/components/topNav.vue`、`src/layout/index.vue`、`src/views/workbench/components/WorkbenchHero.vue`、`src/views/workbench/components/WorkbenchTodoPanel.vue`、`src/views/skillKnowledgeBase/index.vue`、`src/views/blog/*.vue`。更完整的代码路径见前端数字同事的 `references/project-map.md`。

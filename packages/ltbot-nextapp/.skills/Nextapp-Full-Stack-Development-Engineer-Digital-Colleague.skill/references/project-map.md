# ltbot-nextapp 项目技术地图

> 用途：每次开工前校准项目现状。维护者：Nextapp 全栈数字员工。最后更新：2026-08-25。

## 1. 项目一句话

AI 睡眠伙伴：家长为 0-8 岁孩子定制睡前故事，支持 DeepSeek 生成正文、文生图插画、Azure TTS 朗读、音乐广场、积分解锁与运营埋点。

## 2. 技术栈

| 层 | 选型 | 备注 |
| --- | --- | --- |
| 框架 | Next.js 16.0.5（App Router） | 前后端同仓，端口 3100 |
| 前端 | React 19.2、TypeScript 5、Tailwind CSS 4 | HeroUI 组件、Zustand、date-fns、react-toastify |
| 后端 | Next.js API Routes + Prisma 6.8 | SQLite（开发）/ PostgreSQL（生产可选） |
| 认证 | Clerk 6.36 | 用户 ID 为 `user_xxx` 格式 |
| AI 文本 | DeepSeek API | 异步生成 + 指数退避重试 |
| 语音 | Azure TTS | `POST /api/tts`，支持脚本分段与 SFX |
| 插画 | BYTEPLUS / OPENAI_IMAGE / RECRAFT / STABILITY_AI | Provider 适配器 + Webhook |
| 部署 | Docker + Docker Compose + Nginx | 域名 `space.ltbot.top` |

## 3. 目录结构要点

```text
ltbot-nextapp/
|-- src/app/                    # App Router 页面与 API Routes
|   |-- (auth)/sign-in, sign-up # Clerk 登录注册
|   |-- api/                    # stories / scores / users / tts / admin / webhooks
|   |-- create-story/           # 三步创建故事向导
|   |-- to-explore-story/       # 故事列表与详情
|   |-- to-explore-music/       # 音乐广场
|   |-- to-create-music/        # 音乐创作（开发中）
|   |-- to-view-mine/           # 个人中心
|   `-- components/             # Header / BottomNav / 播放器 / 弹框等
|-- src/lib/
|   |-- response.ts             # 统一 API 响应
|   |-- request.ts              # Axios 封装
|   |-- prisma.ts               # Prisma Client
|   |-- tts/storyScript.ts      # TTS 脚本解析
|   `-- illustration/           # 插画服务、Provider 适配、类型
|-- src/hooks/                  # useDevice / useUserSync / useAzureTTS
|-- prisma/schema.prisma        # 数据模型
|-- agent_doc/                  # 项目文档中心
`-- .skills/                    # 本数字员工 Skill
```

## 4. 数据模型

核心模型：

| 模型 | 作用 | 关键点 |
| --- | --- | --- |
| `User` | Clerk 用户同步 | `id` 为 Clerk userId，`email` 唯一 |
| `Story` | 故事主表 | `extData` 存生成状态与 TTS 脚本，含插画状态快照字段 |
| `Music` | 音乐记录 | 开发中 |
| `UserScore` | 用户积分余额 | `userId` 唯一 |
| `ScoreTransaction` | 积分流水 | 余额变更前后快照，关联 story/music |
| `LoginAttempt` | 登录失败计数与锁定 | `phone + ip` 唯一，10 次失败锁 15 分钟 |
| `SmsSendLog` | 短信发送日志 | 频控、对账、验证码凭证单次消费 |
| `StoryLike` / `StoryFavorite` | 点赞收藏 | `@@unique([storyId, userId])` |
| `StoryComment` | 评论 | 支持 `parentId` 回复、软删除 |
| `UserFollow` | 关注关系 | `@@unique([followerId, followingId])` |
| `StoryIllustrationJob` | 插画主任务 | 状态机、幂等键、失败原因码 |
| `StoryIllustrationFrame` | 插画分镜 | `@@unique([jobId, frameIndex])`，独立状态与重试 |
| `OperationEvent` | 运营埋点 | 事件类型 + 用户/访客/故事 + metadata |

## 5. API 清单

故事：

- `GET /api/stories`：列表，支持 userId/page/pageSize/ageGroup/themeType
- `POST /api/stories`：创建故事
- `GET/PUT/DELETE /api/stories/[id]`：详情/更新/删除
- `POST /api/stories/generate-async`：触发异步生成，立即返回 202
- `POST /api/stories/[id]/unlock`：积分解锁全文（防重复扣费）
- `POST /api/stories/[id]/like`、`/favorite`、`/comments`：互动
- `POST /api/stories/[id]/illustrations/start`：启动插画（管理员 Token 保护）
- `GET /api/stories/[id]/illustrations`：插画进度
- `POST /api/webhooks/illustrations/[provider]`：插画回调（HMAC 验签）

积分：

- `GET /api/scores`：余额与流水
- `POST /api/scores/recharge`：充值（当前为开发版，未接支付）
- `POST /api/scores/consume`：消费（事务扣费）

认证（手机号 + 密码，2026-08-25 新增）：

- `POST /api/auth/send-code`：发送短信验证码（register/forgot，含频控）
- `POST /api/auth/verify-code`：核验验证码并签发短期凭证
- `POST /api/auth/register`：注册并同步本地用户 + 赠送积分
- `POST /api/auth/reset-password`：重置密码并使旧会话失效
- `POST /api/auth/login-status`：查询锁定状态与剩余次数
- `POST /api/auth/record-login-attempt`：记录登录成功/失败，驱动锁定

> 登录本身由 Clerk 前端 `useSignIn` 完成，服务端不接收密码。
> Clerk 免费方案：手机号映射为内部邮箱标识（`${手机号}@phone.ltbot.top`）+ 密码；界面仍以手机号交互，不开放邮箱登录，也无需 Clerk Pro。

其他：

- `POST /api/tts`：Azure TTS 代理
- `POST /api/users/sync`：Clerk 用户同步
- `POST /api/webhooks/clerk`：Clerk 事件
- `GET /api/admin/operation-metrics`、`/api/admin/users`：运营看板
- `GET /api/health`：健康检查

## 6. 关键业务链路

### 故事异步生成

```text
创建 Story（generationStatus=pending）
  → POST /api/stories/generate-async（202）
  → 后台调 DeepSeek（重试 3 次，2s/4s/8s 退避）
  → splitStoryFormats 拆成 displayText + ttsScript
  → 写 story.content 与 extData，状态 completed/failed
  → 成功后自动触发插画 start（不阻塞正文）
  → 前端详情页每 5 秒轮询，生成中持续刷新
```

### 插画流水线

```text
start（管理员 Token + Feature Flag + 幂等键）
  → 事务内建 Job + Frame（3-10 帧，首帧优先）
  → Provider 适配器逐帧提交/生成
  → Webhook 回调验签（HMAC）→ 更新帧状态
  → 首帧成功回填 story.coverImage
  → 终态收敛：SUCCEEDED / PARTIAL_SUCCESS / FAILED
```

### 积分解锁

`$transaction` 内校验余额、检查是否已解锁、扣费并写流水，`StoryLike/Favorite` 用唯一约束防重复。

## 7. 安全现状与已知风险

- 已做：Clerk 登录、插画 start 的管理员 Token、Webhook HMAC 验签、积分事务、唯一约束防重复、Feature Flag。
- 已知风险：
  - `middleware.ts` 当前只保护 `/create-music`、`/create-story`，且开发模式（`NEXT_PUBLIC_DEV_MODE=true`）直接跳过身份校验。
  - `POST /api/scores/recharge` 仍信任 body.userId；当前为开发版未接支付，上线前必须改为服务端鉴权 + 支付凭证校验。
  - `GET /api/scores` 历史注释按数字 ID 处理，与当前字符串 userId 存在不一致风险。
  - 故事生成任务存于进程内，服务重启会中断正在生成的任务（计划中改为 BullMQ/Redis）。
  - 当前工作区存在大量未提交改动，开发前必须 `git status` 确认，不覆盖用户改动。

## 8. 编码与文档约定

- 统一响应：一律使用 `src/lib/response.ts` 的 `successResponse` / `errorResponse` 等。
- 前端请求：优先使用 `src/lib/request.ts` 封装的 Axios 实例。
- 数据库：改表必出 Prisma migration；索引按需且评估写入损耗。
- 异步：长耗时一律走异步任务 + 状态 + 前端轮询，不阻塞请求。
- 日志：错误日志包含“什么功能、什么参数、什么环节、什么异常”。
- 文档：开发完成后同步更新 `agent_doc/todo.md`、`agent_doc/api_doc_guide.md`、`agent_doc/question.md` 与本 Skill 档案。

## 9. 常用命令

```bash
pnpm dev      # 开发，端口 3100
pnpm build    # 生产构建
pnpm start    # 启动生产
pnpm lint     # ESLint
pnpm prisma migrate dev --name xxx   # 开发迁移
pnpm prisma migrate deploy           # 生产迁移
pnpm prisma generate                 # 生成 Client
```

## 10. 文档中心

- `agent_doc/README.md`：文档导航
- `agent_doc/api_doc_guide.md`：API 接口文档
- `agent_doc/api_response_guide.md`：统一响应格式
- `agent_doc/question.md`：问题解决方案汇总
- `agent_doc/todo.md`：功能开发计划与进度
- `agent_doc/tts-listen-fulltext-plan.md`：听全文方案
- `agent_doc/text-to-image-platform-pre-research.md`、`story-illustration-flow-boundary.md`、`jimeng-text-to-image-integration-guide.md`：插画相关方案

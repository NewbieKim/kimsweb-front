# ltbot-nextapp 开发记录

> 本文件是开发档案的 Markdown 源，HTML 版由脚本生成。
> 维护协议：每次完成开发或有价值沟通后更新本文件，并运行 `python scripts/build_dev_history.py` 重新生成 `docs/dev-history.html`。
> 排序规则：最新记录在前。
> 最后更新：2026-09-06。档案版本：1.1.9。

## 0. 档案卡

| 项目 | 内容 |
| --- | --- |
| 产品 | AI 睡眠伙伴（睡前故事 + 插画 + TTS + 音乐广场） |
| 技术栈 | Next.js 16 / React 19 / TypeScript / Tailwind 4 / Prisma 6 / Clerk / DeepSeek / Azure TTS |
| 部署 | Docker + Nginx，`space.ltbot.top:3100` |
| 文档中心 | `agent_doc/` |
| 数字员工 Skill | `.skills/Nextapp-Full-Stack-Development-Engineer-Digital-Colleague.skill/` |

## 1. 2026-09 深度定制化评审期

### 2026-09-06 场景卡片功能 v0.1.0

- 类型：全栈功能实施。严格依据《场景卡片功能 PRD / 高保真原型 v0.1.0》，改造故事创作第 2 步，不增加路由和创作步骤。
- 做了什么：新增 `scene-cards@0.1.0` 单一版本化目录，固定 4 类×6 卡并补齐 24 张卡的世界观、情绪曲线、安全规则和四年龄段配置；保留旧 4 个 ID。前端按原型实现四类纵向、类内 3:4 图片卡横滑、全局单选、所属分类下分龄详情、未选禁用、桌面箭头、键盘方向键、图片失败渐变降级和返回状态恢复。
- 服务端与数据：新客户端只提交 `sceneId`；服务端只接受 ACTIVE 目录项并按档案年龄写快照版本 2，字段包含 `sceneId/categoryId/catalogVersion/briefDescription/ageSetting/ageSkeleton` 等，生成链路兼容读取历史 `storySkeleton`。
- 素材与埋点：使用 Codex 内置 imagegen 生成 4 组儿童绘本母图，裁切为 24 张 384×512 本地 JPEG（30–68KB），不使用第三方热链；补齐页面、分类曝光、横轨滚动、卡片选择、步骤完成和图片失败事件，属性不含孩子昵称或今晚小事。
- 涉及文件：`src/lib/story-customization/scene-catalog.ts`、`catalog.ts`、`types.ts`、`create-story.ts`、`src/app/create-story/page.tsx`、`components/DreamPlace.tsx`、异步生成兼容、运营事件常量、`public/scene-cards/` 与项目档案。
- 关键决策：PRD 尚未指定设计/图库来源，为避免上线继续热链原型图，本轮直接生成可发布的本地绘本封面；未来换图保持文件名，若语义配置变化则升级目录版本。目录随包发布，不增加数据库和 CMS。
- 验证结果：目录脚本确认 4 类、24 个唯一 ID、每类 6 张、每张四年龄段配置完整；24 张图片全部存在且小于 120KB。定向 ESLint 0 error/0 warning，本次文件 TypeScript 无错误；浏览器验证 375px/1280px 均无页面横向溢出，未选禁用、跨分类唯一选中、选中详情、键盘横移及返回恢复均正常，控制台 0 error。`pnpm build` 成功生成 36 个页面；全仓 `pnpm lint` 仍为既有 59 errors/30 warnings，本次未新增。

### 2026-09-05 孩子档案列表层级收紧

- 类型：前端布局修正。用户指出孩子档案页标题过大、说明文案冗余，且编辑/删除分散在卡片不同位置。
- 做了什么：页面标题收至 24px 并删除副文案；档案名称收至 20px；卡片改为等高弹性布局，主操作在左下，编辑/删除在右下并排。同时重排文件结构，清理难维护的单行 JSX。
- 涉及文件：`src/app/to-view-mine/child-profiles/page.tsx`、`src/app/globals.css`、项目文档与本开发档案。
- 关键决策：保留“为 TA 讲故事”为卡片主操作；编辑/删除作为管理操作统一收入右下角。弹框确认按钮改为组件内明确样式，移除全局 `footer` 选择器。
- 验证结果：本地页面确认标题、卡片、右下操作区正常展示；弹框“确定”按钮在当前主题下为强调色背景、白色文字且完整可见。定向 ESLint、TypeScript 检查与 `git diff --check` 通过，`next build` 成功生成 36 个页面。

### 2026-09-05 我的故事档案筛选对齐原型

- 类型：前端交互还原。用户反馈原生 `select` 下拉框不美观，要求与高保真原型 v1.2.1 保持一致。
- 做了什么：对照原型 `renderMine()` 的 `profile-toolbar + choiceGroup` 结构，将下拉框替换为“我的故事”标题和圆角筛选标签组；支持全部、正常档案、已删除档案，并保留原有 `childProfileId` 请求行为。
- 涉及文件：`src/app/to-view-mine/page.tsx`、`agent_doc/todo.md`、`agent_doc/api_doc_guide.md`、`agent_doc/question.md`、本开发档案。
- 关键决策：移动端与原型一样将标题和筛选项上下排列，桌面端保持左右分布；按钮补充 `aria-pressed`，让视觉选中态与辅助技术语义一致。
- 验证结果：本地页面展示“全部/小抱咪/小汤圆”三个标签；点击“小抱咪”后 `aria-pressed` 正确切换，选中态为米色主题的强调色描边和浅色底。定向 ESLint 和 TypeScript 检查通过，`next build` 成功生成 36 个页面，`git diff --check` 通过。

### 2026-09-05 档案按钮、创作导航与性格方向修正

- 类型：前端问题修复 + 共享目录扩展。用户反馈档案弹框确定按钮显示成白色、创作页上/下一步被遮挡，并要求性格方向由 4 项扩展为 8 项优秀品质。
- 做了什么：确认按钮显式绑定站点主题色与白色文字；创作操作栏移动端改为 `bottom-16`，避开 64px 的全局 BottomNav，并恢复“返回上一步”文案；新增自信、友善、耐心、乐观四个性格方向。
- 涉及文件：`src/app/globals.css`、`src/app/create-story/page.tsx`、`src/lib/story-customization/catalog.ts`、档案页与项目档案。
- 关键决策：性格选择仍限 1–3 项；前端两个入口与服务端校验继续复用 `CHILD_TRAITS`，不建立三份易漂移的目录。
- 踩坑与教训：HeroUI `color="primary"` 使用自身颜色体系，不会自动跟随站点的 `--theme-accent`；全局 BottomNav 为 `z-50`，页面操作栏为 `z-20` 且同样 `bottom-0`，所以按钮实际存在但被完全盖住。
- 验证结果：本地浏览器检查确认档案“确定”按钮为 `rgb(196,149,106)` 背景、白色文字且处于视口内；第二步的“返回上一步”和“下一步”均可见；两个界面均展示 8 项性格方向。定向 ESLint 0 error/0 warning；补齐 `useSearchParams` 的 Suspense 边界后，`next build` 成功生成 36 个页面。全仓历史 lint 基线仍为 59 errors/30 warnings，本次文件无新增问题。

### 2026-09-05 故事深度定制化一期实施

- 类型：全栈功能实施。依据 PRD 与高保真原型 v1.2.1，完成孩子档案、定制快照、默认私密故事、异步生成回执和统一访问控制闭环。
- 数据：新增 `StoryVisibility`、`ChildProfile`、`StoryCustomization`；历史故事迁移时显式回填 PUBLIC，新故事默认 PRIVATE；幂等键、序号递增、Story 与快照在同一事务。
- 服务端：新增孩子档案 CRUD/软删除/恢复 API；定制创建服务端校验并生成 Prompt；异步生成只接收 storyId；列表、详情、互动、解锁、评论、插画复用私密访问策略。
- 前端：创建页改为预设头像三步定制流程；新增档案管理页、生成结果回执页、私密摘要和按档案筛选；私密作者解锁 cost=0，隐藏分享入口。
- 验证：Prisma schema/migration status 通过，开发库 18 条历史故事均为 PUBLIC；本轮定向 ESLint 0 error/0 warning；`pnpm build` 编译通过，但本机缺少 Clerk publishableKey，在 `/agreement` 静态导出阶段停止。全仓基线 118 errors/44 warnings 未扩大清理。

### 2026-09-05 原型还原原则补充

- 用户反馈：孩子档案空状态留白过大，建档表单未按原型弹框实现，属于不应自行设计的偏差。
- 后续约束：存在 PRD/高保真原型时，先逐项核对布局、弹框层级、文案、状态和交互，再实现；不得以个人偏好替换原型。此次已将档案页改为居中空状态 + 新建入口，并恢复为原型风格的建档弹框。

### 2026-09-05 全栈数字同事协作基线确认

- 类型：文档 / 决策。用户确认后续 ltbot-nextapp 协作严格遵循本项目全栈数字员工 Skill。
- 做了什么：完整读取 `SKILL.md`、`references/project-map.md` 与现有开发档案，并检查工作区状态，建立后续任务的统一协作基线。
- 涉及文件：`.skills/Nextapp-Full-Stack-Development-Engineer-Digital-Colleague.skill/references/dev-history.md`、`.skills/Nextapp-Full-Stack-Development-Engineer-Digital-Colleague.skill/docs/dev-history.html`。
- 关键决策：后续项目任务执行七步闭环；只关注 ltbot-nextapp；开发前检查未提交改动；开发或关键沟通后维护档案；验证与文档更新按实际影响范围执行，不为无 API、无功能状态、无问题方案的沟通向 `agent_doc` 注入空记录。
- 踩坑与教训：当前工作区存在产品经理 Skill 下的未提交文档改动，属于用户现有工作，本次不读取、不覆盖、不纳入全栈开发档案的修改范围。
- 验证结果：Skill 与项目地图均已完整读取；开发档案已校准；`git status --short` 已检查。

### 2026-09-04 深度定制化一期 PRD 技术评审

- 类型：需求评审。评审材料：产品数字同事《深度定制化体验 PRD》v1.1.0（文件名仍为 2026-09-03，文内确认版日期为 2026-09-04）。
- 结论：产品方向有条件通过，但当前版本暂不批准直接进入开发。建议一期先交付“孩子档案 + 今晚小事 + 不可变快照 + 私密回执/详情/筛选”的私密定制闭环；公开发布、内容审核与每日 5 积分奖励拆为后续独立里程碑。
- 文档阻塞：v1.1 更新与正文旧规则并存，存在档案不限量/最多 5 份、今晚小事 80/120 字、photoUrl/avatarUrl、deletedAt/status、flavorTag/flavorTags、口味语气属于本期/P1 等冲突；开发前需合并为唯一契约。
- 现状核对：故事广场和列表接口默认查询全部故事；故事详情、更新、删除接口未做身份和可见性校验；异步生成接口未鉴权且信任客户端 formData/customPrompt；公开/私密上线前必须先建立统一故事访问策略并补齐所有权校验。
- 隐私风险：生成链路当前打印完整 prompt，并打印 DeepSeek 配置和 process.env；接入孩子昵称、照片及今晚小事前必须移除，日志只留 storyId、阶段、耗时、错误码等非敏感信息。
- 数据建议：定制快照使用 Story 独立字段或一对一模型，不与 generationStatus/TTS 共用 extData 的读改写链路；照片持久化对象 key 而非签名 URL，明确软删除、历史引用、删号清理和公开 DTO 脱敏规则。
- 可见性阻塞：历史故事当前事实为公开，PRD 又要求新故事默认 PRIVATE 且“不批量迁移”；需明确历史数据映射。匿名/非作者只能读取 PUBLIC，作者可读取自己的三种状态，PUBLIC_PENDING 不进广场，互动和解锁同样执行可见性校验。
- 奖励阻塞：现有 TransactionType 无公开奖励类型，ScoreTransaction 无业务幂等键。若后续实施，需用数据库唯一约束保证 storyId 只奖一次、用户按 Asia/Shanghai 自然日只奖一次，并用审核版本阻止转私密后的迟到回调发奖。
- 上传与审核待定：仓库暂无对象存储和内容审核实现/依赖。产品需确认供应商、失败降级、回调验签、人工下架、照片生命周期、真实 MIME/尺寸校验与 EXIF 清理策略。
- 验收补充：明确“第 N 个故事”计数口径、历史故事可见性、公开后转私密、审核迟到/重复回调、并发创建、档案删除/恢复、账号删除和公开响应不得返回照片对象 key、今晚小事原文或完整快照。

## 2. 2026-08 数字员工协作期

### 2026-08-31 对照 SendSmsVerifyCode 官方文档对齐 TemplateParam

- 类型：方案。对照 https://help.aliyun.com/zh/pnvs/developer-reference/api-dypnsapi-2017-05-25-sendsmsverifycode 。接口、SDK、必填字段（PhoneNumber/SignName/TemplateCode/TemplateParam）原先就对；唯一实质偏差是 TemplateParam 少了文档示例里的 `min`。
- 落地：默认改为 `{"code":"##code##","min":"5"}`（与 ValidTime=300 秒一致）；显式传 DuplicatePolicy=1。CodeType=1、CodeLength=6 保持。
- 说明：SchemeName / ReturnVerifyCode / AutoRetry / SmsUpExtendCode 按文档可空，未传。忘记密码场景文档赠送模板是 100003，当前与注册共用 100001，未改。

### 2026-08-31 真实短信 502 System Internal Error

- 类型：问题。SDK 修复后发码变成 502，页面展示阿里云原文 `System Internal Error`。更早一次是 `InvalidAccessKeyId.NotFound`（密钥在 RAM 里找不到，用户已换成新 Key）。
- 根因候选：`.env` 里 `SMS_TEMPLATE_PARAM` 含 `##code##`，dotenv 把 `#` 当注释截断，JSON 残缺；另外用了 `##code##` 占位却没传 `codeType`。签名若抄了文档示例「恒创联众」而不是自己控制台赠送签名，阿里云也会甩这个含糊错误。
- 修复：模板参数 JSON 校验失败则回退默认值；`.env` 给模板参数加引号；补 `codeType=1`、`codeLength=6`（前端核的是 6 位）；阿里云错误码翻成中文，不再把 `System Internal Error` 直接丢给用户。
- 验证：需用户在注册页再发一次。若仍失败，到号码认证控制台核对赠送签名/模板、开通短信认证、账户余额。

### 2026-08-31 真实短信发送 TypeError 修复

- 类型：问题。本地 `SMS_MOCK_MODE=false` 走阿里云时，`POST /api/auth/send-code` 报 `request.validate is not a function`。
- 根因：`@alicloud/dypnsapi20170525` v2 要求传入 `SendSmsVerifyCodeRequest` / `CheckSmsVerifyCodeRequest` 实例，代码传了普通对象，SDK 一上来调 `request.validate()` 就炸。
- 修复：`src/lib/sms.ts` 改为构造官方 Request；补上必填 `templateParam`；`validTime` 按秒传 300（原先误传 5）；核验 `countryCode` 改为 `86`。发送失败不再留下频控日志，避免失败一次还要等 60 秒。
- 验证：本地实例化 Request 后 `validate()` 通过。未向真实手机号发短信，需用户在注册页再点一次获取验证码确认阿里云侧配置。

### 2026-08-28 密码加解密与短信验证代码解读归档

- 类型：文档。把注册 / 忘记密码链路上的两件事讲清楚：RSA 传输加密管「路上别偷看」，短信验证管「证明手机是你的」。
- 要点：加密发生在浏览器公钥 → 我方 API 解密 → 交给 Clerk；登录走 Clerk SDK，不经过我方 API，所以不套这层 RSA。短信核过之后发 5 分钟单次 HMAC 票，注册/重置必须消费这张票。
- 产出：独立可读 HTML `docs/0828_加解密和短信验证.html`（左侧 TOC、敏感值脱敏）。
- 未改业务代码。

### 2026-08-25 协作规则更新（关注范围收窄 + 档案倒序）

- 用户建议并确认：`doc-mcp`、`ltbot-admin`、`ltbot-server`、`ltbot` 等兄弟包改动不用关注，后续只关注 ltbot-nextapp 的开发。
- 用户建议并确认：文档记录按“最近记录放最前”维护。
- 落地：更新 SKILL.md 的范围边界与维护协议；将 `dev-history.md` 重排为最新在前，档案版本升至 1.1.0。
- 相关：`SKILL.md`、`references/dev-history.md`、`docs/dev-history.html`。

### 2026-08-25 手机号认证 M1 开发进行中

- 评审结论：注册机制 PRD v1.0.0 通过，进入开发阶段；开发计划见 `references/development-plan-2026-08-25-phone-auth.md`。
- 已完成：
  - Prisma：`User.phone @unique`、`User.email` 可空、`LoginAttempt`、`SmsSendLog`，共 4 个迁移已应用。
  - 核心库：`verify-token`（HMAC 短期凭证、绑定短信日志、单次消费）、`login-attempt`（phone+ip 锁定）、`sms`（阿里云 SDK + mock 模式 + 频控）、`user-sync`（幂等同步与积分赠送）。
  - API：`/api/auth/send-code`、`verify-code`、`register`、`reset-password`、`login-status`、`record-login-attempt`。
  - 页面：自定义 `/sign-in`、`/sign-up`、`/forgot-password`，替换 Clerk 预置组件；新增 `/agreement`、`/privacy` 草稿页。
  - 存量改造：sync/Webhook 兼容 phone 主标识与无邮箱用户，积分赠送幂等；`POST /api/stories`、`/api/scores/consume`、`/api/stories/[id]/unlock` 改为服务端 `auth()` 取用户。
  - 其他：`env.production.example` 新增短信/验证码凭证配置；create-story 登录入口改为自定义登录页回跳。
- 落实的工程修正：登录走 Clerk 前端 `useSignIn`（服务端不接密码接口）；锁定按 `phone+ip` 防恶意锁定；登录失败不暴露手机号是否注册；验证码凭证 HMAC 签名且单次消费。
- 当时阻塞：`pnpm prisma generate` 因运行中的 ltbot-nextapp dev server 占用 Prisma query engine dll 报 EPERM；用户停止服务后已解除，见下一条“M1 验证通过”。
- 下一步：M1 验证 → M2 登录拦截闭环（写操作触发登录并回原动作）→ M3 上线准备（阿里云/Clerk 配置、隐私协议正式文案、文档更新）。

### 2026-08-25 手机号认证 M1 验证通过

- 用户停止 ltbot-nextapp dev server 后，`pnpm prisma generate` 成功；`pnpm build` 成功，构建产物包含全部新增认证路由与页面。
- mock 短信链路验证（`SMS_MOCK_MODE=true`，本地 3101 端口）：
  - `send-code` 首次 200，60 秒内重复 429；
  - `verify-code` 错误验证码 400，正确验证码（mock 123456）200 并返回 HMAC 凭证；
  - `record-login-attempt` 连续 10 次失败后 `locked=true`、`lockRemainingSeconds=900`；
  - `login-status` 能正确返回锁定与剩余次数；
  - `register` 使用无效凭证返回 401，未触发 Clerk 外部调用。
- 未验证项（M3 上线准备范围）：真实阿里云短信下发、Clerk 建号/手机号+密码登录的端到端 POC；为避免在用户 Clerk 测试实例产生外部副作用，本次未执行真实注册。
- 验证用 dev server 已停止，无遗留运行会话。

### 2026-08-25 验证码环境规则调整

- 用户确认：非生产环境验证码默认使用 mock 值 `123456`，不需要额外配置；生产环境由用户自行配置真实短信环境变量。
- 落地：`isMockSmsMode()` 改为“显式配置优先，未配置时非生产默认 mock、生产默认真实短信”；`env.production.example` 将 `SMS_MOCK_MODE=false` 显式写入并补充说明。
- 生产配置位置：`packages/ltbot-nextapp/.env.production`（或部署环境变量），需填写 `ALIBABA_ACCESS_KEY_ID`、`ALIBABA_ACCESS_KEY_SECRET`、`SMS_SIGN_NAME`、`SMS_TEMPLATE_CODE`、`AUTH_VERIFY_SECRET`。

### 2026-08-25 M2 登录拦截闭环完成

- 新增全局登录拦截：`AuthGateProvider` + `AuthGateModal`，自定义登录弹层替换 Clerk 预置 `SignInButton mode="modal"`；全仓已无 `SignInButton`/`SignUpButton` 残留。
- 接入点：故事详情页点赞、收藏、评论、回复、关注、创作续集；首页快速生成与“请先登录”CTA。未登录操作弹登录框，登录成功自动重放原动作。
- 游客浏览边界最终化：首页/故事列表/详情预览/音乐广场放开；`/create-story`、`/create-music` 由 middleware 保护并回跳来源；写接口由 `auth()` 兜底 401。
- middleware 重写为 Clerk v6 正确用法（`await auth()`），清理 layout 预置组件残留。
- 验证：新增文件 eslint 0 error；tsc 过滤新增代码无错误；`pnpm build` 通过。

### 2026-08-25 注册报错“手机号已注册”根因修复

- 现象：手机号 18370971315 首次注册返回 400 “该手机号已注册”；排查本地 `User` 表与 Clerk 均无该手机号，验证码凭证已被消费（`SmsSendLog` sid=2，`usedAt` 有值）。
- 根因：`register` 传给 Clerk 的 `phoneNumber` 是 11 位裸号，Clerk 要求 E.164（`+86...`），`createUser` 返回 422 校验错误；原错误映射把任意 422 都判定为“已注册”，提示误导并掩盖真实原因。
- 修复：
  - 新增 `src/lib/phone.ts`：`isChinaMobile` / `normalizeChinaPhone` / `maskPhone`。
  - `register`、`reset-password` 调 Clerk 前统一转为 `+86` 格式；本地 `User.phone` 统一存 E.164。
  - 错误映射收紧：仅当 Clerk 错误信息包含 `already exists` 才提示“已注册”，其余校验错误返回明确提示。
  - 前端登录页、注册自动登录、登录弹层的 Clerk `identifier` 同步转 `+86`。
- 注意：用户上次的验证码凭证已被消费，需重新获取验证码再注册。
- 验证：tsc/lint 干净，`pnpm build` 通过。

### 2026-08-25 密码可见性与传输加密优化

- 新增 `PasswordInput` 组件：密码框右侧小眼睛，可切换明文/密文；已接入登录页、注册页、忘记密码页、登录弹层共 6 处密码输入框。
- 新增密码传输加密（RSA-OAEP 2048 + SHA-256）：
  - `scripts/generate-password-key.mjs`：一键生成密钥对并输出 base64 环境变量。
  - 客户端 `password-crypto-client.ts` 加密，服务端 `password-crypto.ts` 解密；`register`、`reset-password` 接口接收 `passwordEncrypted`。
  - 未配置密钥时非生产环境允许明文（开发便利）；生产环境强制要求加密，否则拒绝。
- 登录链路说明：手机号+密码登录由 Clerk 前端 SDK 直接走 HTTPS，密码不进入我们 API 请求体，因此无需也不应在本侧加密。
- 环境变量：`AUTH_PASSWORD_PRIVATE_KEY_B64`（仅服务端）、`NEXT_PUBLIC_AUTH_PASSWORD_PUBLIC_KEY_B64`（前端），已加入 `env.production.example`。
- 验证：tsc/lint 干净，`pnpm build` 通过。

### 2026-08-25 自测定位注册失败根因（Clerk 实例配置）

- 现象：注册接口仍返回 400；排查本地 `User` 表与 Clerk 均无该手机号，验证码链路正常。
- 自测：直接调用 Clerk `createUser` 捕获真实错误：
  - `phone_number is not a valid parameter for this request`：Clerk 实例未开启手机号认证标识。
  - `unsupported_country_code`：Clerk 实例未开放中国 `+86` 手机号国家。
- 结论：代码链路正常，阻塞点在生产/测试 Clerk Dashboard 配置；注册与重置接口现在会把真实 Clerk 错误透出，便于后续排查。
- 上线前置：Clerk Dashboard → User & Authentication → Email, Phone, Username 开启 Phone；手机号国家允许列表加入 China (+86)；确认密码登录策略开启。

### 2026-08-25 手机号认证改免费方案（Clerk 邮箱标识映射）

- 用户截图确认：Clerk 的 `Sign-up with phone` / `Sign-in with phone` 均为 Pro 付费功能。
- 决策：不购买 Clerk 付费计划，改用“手机号 → 内部邮箱标识”免费方案：
  - 用户界面仍只输入/展示手机号；
  - Clerk 建号与登录标识统一为 `${手机号}@phone.ltbot.top` + 密码；
  - 短信验证码仍走阿里云，不依赖 Clerk SMS。
- 已验证：直接调用 Clerk `createUser({ emailAddress: ['18370971315@phone.ltbot.top'], password })` 成功，并已清理测试用户。
- 代码调整：
  - `register`、`reset-password` 改用 `emailAddress` 建号/查询；
  - 前端登录、注册自动登录、登录弹层标识改用 `clerkEmailFromPhone(phone)`；
  - `syncUserFromClerk` 不再用 Clerk 空 phone 覆盖本地已存手机号。
- Clerk Dashboard 要求：保持 Email + Password 开启即可，无需开通 Phone/Pro，也无需修改手机号国家允许列表。
- 端到端自测（2026-08-25，localhost:3100，mock 短信）：`send-code` 200 → `verify-code` 200 拿到凭证 → `register` 200 成功创建 Clerk 用户 `user_3IOutMeoP02XmetsbD7r8DySdfz`（手机号 `+8618370971315`），赠送 100 积分；该账号可凭手机号 + 密码登录。

### 2026-08-25 用户名方案改造（默认随机用户名 + 中文展示名）

- 用户确认不再映射邮箱，Clerk 已支持 username + password，并要求默认用户名体现应用特色。
- Clerk 实测：中文用户名不被支持（422），因此采用双层设计：
  - Clerk 登录标识：ASCII 随机用户名，格式 `anthony_<id后六位>`（如 `anthony_uxb1q8`）；
  - 用户展示名：`爱讲故事的安东尼<id后六位>`（如 `爱讲故事的安东尼uXB1Q8`），存本地 `User.name` 与 Clerk `firstName`。
- 注册流程：先用临时用户名建号 → 拿到 Clerk userId 后更新为正式用户名 + 中文展示名 → 写本地用户。
- 新增 `POST /api/auth/login-identifier`：按手机号查回用户名；未注册手机号返回随机假标识，避免账号枚举。
- 数据模型：`User.clerkUsername String?`，迁移 `20260825090230_add_user_clerk_username` 已应用。
- 兼容：早期“邮箱标识映射”的存量账号仍可通过邮箱标识登录（`login-identifier` 兜底）。
- 自测（全新 Node 进程）：Prisma 新字段正常；Clerk create temp username → update username/firstName → delete 全流程通过。
- 端到端自测（dev server 重启后）：register 200 创建 `user_3IOwMxNmVPTpNATSya7Lva9kDQX`，用户名 `anthony_a9kdqx`、展示名 `爱讲故事的安东尼a9kDQX`、积分 100；`login-identifier` 正确按手机号返回用户名；测试账号已清理（本地 + Clerk）。
- 细节修正：Clerk 会把 username 规范为小写，注册接口现在以 Clerk 更新后的返回值为准写入本地 `clerkUsername`，避免大小写不一致。

### 2026-08-25 注册成功跳转渲染告警修复

- 现象：注册成功跳转时 React 报 `Cannot update a component (Router) while rendering a different component (Page)`。
- 原因：`signIn.create` 刚完成 Clerk 登录态更新，组件紧接着同步 `setStep('success')` / `router.push`，触发渲染期跨组件更新。
- 修复：注册、忘记密码成功页改为 effect 驱动：成功状态延迟一拍（`setTimeout(0)`）切换，倒计时和 `router.push` 移入 `useEffect`；登录成功跳转同样延迟一拍。
- 验证：lint/tsc 干净，`pnpm build` 通过。

### 2026-08-25 登录跳转与个人中心数据加载修复

- Bug 1：点击登录后不跳转，再次点击报 `session already exists`。
  - 根因：`signIn.create` 返回 `needs_first_factor` 时未执行 `attemptFirstFactor`，且成功后跳转不可靠。
  - 修复：新增 `src/lib/clerk-sign-in.ts`，按官方流程检查 `status`，`needs_first_factor` 时提交密码；登录成功用 `window.location.assign` 整页跳转；已登录/跳转中禁止重复提交。
- Bug 2：登录后“我的信息”页不展示，需手动刷新。
  - 修复：`loadUserInfo` 最多重试 5 次（间隔 800ms），等待本地用户同步完成；整页跳转保证会话与同步在进入页面时就绪。
- 注册自动登录、忘记密码成功跳转统一使用同一套完成函数与整页跳转。
- 验证：lint/tsc 干净（`to-view-mine` 原有告警除外），`pnpm build` 通过。

### 2026-08-25 PRD 评审通过 + 进入开发阶段

- 评审对象：产品经理数字员工产出的《注册机制 PRD v1.0.0》。
- 评审结论：通过，进入开发阶段。PRD 已吸收 v0.5 评审结论（游客模式、锁定策略、逃生通道、存量接口鉴权、任务拆解、验收标准）。
- 开发期三项工程修正（已确认采用，不阻塞开发）：
  1. 登录不走服务端密码接口：手机号 + 密码登录由 Clerk 前端 `useSignIn` 完成，服务端只负责锁定计数与状态查询，避免密码进 API 且会话 Cookie 无法由后端建立。
  2. 账号枚举收敛：登录失败统一返回“手机号或密码错误”，不返回“手机号未注册”，配合限流与防爆破；注册入口作为固定 CTA。
  3. 锁定策略加固：`LoginAttempt` 按 `phone + ip` 维度计数，防止攻击者用他人手机号制造锁定；成功后清零，重置密码后清零。
- 开发计划：`references/development-plan-2026-08-25-phone-auth.md`。

### 2026-08-25 注册机制需求评审（与产品经理数字员工）

- 评审对象：`2026-08-25_注册机制调研与需求方案.md.html`、`2026-08-25_注册登录原型.html`。
- 评审结论：有条件通过。方向正确、成本模型合理，方案与现有 Clerk 账号体系兼容；联网核实 Clerk 后端建号 `phone_number` 默认标记 verified，`signIn.create({ identifier, password })` 官方支持手机号+密码登录，技术可行。
- 达成一致：保留 Clerk 账号/会话/同步/Webhook；自定义登录注册 UI；手机号+密码主登录，验证码仅用于注册与忘记密码；新人 100 积分沿用现有 sync 逻辑；不做邮箱登录与存量迁移（需先导出现有用户确认）。
- P0 工程改造：`User.email` 改可空、新增 `phone @unique`；sync/webhook 兼容无 email 用户，并修复 webhook 与 sync 并发双写导致重复赠送积分；注册自动登录的实现方式需 POC（Clerk createUser + useSignIn）；短信接口防刷（同号 60s、日 5 次、IP 限流）与日志脱敏。
- 待产品确认：游客模式与受保护路由边界；密码错误 5 次锁定由 Clerk 还是自研；生产环境存量用户确认；忘记密码逃生通道。
- 后续动作：产品更新方案至 v0.5 后进入 PRD/开发设计阶段。
- 版本口径说明：评审时需求方案当前版本为 v0.4（她文档状态字段），原型为 v0.3；"更新至 v0.5"是评审后按她自身版本链 v0.1→v0.4 顺延的下一版命名，表示吸收评审结论后的修订版，非强制规则；若产品确认决策后可直接进 PRD，也可不升版本。

### 2026-08-25 熟悉产品经理数字员工

- 认识数字同事：`Nextapp-Product_Manager_Digital_Colleague.skill`，资深产品经理数字员工，只负责 ltbot-nextapp 的需求调研、竞品对标、原型/PRD、体验与交互设计，不直接写代码。
- 她的标准流程：需求澄清（≤5 问）→ 竞品调研与对标 → 用户与场景定义 → 方案设计（信息架构/主流程/原型/PRD）→ 评审与交付；每次沟通后维护自己的需求 HTML 记录与索引。
- 当前产品基线（她已确认）：产品处于上线初期，真实用户量很少，首页“10,000+ 家庭喜爱”是宣传噱头已列为待办；商业化后置，初期不收费不上广告；注册机制主方案为手机号 + 密码登录（保留 Clerk 账号/会话体系，短信走阿里云号码认证），邮箱登录不做、微信快捷登录因企业资质暂不可行。
- 待办交集：注册机制（P0）、产品入口（P0，等运营反馈）、拉新积分与签到（P1）、深度定制化专题（P1）、首页信任感优化。
- 协作方式：她产出 PRD/原型后交给我做技术可行性、数据库/API/安全设计与实现；需求与源码或 agent_doc 冲突时，先核实再与用户确认，不擅自覆盖。
- 相关：`.skills/Nextapp-Product_Manager_Digital_Colleague.skill/`。

### 2026-08-25 角色确认 + 项目摸底 + Skill 创建

- 用户定义数字员工人设：35 岁资深全栈工程师，沉稳开朗、乐于分享、敢说真话。
- 完成 ltbot-nextapp 全量摸底：数据模型、API、异步生成、插画流水线、积分、鉴权、埋点、前端页面。
- 沉淀需求处理七步闭环：澄清、现状调研、方案设计、任务拆解、实现、验证、交付复盘。
- 创建本 Skill：人设、能力、职责、工作流、开发记录协议。
- 建立开发档案双形态：Markdown 源 + 脚本生成的 HTML 档案。
- 决策：开发记录按时间线持续维护并迭代；本 Skill 只服务 ltbot-nextapp，放在项目 `.skills/` 下。
- 相关文件：
  - `.skills/Nextapp-Full-Stack-Development-Engineer-Digital-Colleague.skill/SKILL.md`
  - `.skills/Nextapp-Full-Stack-Development-Engineer-Digital-Colleague.skill/references/project-map.md`
  - `.skills/Nextapp-Full-Stack-Development-Engineer-Digital-Colleague.skill/references/dev-history.md`
  - `.skills/Nextapp-Full-Stack-Development-Engineer-Digital-Colleague.skill/docs/dev-history.html`
  - `.skills/Nextapp-Full-Stack-Development-Engineer-Digital-Colleague.skill/scripts/build_dev_history.py`

## 2. 2026-06 插画流水线

### 2026-06 期间（工作区实现，尚未提交）

- 实现完整插画流水线：start 接口（管理员 Token + Feature Flag + 幂等键）、Provider 适配器（BYTEPLUS/OpenAI 等）、Webhook 验签回调、进度查询、首帧回填封面、状态机收敛（SUCCEEDED/PARTIAL_SUCCESS/FAILED）。
- 故事生成成功后自动触发插画，失败不影响正文主流程。
- 相关：`src/lib/illustration/`、`src/app/api/stories/[id]/illustrations/`、`src/app/api/webhooks/illustrations/`。
- 方案文档：`agent_doc/text-to-image-platform-pre-research.md`、`agent_doc/story-illustration-flow-boundary.md`、`agent_doc/jimeng-text-to-image-integration-guide.md`。

### 2026-06-03 插画任务表迁移

- 新增 `StoryIllustrationJob`、`StoryIllustrationFrame` 模型，迁移 `20260603090132_add_story_illustration_job_table`。
- 相关：`prisma/schema.prisma`。

## 3. 2026-05 快速生成、解锁、埋点与运营

### 2026-05-29 埋点、运营看板与运营指南

- 新增埋点事件与 `OperationEvent` 表，迁移 `20260529031711_add_operation_event_table`。
- 前端埋点功能：页面浏览、故事创建/生成成功失败、TTS 播放、反馈提交。
- 新增运营数据看板接口与管理后台页面。
- 上传运营指南：`agent_doc/ai-sleep-partner-operation-guide.md`。
- 相关：`src/lib/operation-event.ts`、`src/app/api/operation-events/`、`src/app/api/admin/operation-metrics/`。

### 2026-05-27/28 卡片、内测弹框、音乐广场优化

- 故事卡片展示优化；内测弹框提示；音乐广场体验优化。

### 2026-05-26 移动端样式优化 + 关注关系

- 移动端样式优化；新增用户关注关系表，迁移 `20260526000000_add_user_follow_table`。
- 相关：`src/app/api/users/[id]/follow/`、`UserFollow` 模型。

### 2026-05-15 TTS 播放/UI 修复 + 故事解锁

- 修复 TTS 音乐播放、UI 适配等生产问题。
- 故事详情新增积分解锁功能：`POST /api/stories/[id]/unlock`，事务内防重复扣费。
- 相关：`src/app/api/stories/[id]/unlock/route.ts`、详情页解锁状态与广告解锁入口。

### 2026-05-12/13 依赖锁定与 bug 修复

- 锁定依赖版本；修复部分功能 bug。

### 2026-05-08 快速生成故事 + 故事主题

- 优化快速生成路径与故事主题选择。

## 4. 2026-04 首页、主题、听全文与故事 V2

### 2026-04-30 多主题色切换 + 首页样式优化

- 首页改版：Hero/Feature/Personalization/Testimonials/Footer 组件。
- 多主题色切换：ThemeContext + ThemeToggle，CSS 变量换肤，防止首屏闪烁。
- 相关：`src/contexts/ThemeContext.tsx`、`src/app/components/ThemeToggle.tsx`、`src/app/components/home/`。
- 方案文档：`agent_doc/homepage-redesign-plan.md`。

### 2026-04-30 生成故事第二版

- 故事生成 Prompt V2：按年龄组硬约束、世界设定、角色规则、创作约束、风味标签。
- 生成后拆分 `displayText` 与 `ttsScript`，正文展示与朗读互不干扰。
- 相关：`src/app/api/stories/generate-async/route.ts`。

### 2026-04-30 文本语音合成第一版

- Azure TTS 集成：`POST /api/tts`、`useAzureTTS` Hook、VoicePickerModal、AudioPlayerBar。
- 详情页新增“听全文”，支持朗读角色与真实音效，音效缺失自动 WebAudio 兜底。
- 相关：`src/constants/ttsVoices.ts`、`src/lib/tts/storyScript.ts`、`src/hooks/useAzureTTS.ts`、`src/app/api/tts/route.ts`。
- 方案文档：`agent_doc/tts-listen-fulltext-plan.md`。

### 2026-04-29 agent 智能体 demo

- 完成 agent 智能体 demo 验证。

## 5. 2026-03 音乐广场与导航

### 2026-03-05 导航路由更新

- 更新底部导航与路由结构。
- 相关：`src/app/components/BottomNav.tsx`。

### 2026-03-04 音乐广场功能开发

- 开发音乐广场：`to-explore-music` 页面、MusicPlayer 组件、`create-music` 页面骨架。
- 相关：`src/app/to-explore-music/`、`src/app/to-create-music/`。

## 6. 2026-02 文档治理

### 2026-02-02/02-03 项目文档梳理

- 项目文档梳理与命名更新，形成 `agent_doc/` 文档中心。
- 相关：`agent_doc/README.md`、`todo.md`、`api_doc_guide.md`、`question.md`。

## 7. 2026-01 故事生成与互动

### 2026-01-08 故事详情页 + 互动功能

- 故事详情页开发：点赞、评论、收藏。
- 相关：`src/app/to-explore-story/[id]/page.tsx`、`src/app/api/stories/[id]/like|favorite|comments/`。

### 2026-01-07 接入 DeepSeek + 数据库更新

- 数据库更新 + 故事互动模块表结构，迁移 `20260107024350_update_user_story_and_add_interaction_tables`。
- 接入 DeepSeek 生成故事正文，建立故事 CRUD 与生成链路。
- 相关：`src/app/api/stories/`、`src/server/storyServer.ts`。

### 2026-01 期间：异步生成优化（文档记录于 question.md）

- 问题：DeepSeek 同步生成耗时 10-30 秒，用户等待焦虑，关闭页面可能积分损失。
- 方案：`POST /api/stories/generate-async` 立即返回 202，后台生成；状态写入 `extData.generationStatus`；前端 5 秒轮询；重试 3 次（2s/4s/8s）。
- 效果：用户等待从 10-30 秒降到约 1 秒。
- 相关：`src/app/api/stories/generate-async/route.ts`、`StoryCard.tsx`、`StoryListClient.tsx`。

## 8. 2025-12 基建期

### 2025-12-30 Docker 容器部署

- Docker 容器部署：Dockerfile、docker-compose、Nginx 反向代理、域名与 SSL。
- 相关：`Dockerfile`、`docker-compose.yml`、`deploy.sh`、`agent_doc/docker_deployment_guide.md`。

### 2025-12-24 数据模型扩展 + Clerk 认证 + 联调

- 数据库更新：新增故事、音乐、积分模型，迁移 `20251224030320_add_story_music_score_models`。
- 对接 Clerk 身份认证：登录注册页、用户同步、Webhook、middleware。
- 完成前后端联调流程。
- 相关：`src/app/(auth)/`、`src/app/api/users/sync/`、`src/app/api/webhooks/clerk/`、`src/middleware.ts`。

### 2025-12-22 数据库集成 2

- 完善数据模型：用户、故事、积分基础模型。
- 相关：数据库集成 2 提交。

### 2025-12-19 Prisma + SQLite 数据库集成

- Prisma + SQLite 数据库集成，初始化迁移 `20251219081245_init`。
- 相关：`prisma/schema.prisma`、`src/lib/prisma.ts`。

### 2025-12-17 故事创建页面开发

- 开发故事创建页面与基础建设。
- 相关：`src/app/create-story/`。

### 2025-12-12 Tailwind 集成

- 集成 Tailwind CSS，建立响应式断点与设计基础。
- 相关：`tailwind.config.ts`、全局样式。

### 2025-12-11 基础框架搭建

- 搭建 nextapp 基础框架：App Router 结构、基础布局。

### 2025-12-02 项目初始化

- 初始化睡眠空间 nextapp 项目，确定 Next.js + TypeScript 技术路线。
- 相关：项目脚手架、基础配置。

## 9. 附录

### 9.1 当前工作区状态（2026-08-25）

- ltbot-nextapp 存在未提交改动：`prisma/schema.prisma`、`src/app/api/scores/consume/route.ts`、`src/app/api/stories/generate-async/route.ts`、`src/app/api/tts/route.ts`、故事详情页、StoryCard、StoryListClient、`useAzureTTS`、`agent_doc/ai-sleep-partner-operation-guide.md`、`env.production.example` 等。
- 兄弟包（`doc-mcp`、`ltbot-admin`、`ltbot-server`、`ltbot`）也有改动，按用户要求不关注、不纳入本档案范围。
- 规则：改动来自用户或历史工作，开发前先 `git status`，绝不覆盖。

### 9.2 技术债与待办

- 身份鉴权：积分消费/解锁等写接口应改为从 Clerk 会话取 userId，并做资源归属校验。
- middleware 保护面过窄，开发模式跳过校验，生产必须收紧。
- 异步生成任务在进程内，服务重启会丢失正在执行的任务，规划引入 Redis + BullMQ。
- 音乐创作模块仍在开发中。
- 支付系统、积分商城、会员等级、SSE 实时推送按 `todo.md` 规划推进。

### 9.3 记录来源

- git 提交历史（`git log`）
- `agent_doc/todo.md`、`agent_doc/question.md`、`agent_doc/api_doc_guide.md`
- 源码现状与迁移文件

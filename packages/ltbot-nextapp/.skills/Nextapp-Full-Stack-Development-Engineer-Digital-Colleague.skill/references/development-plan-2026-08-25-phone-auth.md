# 手机号 + 密码登录注册 开发计划

> 关联 PRD：`2026-08-25_注册机制PRD.md.html`（v1.0.0）。评审结论：通过。
> 计划版本：M1 计划 1.0。更新：2026-08-25。

## 评审后采用的工程修正

1. 登录不经过服务端密码接口，由 Clerk 前端 `useSignIn` 完成；服务端只提供锁定状态查询与失败计数记录。
2. 登录失败统一提示“手机号或密码错误”，不暴露手机号是否注册，配合限流防枚举。
3. `LoginAttempt` 按 `phone + ip` 维度计数，防他人手机号被恶意锁定。

## 里程碑

### M1 数据模型与认证核心（本期）

- [x] Prisma：`User.phone @unique`、`LoginAttempt`、`SmsSendLog`
- [x] `src/lib/auth/verify-token.ts`：HMAC 短期凭证
- [x] `src/lib/sms.ts`：阿里云短信 + mock 模式 + 频控
- [x] API：`/api/auth/send-code`、`verify-code`、`register`、`reset-password`
- [x] API：`/api/auth/login-status`、`record-login-attempt`
- [x] 自定义 `/sign-in`、`/sign-up`、`/forgot-password` 页面替换 Clerk 预置组件
- [x] sync/Webhook 兼容 phone 主标识 + 积分赠送幂等
- [x] 写接口鉴权修正：stories POST、scores/consume、unlock
- [x] 埋点：注册/登录/找回事件
- [x] build 通过，mock 短信链路验证通过（真实短信/Clerk 建号待 M3）

### M2 前端登录拦截闭环（下一期）

- [x] 登录弹层组件统一替换 `SignInButton mode="modal"`
- [x] 点赞/收藏/评论/关注/生成等写操作触发登录并回原动作
- [x] 中间件受保护路由与游客浏览边界最终化

### M3 上线准备（待阿里云/Clerk 配置）

- [ ] 阿里云实名认证 + 短信认证开通，填写环境变量
- [x] Clerk 免费方案确认：手机号映射内部邮箱标识（`xxx@phone.ltbot.top`）+ 密码；无需开通 Phone/Pro
- [x] Clerk Dashboard 保持 Email + Password 开启；Backend 建号已端到端验证
- [ ] 登录页手机号+密码登录 UI 走查
- [ ] 生产小流量灰度：注册 → 生成故事 → 积分赠送全链路
- [ ] 隐私政策/协议文案更新
- [ ] 文档更新：`agent_doc/api_doc_guide.md`、`question.md`、`todo.md`

## 关键技术决策

- 短信服务：阿里云 `Dypnsapi` SDK；`SMS_MOCK_MODE=true` 时本地用固定验证码 `123456` 走通流程。
- 验证码核验：以阿里云 `Model.VerifyResult === 'PASS'` 为准；核验通过签发 HMAC 签名凭证（5 分钟、绑定 phone+scene、单次有效）。
- 登录锁定：`LoginAttempt(phone+ip)`；连续 10 次错误锁 15 分钟；成功登录或重置密码后清零。
- 账号创建：`clerkClient().users.createUser({ phoneNumber: [phone], password })`，Backend 创建手机号默认已验证。
- 本地用户：`User.email` 可空、新增 `phone @unique`；注册后事务内 upsert 用户 + 积分，防 webhook/sync 双写重复赠送。

## 环境变量（新增）

```env
ALIBABA_ACCESS_KEY_ID=xxx
ALIBABA_ACCESS_KEY_SECRET=xxx
SMS_SIGN_NAME=xxx
SMS_TEMPLATE_CODE=xxx
AUTH_VERIFY_SECRET=xxx
SMS_MOCK_MODE=true
```

> 密钥只存服务端，禁止入库/入前端/入文档。

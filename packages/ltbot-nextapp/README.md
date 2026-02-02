# 📚 LTBot Next.js 项目文档中心

欢迎来到 **AI睡眠空间** 项目文档中心！本文档汇总了项目所有技术文档，方便团队成员快速查阅。

---

## 📖 文档导航

### 🎯 核心开发文档

#### 1. [API 接口文档](./api_doc_guide.md)
**简介**：完整的后端 API 接口文档，包含所有接口的请求参数、响应格式和使用示例。

**主要内容**：
- 故事相关接口（CRUD操作）
- 积分相关接口（充值、消费、查询）
- 接口安全建议
- 交易类型说明
- 后续功能规划

**适用人群**：前端开发、后端开发、API 调用者

**更新时间**：2025-12-24

---

#### 2. [API 响应格式指南](./api_response_guide.md)
**简介**：定义了项目统一的 API 响应格式规范，确保前后端接口通信的一致性。

**主要内容**：
- 统一响应格式定义
- 成功/错误响应示例
- 响应工具函数使用方法
- 状态码说明（200、201、400、401、403、404、500）
- Prisma 错误处理
- 最佳实践

**适用人群**：全栈开发、API 设计者

**更新时间**：2025-12-22

---

### 🐛 问题解决方案

#### 3. [问题解决方案汇总](./question.md)
**简介**：记录项目开发过程中遇到的重要问题及其解决方案，包含完整的实施步骤和技术细节。

**已收录问题**：

##### 问题 1：异步故事生成功能（2026-01-06）
- **问题描述**：DeepSeek API 调用耗时10-30秒，用户体验差
- **解决方案**：实现异步生成 + 后台处理 + 前端轮询
- **优化效果**：用户等待时间从10-30秒降至<1秒
- **涉及文件**：
  - `src/app/create-story/page.tsx`
  - `src/app/api/stories/generate-async/route.ts`
  - `src/app/to-explore-story/components/StoryCard.tsx`
  - `src/app/to-explore-story/components/StoryListClient.tsx`

##### 问题 2：移动端 BottomNav 适配方案（2026-01）
- **问题描述**：移动端底部导航遮挡页面内容
- **解决方案**：创建 `useDevice` Hook，动态调整底部留白
- **涉及文件**：
  - `src/hooks/useDevice.ts`
  - `src/app/to-explore-story/[id]/page.tsx`
  - `src/app/to-view-mine/page.tsx`
  - `src/app/to-explore-story/components/PageWrapper.tsx`

**适用人群**：全体开发人员、问题排查者

**更新时间**：2026-01-06

---

### 🚀 部署运维文档

#### 4. [Docker 部署完整教程](./DOCKER_DEPLOYMENT_GUIDE.md)
**简介**：从零开始的 Docker 容器化部署教程，适合运维小白，包含宝塔面板配置、域名解析、SSL 证书等全流程。

**主要内容**：
- 部署架构图解
- 服务器环境搭建（宝塔面板、Docker、Docker Compose）
- 项目配置（环境变量、数据库）
- Docker 镜像构建与启动
- Nginx 反向代理配置
- 域名与 SSL 证书配置
- 常用运维操作（重启、更新、日志查看）
- 故障排查指南
- 数据库备份与恢复
- 性能监控与安全加固

**生产环境**：
- 域名：http://space.ltbot.top
- 端口：3100

**适用人群**：运维人员、部署实施者

**更新时间**：2025-12-25

---

### 🎨 样式与配置文档

#### 5. [Tailwind CSS 使用指南](./tailwind-guide.md)
**简介**：完整的 Tailwind CSS 响应式开发指南，涵盖移动端、平板、桌面的最佳实践。

**主要内容**：
- 响应式设计断点（xs/sm/md/lg/xl/2xl）
- 移动优先策略
- 常用布局模式（网格、Flex、居中、侧边栏）
- 自定义颜色系统（Primary/Secondary/Accent）
- 字体和排版规范
- 间距规范（Padding/Margin）
- 组件开发规范（按钮、卡片、表单、导航栏）
- 性能优化建议
- 常见问题解决（移动端点击延迟、横向滚动、安全区域适配）
- 完整的响应式卡片组件示例
- 调试技巧

**适用人群**：前端开发、UI 开发

**更新时间**：2024-12

---

#### 6. [项目配置指南](./configuration-guide.md)
**简介**：详细说明项目的 Tailwind 配置、全局样式和各种工具类的使用方法。

**主要内容**：
- Tailwind 配置详解（断点、颜色、间距、字体、圆角、动画、阴影）
- 全局样式详解（CSS 变量、预设组件类、工具类）
- 按钮类（btn-primary、btn-secondary、btn-base）
- 卡片类（card）
- 输入框类（input）
- 文字渐变（text-gradient-primary、text-gradient-accent）
- 背景渐变（bg-gradient-primary、bg-gradient-soft、bg-gradient-header）
- 安全区域适配（safe-top、safe-bottom）
- 响应式容器（container-responsive）
- 实际应用示例（页面布局、自定义组件、表单组件）
- 微信小程序特殊适配
- 性能优化建议
- 调试工具

**适用人群**：前端开发、配置维护者

**更新时间**：2024-12

---

### 📋 项目管理文档

#### 7. [项目功能开发计划](./todo.md)
**简介**：记录项目已完成的功能和未来计划开发的功能，包含详细的开发时间、所属模块等信息。

**主要内容**：
- 已完成功能清单（用户认证、故事创作、积分系统、UI优化、部署配置）
- 计划中功能清单（音乐创作、故事互动、实时推送、消息队列）
- 技术优化计划（性能优化、安全加固）

**适用人群**：项目经理、全体开发人员

**更新时间**：2026-02-02

---

## 🏗️ 项目技术栈

### 前端技术
- **框架**：Next.js 16.0.5（App Router）
- **UI 库**：React 18
- **样式**：Tailwind CSS 3.x
- **语言**：TypeScript 5.x
- **状态管理**：React Hooks
- **HTTP 请求**：Fetch API / Axios

### 后端技术
- **运行时**：Node.js 22.14.0
- **框架**：Next.js API Routes
- **ORM**：Prisma 5.x
- **数据库**：SQLite（开发）/ PostgreSQL（生产可选）
- **认证**：Clerk（第三方认证服务）
- **AI 服务**：DeepSeek API

### 部署技术
- **容器化**：Docker + Docker Compose
- **Web 服务器**：Nginx（反向代理）
- **服务器管理**：宝塔面板
- **SSL 证书**：Let's Encrypt

---

## 📂 项目结构

```
ltbot-nextapp/
├── src/
│   ├── app/                          # App Router 目录
│   │   ├── (auth)/                   # 认证相关页面
│   │   │   ├── sign-in/              # 登录页
│   │   │   └── sign-up/              # 注册页
│   │   ├── api/                      # API 路由
│   │   │   ├── stories/              # 故事相关接口
│   │   │   ├── scores/               # 积分相关接口
│   │   │   ├── users/                # 用户相关接口
│   │   │   └── webhooks/             # Webhook 接口
│   │   ├── components/               # 全局组件
│   │   │   ├── Header.tsx            # 顶部导航
│   │   │   ├── BottomNav.tsx         # 底部导航（移动端）
│   │   │   └── UserSyncProvider.tsx  # 用户同步组件
│   │   ├── create-story/             # 创作故事页面
│   │   ├── to-explore-story/         # 探索故事页面
│   │   │   ├── [id]/                 # 故事详情页
│   │   │   └── components/           # 故事相关组件
│   │   ├── create-music/             # 创作音乐页面（开发中）
│   │   ├── to-music-square/          # 音乐广场页面（开发中）
│   │   ├── to-view-mine/             # 个人中心页面
│   │   ├── layout.tsx                # 根布局
│   │   ├── globals.css               # 全局样式
│   │   └── page.tsx                  # 首页
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── useDevice.ts              # 设备检测 Hook
│   │   └── useUserSync.ts            # 用户同步 Hook
│   ├── lib/                          # 工具库
│   │   ├── prisma.ts                 # Prisma 客户端
│   │   ├── response.ts               # API 响应工具
│   │   └── request.ts                # HTTP 请求工具
│   ├── constants/                    # 常量定义
│   │   └── index.ts                  # 菜单列表、主题列表等
│   └── middleware.ts                 # 中间件（Clerk 认证）
├── prisma/                           # Prisma 相关
│   ├── schema.prisma                 # 数据库模型定义
│   └── migrations/                   # 数据库迁移文件
├── public/                           # 静态资源
├── markdown/                         # 项目文档
├── data/                             # SQLite 数据库文件
├── logs/                             # 日志文件
├── .env.production                   # 生产环境变量
├── .env.local                        # 本地环境变量
├── docker-compose.yml                # Docker Compose 配置
├── Dockerfile                        # Docker 镜像配置
├── next.config.ts                    # Next.js 配置
├── tailwind.config.ts                # Tailwind CSS 配置
├── tsconfig.json                     # TypeScript 配置
└── package.json                      # 项目依赖
```

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装 Node.js 22.14.0+
node -v

# 安装 pnpm（推荐）
npm install -g pnpm
```

### 2. 克隆项目

```bash
git clone https://your-git-repo-url.git ltbot-nextapp
cd ltbot-nextapp
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 配置环境变量

创建 `.env.local` 文件：

```env
# 数据库配置
DATABASE_URL=file:./data/dev.db

# Clerk 认证配置
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat

# 应用配置
NODE_ENV=development
PORT=3000
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. 初始化数据库

```bash
# 执行数据库迁移
pnpm prisma migrate dev

# 生成 Prisma Client
pnpm prisma generate
```

### 6. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

---

## 📊 核心功能模块

### 1. 用户认证系统
- ✅ Clerk 第三方认证集成
- ✅ 登录/注册页面
- ✅ 用户信息自动同步到数据库
- ✅ Webhook 自动创建用户
- ✅ 中间件路由保护

### 2. 故事创作模块
- ✅ 故事列表查询（支持分页、筛选）
- ✅ 故事创建（年龄组、主题类型、人物设定）
- ✅ 故事详情查看
- ✅ 异步故事生成（DeepSeek API）
- ✅ 故事生成状态管理（pending/generating/completed/failed）
- ✅ 前端轮询自动刷新
- ⏳ 故事点赞功能（数据库已就绪）
- ⏳ 故事收藏功能（数据库已就绪）
- ⏳ 故事评论功能（数据库已就绪）

### 3. 积分系统
- ✅ 积分充值接口
- ✅ 积分消费接口
- ✅ 积分余额查询
- ✅ 积分交易记录
- ✅ 事务处理确保数据一致性
- ⏳ 支付系统集成（待开发）
- ⏳ 积分商城（待规划）

### 4. 音乐创作模块
- ⏳ 音乐创作页面（页面已创建，功能待开发）
- ⏳ 音乐生成 API
- ⏳ 音乐列表查询
- ⏳ 音乐广场

### 5. UI/UX 优化
- ✅ Tailwind CSS 响应式设计
- ✅ 移动端底部导航适配
- ✅ 故事卡片组件
- ✅ 加载状态动画
- ✅ 生成状态可视化

---

## 🔧 常用命令

### 开发相关

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint
```

### 数据库相关

```bash
# 创建迁移
pnpm prisma migrate dev --name migration_name

# 应用迁移（生产环境）
pnpm prisma migrate deploy

# 重置数据库
pnpm prisma migrate reset

# 打开 Prisma Studio（数据库可视化工具）
pnpm prisma studio

# 生成 Prisma Client
pnpm prisma generate
```

### Docker 相关

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 停止容器
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 进入容器
docker exec -it ltbot-nextapp sh
```

---

## 📝 开发规范

### 代码规范

1. **TypeScript**：所有新代码必须使用 TypeScript
2. **组件命名**：使用 PascalCase（如 `CreateStory.tsx`）
3. **文件命名**：组件文件使用 PascalCase，工具文件使用 camelCase
4. **API 路由**：使用 RESTful 风格
5. **响应格式**：统一使用 `response.ts` 中的工具函数

### Git 提交规范

```bash
# 功能开发
feat: 添加故事收藏功能

# Bug 修复
fix: 修复积分扣除重复问题

# 文档更新
docs: 更新 API 接口文档

# 样式调整
style: 优化移动端布局

# 代码重构
refactor: 重构故事生成逻辑

# 性能优化
perf: 优化故事列表查询性能

# 测试相关
test: 添加积分系统单元测试

# 构建相关
build: 更新 Docker 配置

# 配置相关
config: 更新 Tailwind 配置
```

### API 开发规范

1. 统一使用 `response.ts` 中的响应工具函数
2. 所有接口必须进行参数验证
3. 错误必须使用 try-catch 捕获
4. 数据库操作涉及多步骤时必须使用事务
5. 敏感操作需要添加身份验证

---

## 🔐 环境变量说明

### 必需环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接URL | `file:./data/dev.db` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 公开密钥 | `pk_test_xxx` |
| `CLERK_SECRET_KEY` | Clerk 密钥 | `sk_test_xxx` |

### 可选环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | - |
| `DEEPSEEK_API_URL` | DeepSeek API 地址 | `https://api.deepseek.com/v1/chat/completions` |
| `DEEPSEEK_MODEL` | DeepSeek 模型名称 | `deepseek-chat` |
| `PORT` | 应用端口 | `3000` |
| `NEXT_TELEMETRY_DISABLED` | 禁用遥测 | `1` |

---

## 🐛 常见问题

### 1. 数据库连接失败

**问题**：`Error: SQLITE_CANTOPEN: unable to open database file`

**解决方案**：
```bash
# 创建数据目录
mkdir -p data

# 重新执行迁移
pnpm prisma migrate dev
```

### 2. Prisma Client 未生成

**问题**：`Cannot find module '@prisma/client'`

**解决方案**：
```bash
pnpm prisma generate
```

### 3. 端口被占用

**问题**：`Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀掉进程
kill -9 <PID>

# 或修改 .env.local 中的 PORT
```

### 4. Docker 容器无法启动

**问题**：容器启动后立即退出

**解决方案**：
```bash
# 查看日志
docker-compose logs ltbot-nextapp

# 检查环境变量
cat .env.production

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 技术支持

### 获取帮助

1. **查阅文档**：优先查看本文档中心的相关文档
2. **查看问题汇总**：[问题解决方案汇总](./question.md)
3. **查看 API 文档**：[API 接口文档](./api_doc_guide.md)
4. **联系开发团队**：提交 Issue 或联系项目负责人

### 相关资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [Tailwind CSS 官方文档](https://tailwindcss.com/docs)
- [Prisma 官方文档](https://www.prisma.io/docs)
- [Clerk 官方文档](https://clerk.com/docs)
- [Docker 官方文档](https://docs.docker.com/)

---

## 📄 文档维护

### 更新规范

1. 所有新功能开发完成后，必须更新相关文档
2. 遇到新问题并解决后，及时记录到 [问题解决方案汇总](./question.md)
3. API 接口变更必须同步更新 [API 接口文档](./api_doc_guide.md)
4. 新增功能必须更新 [项目功能开发计划](./todo.md)
5. 文档更新后，需在文档底部更新"最后更新时间"

### 文档目录

```
markdown/
├── README.md                        # 本文档（文档中心首页）
├── api_doc_guide.md                 # API 接口文档
├── API_RESPONSE_GUIDE.md            # API 响应格式指南
├── question.md                      # 问题解决方案汇总
├── todo.md                          # 项目功能开发计划
├── DOCKER_DEPLOYMENT_GUIDE.md       # Docker 部署教程
├── configuration-guide.md           # 项目配置指南
└── tailwind-guide.md                # Tailwind CSS 使用指南
```

---

## 🎉 贡献指南

欢迎团队成员为项目贡献代码和文档！

### 贡献流程

1. 从 main 分支创建功能分支
2. 开发功能并提交代码
3. 更新相关文档
4. 提交 Pull Request
5. 代码审查通过后合并

### 提交前检查清单

- [ ] 代码已通过 Lint 检查
- [ ] 已更新相关 API 文档
- [ ] 已更新功能开发计划（todo.md）
- [ ] 提交信息符合规范
- [ ] 已在本地测试通过

---

## 📊 项目统计

**最后更新时间**：2026-02-02

**项目版本**：v0.2.0

**文档版本**：v2.0.0

**团队成员**：AI睡眠空间开发团队

---

**感谢使用 LTBot Next.js 项目！** 🚀

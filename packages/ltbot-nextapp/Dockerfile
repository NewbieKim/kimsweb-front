# ==========================================
# 第一阶段：依赖安装
# ==========================================
FROM node:22.14.0-alpine AS deps

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# 安装依赖（包括生产和开发依赖，因为构建时需要）
RUN pnpm install

# 生成 Prisma Client（确保生成成功）
RUN npx prisma generate

# 验证 Prisma Client 是否生成（调试用）
RUN ls -la node_modules/.prisma/ || echo "Prisma client directory not found"

# ==========================================
# 第二阶段：构建应用
# ==========================================
FROM node:22.14.0-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 先复制源代码（.dockerignore 会排除 node_modules）
COPY . .

# 再从 deps 阶段复制 node_modules（这样不会被覆盖）
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# 设置构建时环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"

# 构建应用
RUN pnpm run build

# ==========================================
# 第三阶段：生产运行
# ==========================================
FROM node:22.14.0-alpine AS runner

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 设置为生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma 相关文件
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
# COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 创建数据库目录并设置权限
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3100

# 设置环境变量
ENV PORT=3100
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]


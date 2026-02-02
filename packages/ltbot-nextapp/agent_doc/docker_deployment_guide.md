# 🐳 LTBot Next.js 应用 Docker 部署完整教程

> 适用于运维小白的详细部署指南  
> 生产域名：http://space.ltbot.top/  
> 应用端口：3100

---

## 📋 目录

- [部署架构](#部署架构)
- [前置准备](#前置准备)
- [服务器环境搭建](#服务器环境搭建)
- [项目配置](#项目配置)
- [Docker 镜像构建](#docker-镜像构建)
- [数据库初始化](#数据库初始化)
- [启动应用](#启动应用)
- [宝塔面板配置](#宝塔面板配置)
- [域名配置](#域名配置)
- [SSL 证书配置](#ssl-证书配置)
- [常用运维操作](#常用运维操作)
- [故障排查](#故障排查)
- [备份与恢复](#备份与恢复)

---

## 🏗️ 部署架构

```
┌─────────────────────────────────────────────────────┐
│                   外网访问                           │
│            http://space.ltbot.top                   │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              Nginx (宝塔面板管理)                    │
│              - 反向代理                              │
│              - SSL 证书                              │
│              - 域名绑定                              │
└──────────────────┬──────────────────────────────────┘
                   │ 端口 3100
                   ▼
┌─────────────────────────────────────────────────────┐
│          Docker Container                           │
│     ┌───────────────────────────────┐              │
│     │   Next.js Application         │              │
│     │   - Node.js 22.14.0           │              │
│     │   - Next.js 16.0.5            │              │
│     │   - Prisma ORM                │              │
│     └───────────────────────────────┘              │
│                     │                                │
│                     ▼                                │
│     ┌───────────────────────────────┐              │
│     │   SQLite Database             │              │
│     │   (挂载到宿主机)               │              │
│     └───────────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

**架构说明：**
- **Nginx**：作为反向代理服务器，处理域名解析和 SSL
- **Docker**：容器化部署，隔离环境，便于管理
- **SQLite**：轻量级数据库，数据文件挂载到宿主机保证持久化
- **宝塔面板**：简化服务器管理，可视化操作

---

## 🔧 前置准备

### 1. 服务器要求

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 1核 | 2核+ |
| 内存 | 1GB | 2GB+ |
| 硬盘 | 20GB | 40GB+ |
| 系统 | CentOS 7+ / Ubuntu 18.04+ | Ubuntu 20.04+ |
| 带宽 | 1Mbps | 5Mbps+ |

### 2. 必需软件清单

- ✅ 宝塔面板 7.x+
- ✅ Docker 20.10+
- ✅ Docker Compose 2.0+
- ✅ Git

### 3. 获取必要信息

在开始部署前，请准备以下信息：

```bash
# 服务器信息
服务器 IP：_______________
SSH 端口：_______________
SSH 用户：_______________

# Clerk 认证信息（从 https://dashboard.clerk.com/ 获取）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY：pk_test_______________
CLERK_SECRET_KEY：sk_test_______________

# 域名信息
域名：space.ltbot.top
DNS 已解析：□ 是 □ 否
```

---

## 🖥️ 服务器环境搭建

### 第一步：安装宝塔面板

#### 1.1 连接服务器

使用 SSH 工具（如 Xshell、PuTTY）连接服务器：

```bash
ssh root@你的服务器IP
```

#### 1.2 安装宝塔面板

**CentOS 系统：**
```bash
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec
```

**Ubuntu 系统：**
```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484bec
```

安装完成后，会显示：
```
==================================================================
Congratulations! Installed successfully!
==================================================================
外网面板地址: http://你的IP:8888/xxxxxxxxx
内网面板地址: http://内网IP:8888/xxxxxxxxx
username: xxxxxxxx
password: xxxxxxxx
==================================================================
```

**⚠️ 重要：请立即记录以上信息！**

#### 1.3 登录宝塔面板

1. 浏览器访问：`http://你的服务器IP:8888/xxxxxxxxx`
2. 输入用户名和密码登录
3. 首次登录会提示安装推荐软件，暂时跳过

### 第二步：安装 Docker

#### 2.1 使用宝塔面板安装

1. 进入宝塔面板
2. 点击左侧 **"软件商店"**
3. 搜索 **"Docker"**
4. 点击 **"安装"**
5. 等待安装完成（约 5-10 分钟）

#### 2.2 手动安装（如果宝塔安装失败）

**CentOS：**
```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker

# 启动 Docker
systemctl start docker
systemctl enable docker

# 验证安装
docker --version
```

**Ubuntu：**
```bash
# 更新包索引
sudo apt-get update

# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

#### 2.3 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

**预期输出：**
```
Docker Compose version v2.x.x
```

### 第三步：配置 Docker（可选但推荐）

#### 3.1 配置 Docker 镜像加速

编辑 Docker 配置文件：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## 📦 项目配置

### 第一步：上传项目代码

#### 方法一：使用 Git（推荐）

```bash
# 安装 Git（如果未安装）
yum install -y git        # CentOS
# 或
sudo apt-get install git  # Ubuntu

# 进入项目目录
cd /www/wwwroot

# 克隆项目
git clone https://your-git-repo-url.git ltbot-nextapp

# 进入项目目录
cd ltbot-nextapp
```

#### 方法二：使用宝塔面板上传

1. 在宝塔面板点击 **"文件"**
2. 进入 `/www/wwwroot` 目录
3. 点击 **"上传"**
4. 将项目打包为 zip 文件上传
5. 解压缩文件

### 第二步：配置环境变量

#### 2.1 创建环境变量文件

在项目根目录创建 `.env.production` 文件：

```bash
cd /www/wwwroot/ltbot-nextapp

# 使用 vim 编辑器创建文件
vim .env.production
```

按 `i` 进入编辑模式，粘贴以下内容：

```env
# ==========================================
# 数据库配置
# ==========================================
DATABASE_URL=file:/app/data/production.db

# ==========================================
# Clerk 认证配置
# ==========================================
# 从 Clerk Dashboard 获取这些密钥
# https://dashboard.clerk.com/

# 公开密钥（前端可见）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_你的公开密钥

# 密钥（服务端使用，需保密）
CLERK_SECRET_KEY=sk_test_你的密钥

# 登录页面路径
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# 登录后跳转路径
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# ==========================================
# 应用配置
# ==========================================
NODE_ENV=production
PORT=3100
NEXT_TELEMETRY_DISABLED=1

# 应用域名
NEXT_PUBLIC_APP_URL=http://space.ltbot.top
```

按 `Esc` 键，输入 `:wq` 保存并退出。

#### 2.2 设置文件权限

```bash
# 设置环境变量文件权限（仅所有者可读写）
chmod 600 .env.production
```

### 第三步：检查配置文件

确保以下文件存在：

```bash
# 检查文件列表
ls -la

# 应该看到以下文件：
# - Dockerfile
# - docker-compose.yml
# - .dockerignore
# - .env.production
# - next.config.ts
# - prisma/schema.prisma
```

---

## 🔨 Docker 镜像构建

### 第一步：构建镜像

在项目根目录执行：

```bash
cd /www/wwwroot/ltbot-nextapp

# 构建 Docker 镜像（第一次可能需要 10-20 分钟）
docker-compose build
```

**构建过程说明：**
```
[+] Building 456.7s (18/18) FINISHED
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 2.15kB
 => [internal] load .dockerignore
 => => transferring context: 123B
 => [internal] load metadata for docker.io/library/node:22.14.0-alpine
 => [deps 1/5] FROM docker.io/library/node:22.14.0-alpine
 => [deps 2/5] WORKDIR /app
 => [deps 3/5] COPY package.json pnpm-lock.yaml ./
 => [deps 4/5] COPY prisma ./prisma/
 => [deps 5/5] RUN pnpm install --frozen-lockfile
 => [builder 1/4] WORKDIR /app
 => [builder 2/4] COPY --from=deps /app/node_modules ./node_modules
 => [builder 3/4] COPY . .
 => [builder 4/4] RUN pnpm run build
 => [runner 1/7] WORKDIR /app
 => [runner 2/7] RUN addgroup --system --gid 1001 nodejs
 => [runner 3/7] RUN adduser --system --uid 1001 nextjs
 => [runner 4/7] COPY --from=builder /app/public ./public
 => [runner 5/7] COPY --from=builder /app/package.json ./package.json
 => [runner 6/7] COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
 => [runner 7/7] COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
 => exporting to image
 => => writing image sha256:xxxxxxxxxxxxx
 => => naming to docker.io/library/ltbot-nextapp:latest
```

### 第二步：验证镜像

```bash
# 查看已构建的镜像
docker images

# 应该看到类似输出：
# REPOSITORY        TAG       IMAGE ID       CREATED          SIZE
# ltbot-nextapp     latest    xxxxxxxxxxxx   2 minutes ago    450MB
```

---

## 💾 数据库初始化

### 第一步：创建数据目录

```bash
# 在项目根目录创建数据目录
cd /www/wwwroot/ltbot-nextapp
mkdir -p data logs

# 设置目录权限
chmod 755 data logs
```

### 第二步：初始化数据库

#### 方法一：使用临时容器初始化

```bash
# 启动临时容器进行数据库迁移
docker-compose run --rm ltbot-nextapp sh -c "npx prisma migrate deploy"
```

#### 方法二：手动初始化

```bash
# 进入容器
docker-compose run --rm ltbot-nextapp sh

# 在容器内执行
npx prisma migrate deploy
npx prisma generate

# 退出容器
exit
```

**预期输出：**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "production.db" at "file:/app/data/production.db"

20251219081245_init: 
  Applied successfully

20251224030320_add_story_music_score_models:
  Applied successfully

All migrations have been successfully applied.
```

### 第三步：验证数据库

```bash
# 检查数据库文件是否已创建
ls -lh data/

# 应该看到：
# -rw-r--r-- 1 1001 1001 20K production.db
```

---

## 🚀 启动应用

### 第一步：启动容器

```bash
cd /www/wwwroot/ltbot-nextapp

# 后台启动容器
docker-compose up -d
```

**预期输出：**
```
[+] Running 2/2
 ✔ Network ltbot-nextapp_ltbot-network  Created     0.1s
 ✔ Container ltbot-nextapp              Started     0.5s
```

### 第二步：查看容器状态

```bash
# 查看运行中的容器
docker-compose ps

# 应该看到：
# NAME              COMMAND                  SERVICE           STATUS        PORTS
# ltbot-nextapp     "node server.js"         ltbot-nextapp     running       0.0.0.0:3100->3100/tcp
```

### 第三步：查看日志

```bash
# 查看实时日志
docker-compose logs -f

# 或查看最近 100 行日志
docker-compose logs --tail=100
```

**成功启动的日志示例：**
```
ltbot-nextapp  | Listening on port 3100 url: http://0.0.0.0:3100
ltbot-nextapp  | ▲ Next.js 16.0.5
ltbot-nextapp  | - Local:        http://localhost:3100
ltbot-nextapp  | - Network:      http://0.0.0.0:3100
ltbot-nextapp  | ✓ Ready in 1.2s
```

### 第四步：测试访问

```bash
# 在服务器上测试
curl http://localhost:3100

# 应该返回 HTML 内容
```

---

## 🎛️ 宝塔面板配置

### 第一步：添加站点

1. 登录宝塔面板
2. 点击左侧 **"网站"**
3. 点击 **"添加站点"**

填写以下信息：
```
域名：space.ltbot.top
根目录：/www/wwwroot/ltbot-nextapp
FTP：不创建
数据库：不创建
PHP版本：纯静态
```

4. 点击 **"提交"**

### 第二步：配置反向代理

1. 在网站列表中找到 `space.ltbot.top`
2. 点击 **"设置"**
3. 选择 **"反向代理"** 标签
4. 点击 **"添加反向代理"**

填写以下信息：
```
代理名称：ltbot-nextapp
目标URL：http://127.0.0.1:3100
发送域名：$host
```

5. 点击 **"保存"**

### 第三步：配置反向代理高级设置

在反向代理配置文件中添加以下内容：

点击 **"配置文件"**，在 `location` 块中添加：

```nginx
location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # 超时设置
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    
    # 缓冲设置
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
}

# 静态资源缓存
location /_next/static/ {
    proxy_pass http://127.0.0.1:3100;
    proxy_cache_valid 200 365d;
    add_header Cache-Control "public, immutable";
}

# 健康检查
location /api/health {
    proxy_pass http://127.0.0.1:3100;
    access_log off;
}
```

点击 **"保存"**。

---

## 🌐 域名配置

### 第一步：DNS 解析设置

登录您的域名服务商（如阿里云、腾讯云、Cloudflare）：

1. 进入 DNS 解析管理
2. 添加 A 记录：

```
记录类型：A
主机记录：space.ltbot.top 或 @（如果是顶级域名）
记录值：你的服务器IP地址
TTL：600（10分钟）
```

3. 保存设置

### 第二步：验证 DNS 解析

```bash
# 在本地电脑执行
ping space.ltbot.top

# 或使用 nslookup
nslookup space.ltbot.top
```

如果返回正确的服务器 IP，说明解析成功。

**⚠️ 注意：DNS 解析生效可能需要 10 分钟到 48 小时不等。**

### 第三步：测试访问

在浏览器中访问：`http://space.ltbot.top`

如果能正常访问，说明配置成功！

---

## 🔒 SSL 证书配置（可选但强烈推荐）

### 使用宝塔面板自动申请免费 SSL

1. 在宝塔面板中找到 `space.ltbot.top` 站点
2. 点击 **"设置"**
3. 选择 **"SSL"** 标签
4. 选择 **"Let's Encrypt"**
5. 勾选域名 `space.ltbot.top`
6. 点击 **"申请"**

申请成功后：
- 勾选 **"强制HTTPS"**
- 证书会自动续期

现在可以通过 HTTPS 访问：`https://space.ltbot.top`

---

## 🔧 常用运维操作

### 查看容器状态

```bash
# 查看所有容器
docker ps -a

# 查看容器详细信息
docker inspect ltbot-nextapp

# 查看容器资源使用情况
docker stats ltbot-nextapp
```

### 查看日志

```bash
# 实时查看日志
docker-compose logs -f ltbot-nextapp

# 查看最近 100 行日志
docker-compose logs --tail=100 ltbot-nextapp

# 导出日志到文件
docker-compose logs > ltbot-app.log
```

### 重启应用

```bash
cd /www/wwwroot/ltbot-nextapp

# 重启容器
docker-compose restart

# 或者停止后重新启动
docker-compose down
docker-compose up -d
```

### 更新应用

```bash
cd /www/wwwroot/ltbot-nextapp

# 1. 拉取最新代码
git pull

# 2. 停止容器
docker-compose down

# 3. 重新构建镜像
docker-compose build

# 4. 启动容器
docker-compose up -d

# 5. 查看日志确认启动成功
docker-compose logs -f
```

### 进入容器

```bash
# 进入运行中的容器
docker exec -it ltbot-nextapp sh

# 在容器内可以执行各种命令
# 例如：查看文件、运行脚本等

# 退出容器
exit
```

### 清理 Docker 资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理所有未使用的资源（谨慎使用）
docker system prune -a
```

---

## 🐛 故障排查

### 问题 1：容器无法启动

**症状：**
```bash
docker-compose up -d
# 容器启动后立即退出
```

**排查步骤：**

```bash
# 1. 查看容器日志
docker-compose logs ltbot-nextapp

# 2. 查看容器退出状态
docker ps -a | grep ltbot-nextapp

# 3. 尝试交互式启动
docker-compose run --rm ltbot-nextapp sh
```

**常见原因：**
- 环境变量配置错误
- 数据库文件权限问题
- 端口被占用

**解决方案：**
```bash
# 检查端口占用
netstat -tulnp | grep 3100

# 如果端口被占用，杀掉进程
kill -9 进程ID

# 或修改 docker-compose.yml 中的端口映射
```

### 问题 2：数据库连接失败

**症状：**
日志中出现 `Error: SQLITE_CANTOPEN: unable to open database file`

**解决方案：**

```bash
# 1. 检查数据目录权限
ls -ld /www/wwwroot/ltbot-nextapp/data
chmod 755 /www/wwwroot/ltbot-nextapp/data

# 2. 检查数据库文件权限
ls -l /www/wwwroot/ltbot-nextapp/data/production.db
chmod 644 /www/wwwroot/ltbot-nextapp/data/production.db

# 3. 重新初始化数据库
docker-compose run --rm ltbot-nextapp npx prisma migrate deploy

# 4. 重启容器
docker-compose restart
```

### 问题 3：域名无法访问

**排查步骤：**

```bash
# 1. 检查 DNS 解析
ping space.ltbot.top

# 2. 检查容器是否运行
docker ps | grep ltbot-nextapp

# 3. 检查端口是否监听
netstat -tulnp | grep 3100

# 4. 检查宝塔防火墙
# 在宝塔面板 -> 安全 -> 确保 3100 端口已放行

# 5. 检查服务器防火墙
firewall-cmd --list-ports  # CentOS
ufw status                 # Ubuntu

# 6. 测试本地访问
curl http://localhost:3100
```

### 问题 4：Prisma Client 未生成

**症状：**
日志中出现 `Cannot find module '@prisma/client'`

**解决方案：**

```bash
# 进入容器
docker exec -it ltbot-nextapp sh

# 重新生成 Prisma Client
npx prisma generate

# 退出并重启容器
exit
docker-compose restart
```

### 问题 5：内存不足

**症状：**
容器频繁重启，日志显示 `JavaScript heap out of memory`

**解决方案：**

编辑 `docker-compose.yml`，添加内存限制：

```yaml
services:
  ltbot-nextapp:
    # ... 其他配置
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

重新启动：
```bash
docker-compose down
docker-compose up -d
```

---

## 💾 备份与恢复

### 数据库备份

#### 自动备份脚本

创建备份脚本 `/root/backup-ltbot.sh`：

```bash
#!/bin/bash

# 配置
BACKUP_DIR="/root/backups/ltbot"
PROJECT_DIR="/www/wwwroot/ltbot-nextapp"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "开始备份数据库..."
cp $PROJECT_DIR/data/production.db $BACKUP_DIR/production_${DATE}.db

# 压缩备份文件
gzip $BACKUP_DIR/production_${DATE}.db

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.db.gz" -mtime +$KEEP_DAYS -delete

echo "备份完成: production_${DATE}.db.gz"
```

设置执行权限：
```bash
chmod +x /root/backup-ltbot.sh
```

#### 配置定时任务

使用宝塔面板或 crontab 配置定时备份：

**方法一：宝塔面板**
1. 点击 **"计划任务"**
2. 选择 **"Shell脚本"**
3. 任务名称：`LTBot 数据库备份`
4. 执行周期：`每天` `03:00`
5. 脚本内容：`/root/backup-ltbot.sh`

**方法二：crontab**
```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨 3 点执行）
0 3 * * * /root/backup-ltbot.sh
```

### 数据库恢复

```bash
# 1. 停止应用
cd /www/wwwroot/ltbot-nextapp
docker-compose down

# 2. 解压备份文件
gunzip /root/backups/ltbot/production_20241224_030000.db.gz

# 3. 恢复数据库
cp /root/backups/ltbot/production_20241224_030000.db \
   /www/wwwroot/ltbot-nextapp/data/production.db

# 4. 设置权限
chmod 644 /www/wwwroot/ltbot-nextapp/data/production.db

# 5. 启动应用
docker-compose up -d
```

### 完整项目备份

```bash
# 备份整个项目目录
tar -czf ltbot-nextapp-backup-$(date +%Y%m%d).tar.gz \
  -C /www/wwwroot ltbot-nextapp \
  --exclude='node_modules' \
  --exclude='.next'

# 移动到备份目录
mv ltbot-nextapp-backup-*.tar.gz /root/backups/
```

---

## 📊 性能监控

### 使用 Docker 监控

```bash
# 实时查看资源使用
docker stats ltbot-nextapp

# 输出示例：
# CONTAINER ID   NAME            CPU %     MEM USAGE / LIMIT   MEM %
# xxxxxxxxxxxx   ltbot-nextapp   2.50%     256MiB / 1GiB       25.00%
```

### 配置监控告警

在宝塔面板中：
1. 点击 **"监控"**
2. 启用 **"系统监控"**
3. 设置告警规则：
   - CPU 使用率 > 80%
   - 内存使用率 > 80%
   - 磁盘使用率 > 85%

---

## 🎯 安全加固建议

### 1. 修改 SSH 端口

```bash
# 编辑 SSH 配置
vim /etc/ssh/sshd_config

# 修改端口（例如改为 22022）
Port 22022

# 重启 SSH 服务
systemctl restart sshd
```

### 2. 配置防火墙

```bash
# 在宝塔面板 -> 安全 中配置
# 只开放必要端口：
# - 22 或自定义 SSH 端口
# - 80 (HTTP)
# - 443 (HTTPS)
# - 8888 (宝塔面板)
```

### 3. 定期更新

```bash
# 更新系统
yum update -y        # CentOS
apt-get update && apt-get upgrade -y  # Ubuntu

# 更新 Docker
yum update docker -y        # CentOS
apt-get update docker -y    # Ubuntu
```

### 4. 环境变量安全

```bash
# 确保 .env.production 权限正确
chmod 600 /www/wwwroot/ltbot-nextapp/.env.production

# 不要将敏感信息提交到 Git
echo ".env.production" >> .gitignore
```

---

## 📞 技术支持

### 常用命令速查

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 启动服务
docker-compose up -d

# 进入容器
docker exec -it ltbot-nextapp sh

# 数据库迁移
docker exec ltbot-nextapp npx prisma migrate deploy

# 查看系统资源
docker stats ltbot-nextapp
```

### 获取帮助

- 宝塔面板官方论坛：https://www.bt.cn/bbs/
- Docker 官方文档：https://docs.docker.com/
- Next.js 官方文档：https://nextjs.org/docs
- Prisma 官方文档：https://www.prisma.io/docs

---

## ✅ 部署检查清单

部署完成后，请检查以下项目：

- [ ] Docker 和 Docker Compose 已安装
- [ ] 项目代码已上传到服务器
- [ ] 环境变量已正确配置（.env.production）
- [ ] Docker 镜像构建成功
- [ ] 数据库已初始化
- [ ] 容器正常运行（docker ps 显示 UP 状态）
- [ ] 本地可以访问（curl http://localhost:3100）
- [ ] 宝塔反向代理已配置
- [ ] DNS 解析已生效
- [ ] 域名可以正常访问（http://space.ltbot.top）
- [ ] SSL 证书已配置（可选）
- [ ] 定时备份任务已设置
- [ ] 防火墙规则已配置
- [ ] 监控告警已启用

---

## 🎉 恭喜！

如果以上步骤都顺利完成，您的 LTBot Next.js 应用已经成功部署到生产环境！

现在您可以：
- 通过 http://space.ltbot.top 访问应用
- 使用宝塔面板管理服务器
- 使用 Docker 命令管理容器
- 通过日志监控应用运行状态

**祝您使用愉快！** 🎊

---

**文档版本：** v1.0.0  
**最后更新：** 2025-12-25  
**适用版本：** ltbot-nextapp v0.1.0


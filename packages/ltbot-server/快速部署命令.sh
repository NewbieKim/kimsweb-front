#!/bin/bash

# ltbot-server 快速部署脚本
# 使用方法: bash 快速部署命令.sh

echo "========================================"
echo "  ltbot-server 自动部署脚本"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="ltbot-server"
PROJECT_DIR="/www/wwwroot/ltbot-server"
PORT=3000

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 用户或 sudo 权限运行此脚本${NC}"
    exit 1
fi

# 1. 检查 Node.js 是否安装
echo -e "${YELLOW}[1/8] 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js 版本: $NODE_VERSION${NC}"

# 2. 检查 pnpm 是否安装
echo -e "${YELLOW}[2/8] 检查 pnpm...${NC}"
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm 未安装，正在安装...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm 已安装${NC}"

# 3. 检查 PM2 是否安装
echo -e "${YELLOW}[3/8] 检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 未安装，正在安装...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 已安装${NC}"

# 4. 创建项目目录
echo -e "${YELLOW}[4/8] 创建项目目录...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p $PROJECT_DIR
    echo -e "${GREEN}✓ 目录创建成功: $PROJECT_DIR${NC}"
else
    echo -e "${GREEN}✓ 目录已存在: $PROJECT_DIR${NC}"
fi

# 5. 进入项目目录
cd $PROJECT_DIR

# 6. 安装依赖
echo -e "${YELLOW}[5/8] 安装项目依赖...${NC}"
if [ -f "package.json" ]; then
    pnpm install
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
else
    echo -e "${RED}✗ 未找到 package.json 文件${NC}"
    exit 1
fi

# 7. 创建日志目录
echo -e "${YELLOW}[6/8] 创建日志目录...${NC}"
mkdir -p $PROJECT_DIR/logs
chown -R www:www $PROJECT_DIR/logs
echo -e "${GREEN}✓ 日志目录创建成功${NC}"

# 8. 设置权限
echo -e "${YELLOW}[7/8] 设置目录权限...${NC}"
chown -R www:www $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
echo -e "${GREEN}✓ 权限设置完成${NC}"

# 9. 启动应用
echo -e "${YELLOW}[8/8] 启动应用...${NC}"

# 检查应用是否已在运行
if pm2 list | grep -q $PROJECT_NAME; then
    echo -e "${YELLOW}应用正在运行，重启中...${NC}"
    pm2 restart $PROJECT_NAME
else
    echo -e "${YELLOW}启动新应用...${NC}"
    
    # 如果存在 ecosystem.config.js 使用配置文件启动
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        # 直接启动
        pm2 start index.ts --name $PROJECT_NAME --interpreter npx --interpreter-args esno
    fi
fi

# 保存 PM2 配置
pm2 save

# 设置 PM2 开机自启（首次）
if ! pm2 startup | grep -q "already"; then
    pm2 startup
fi

echo -e "${GREEN}✓ 应用启动成功${NC}"

# 10. 检查应用状态
echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "应用信息："
echo "  名称: $PROJECT_NAME"
echo "  目录: $PROJECT_DIR"
echo "  端口: $PORT"
echo ""
echo "查看状态："
echo "  pm2 status"
echo ""
echo "查看日志："
echo "  pm2 logs $PROJECT_NAME"
echo ""
echo "重启应用："
echo "  pm2 restart $PROJECT_NAME"
echo ""
echo "停止应用："
echo "  pm2 stop $PROJECT_NAME"
echo ""
echo "测试接口："
echo "  curl http://127.0.0.1:$PORT/api/products"
echo ""

# 显示 PM2 状态
pm2 status

# 测试服务是否正常
sleep 2
if curl -s http://127.0.0.1:$PORT/api/products > /dev/null; then
    echo -e "${GREEN}✓ 服务运行正常！${NC}"
else
    echo -e "${RED}✗ 服务可能未正常启动，请检查日志${NC}"
fi


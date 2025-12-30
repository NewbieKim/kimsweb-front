#!/bin/bash

##############################################################
# LTBot Next.js 应用自动化部署脚本
# 用途：简化部署流程，自动化常见部署操作
# 作者：DevOps Team
# 版本：v1.0.0
##############################################################

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_DIR="/www/wwwroot/ltbot-nextapp"
BACKUP_DIR="/root/backups/ltbot"
CONTAINER_NAME="ltbot-nextapp"

##############################################################
# 辅助函数
##############################################################

# 打印信息
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# 打印警告
log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 打印错误
log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 检查 Docker 容器状态
check_container_status() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        return 0
    else
        return 1
    fi
}

##############################################################
# 部署功能
##############################################################

# 首次部署
deploy_first_time() {
    log_info "开始首次部署..."
    
    # 1. 检查必需工具
    log_info "检查必需工具..."
    check_command docker
    check_command docker-compose
    check_command git
    
    # 2. 检查环境变量配置
    if [ ! -f "$PROJECT_DIR/.env.production" ]; then
        log_error ".env.production 文件不存在"
        log_info "请先创建 .env.production 文件并填写配置"
        log_info "参考: cp env.production.example .env.production"
        exit 1
    fi
    
    # 3. 创建必要目录
    log_info "创建数据目录..."
    mkdir -p "$PROJECT_DIR/data"
    mkdir -p "$PROJECT_DIR/logs"
    chmod 755 "$PROJECT_DIR/data"
    chmod 755 "$PROJECT_DIR/logs"
    
    # 4. 构建镜像
    log_info "构建 Docker 镜像（这可能需要 10-20 分钟）..."
    cd "$PROJECT_DIR"
    docker-compose build
    
    if [ $? -ne 0 ]; then
        log_error "镜像构建失败"
        exit 1
    fi
    
    # 5. 启动容器
    log_info "启动容器..."
    docker-compose up -d
    
    if [ $? -ne 0 ]; then
        log_error "容器启动失败"
        exit 1
    fi
    
    # 6. 等待容器启动
    log_info "等待容器启动..."
    sleep 10
    
    # 7. 初始化数据库
    log_info "初始化数据库..."
    docker-compose exec -T $CONTAINER_NAME npx prisma migrate deploy
    
    if [ $? -ne 0 ]; then
        log_warn "数据库迁移失败，请手动执行: docker-compose exec $CONTAINER_NAME npx prisma migrate deploy"
    fi
    
    # 8. 检查容器状态
    log_info "检查容器状态..."
    docker-compose ps
    
    log_info "✅ 首次部署完成！"
    log_info "访问地址: http://localhost:3100"
    log_info "查看日志: docker-compose logs -f"
}

# 更新部署
deploy_update() {
    log_info "开始更新部署..."
    
    # 1. 检查容器是否存在
    if ! check_container_status; then
        log_error "容器不存在，请先执行首次部署"
        exit 1
    fi
    
    # 2. 备份数据库
    log_info "备份数据库..."
    backup_database
    
    # 3. 拉取最新代码
    log_info "拉取最新代码..."
    cd "$PROJECT_DIR"
    git pull
    
    if [ $? -ne 0 ]; then
        log_error "代码拉取失败"
        exit 1
    fi
    
    # 4. 停止容器
    log_info "停止容器..."
    docker-compose down
    
    # 5. 重新构建镜像
    log_info "重新构建镜像..."
    docker-compose build
    
    if [ $? -ne 0 ]; then
        log_error "镜像构建失败"
        exit 1
    fi
    
    # 6. 启动容器
    log_info "启动容器..."
    docker-compose up -d
    
    if [ $? -ne 0 ]; then
        log_error "容器启动失败"
        exit 1
    fi
    
    # 7. 等待容器启动
    log_info "等待容器启动..."
    sleep 10
    
    # 8. 执行数据库迁移
    log_info "执行数据库迁移..."
    docker-compose exec -T $CONTAINER_NAME npx prisma migrate deploy
    
    # 9. 检查容器状态
    log_info "检查容器状态..."
    docker-compose ps
    
    log_info "✅ 更新部署完成！"
    log_info "查看日志: docker-compose logs -f"
}

# 快速重启
restart_app() {
    log_info "重启应用..."
    
    cd "$PROJECT_DIR"
    docker-compose restart
    
    log_info "✅ 重启完成！"
    docker-compose ps
}

# 备份数据库
backup_database() {
    log_info "备份数据库..."
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 备份文件名
    BACKUP_FILE="$BACKUP_DIR/production_$(date +%Y%m%d_%H%M%S).db"
    
    # 复制数据库文件
    if [ -f "$PROJECT_DIR/data/production.db" ]; then
        cp "$PROJECT_DIR/data/production.db" "$BACKUP_FILE"
        gzip "$BACKUP_FILE"
        log_info "备份完成: ${BACKUP_FILE}.gz"
        
        # 删除 7 天前的备份
        find "$BACKUP_DIR" -name "*.db.gz" -mtime +7 -delete
        log_info "已清理 7 天前的旧备份"
    else
        log_warn "数据库文件不存在，跳过备份"
    fi
}

# 恢复数据库
restore_database() {
    log_info "恢复数据库..."
    
    # 列出可用备份
    log_info "可用备份文件："
    ls -lh "$BACKUP_DIR"/*.db.gz 2>/dev/null || {
        log_error "没有找到备份文件"
        exit 1
    }
    
    # 提示用户选择
    echo ""
    read -p "请输入要恢复的备份文件名（完整路径）: " RESTORE_FILE
    
    if [ ! -f "$RESTORE_FILE" ]; then
        log_error "备份文件不存在: $RESTORE_FILE"
        exit 1
    fi
    
    # 确认操作
    echo ""
    log_warn "⚠️  警告：此操作将覆盖当前数据库！"
    read -p "确认继续吗？(yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        log_info "操作已取消"
        exit 0
    fi
    
    # 停止容器
    log_info "停止容器..."
    cd "$PROJECT_DIR"
    docker-compose down
    
    # 解压并恢复
    log_info "恢复数据库..."
    gunzip -c "$RESTORE_FILE" > "$PROJECT_DIR/data/production.db"
    chmod 644 "$PROJECT_DIR/data/production.db"
    
    # 启动容器
    log_info "启动容器..."
    docker-compose up -d
    
    log_info "✅ 数据库恢复完成！"
}

# 查看日志
view_logs() {
    cd "$PROJECT_DIR"
    docker-compose logs -f --tail=100
}

# 查看状态
view_status() {
    log_info "容器状态："
    docker-compose ps
    
    echo ""
    log_info "资源使用："
    docker stats $CONTAINER_NAME --no-stream
    
    echo ""
    log_info "最近日志："
    docker-compose logs --tail=20
}

# 清理资源
cleanup() {
    log_warn "清理未使用的 Docker 资源..."
    
    # 确认操作
    read -p "确认清理吗？(yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        log_info "操作已取消"
        exit 0
    fi
    
    docker image prune -a -f
    docker container prune -f
    docker volume prune -f
    
    log_info "✅ 清理完成！"
}

##############################################################
# 主菜单
##############################################################

show_menu() {
    echo ""
    echo "========================================="
    echo "   LTBot Next.js 部署管理脚本 v1.0.0"
    echo "========================================="
    echo "1. 首次部署"
    echo "2. 更新部署"
    echo "3. 重启应用"
    echo "4. 备份数据库"
    echo "5. 恢复数据库"
    echo "6. 查看日志"
    echo "7. 查看状态"
    echo "8. 清理资源"
    echo "0. 退出"
    echo "========================================="
    echo ""
}

# 主函数
main() {
    # 检查是否为 root 用户
    if [ "$EUID" -ne 0 ]; then 
        log_warn "建议使用 root 用户运行此脚本"
    fi
    
    while true; do
        show_menu
        read -p "请选择操作 [0-8]: " choice
        
        case $choice in
            1)
                deploy_first_time
                ;;
            2)
                deploy_update
                ;;
            3)
                restart_app
                ;;
            4)
                backup_database
                ;;
            5)
                restore_database
                ;;
            6)
                view_logs
                ;;
            7)
                view_status
                ;;
            8)
                cleanup
                ;;
            0)
                log_info "退出脚本"
                exit 0
                ;;
            *)
                log_error "无效的选择，请重新输入"
                ;;
        esac
        
        # 暂停，等待用户按键
        echo ""
        read -p "按回车键继续..."
    done
}

# 运行主函数
main



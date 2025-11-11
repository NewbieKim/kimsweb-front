# ltbot-server 部署文档总览

## 🚀 快速导航

选择适合您的部署方式：

### 📚 详细文档
- **[宝塔部署指南.md](./宝塔部署指南.md)** - 完整的部署流程和配置说明
- **[宝塔面板配置对照表.md](./宝塔面板配置对照表.md)** - 对应宝塔面板每个配置项的填写说明

### ⚡ 快速工具
- **[快速部署命令.sh](./快速部署命令.sh)** - 一键部署脚本
- **[ecosystem.config.js](./ecosystem.config.js)** - PM2 进程管理配置

---

## 🎯 快速开始（3 步部署）

### 第 1 步：准备项目文件

在本地打包项目（排除 node_modules）：

```bash
# Windows PowerShell
Compress-Archive -Path .\* -DestinationPath ltbot-server.zip -Exclude node_modules

# Linux/Mac
zip -r ltbot-server.zip . -x "node_modules/*"
```

### 第 2 步：上传到宝塔

1. 登录宝塔面板
2. 进入「文件」→ 导航到 `/www/wwwroot/ltbot-server`
3. 上传 `ltbot-server.zip` 并解压

### 第 3 步：宝塔面板配置

进入「网站」→「Node项目」→「添加Node项目」

**快速配置清单：**
```yaml
项目目录: /www/wwwroot/ltbot-server
项目名称: ltbot_server
启动文件: index.ts
自动启动: devnpx esno index.ts
Node版本: v20.x 或 v22.x
包管理器: npm 或 pnpm
运行用户: www
项目端口: 3000
```

点击「保存修改」→「启动」

✅ **部署完成！**

---

## 📖 详细步骤

### 方式一：通过宝塔面板部署（推荐新手）

请查看 **[宝塔面板配置对照表.md](./宝塔面板配置对照表.md)**

这份文档对应宝塔面板的配置界面，逐项说明每个配置的含义和填写方法。

### 方式二：通过脚本一键部署（推荐运维）

请查看 **[宝塔部署指南.md](./宝塔部署指南.md)**

这份文档包含：
- 完整的部署流程
- 环境配置要求
- PM2 进程管理
- Nginx 反向代理配置
- 安全配置
- 故障排除

---

## 🔧 常用命令速查

### PM2 进程管理

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs ltbot-server

# 重启应用
pm2 restart ltbot-server

# 停止应用
pm2 stop ltbot-server

# 删除应用
pm2 delete ltbot-server

# 监控应用
pm2 monit
```

### 应用测试

```bash
# 测试 API 接口（内网）
curl http://127.0.0.1:3000/api/products

# 测试 API 接口（外网，需配置域名）
curl https://your-domain.com/api/products

# 检查端口占用
netstat -tulnp | grep 3000

# 查看应用日志
tail -f /www/wwwroot/ltbot-server/logs/out.log
```

### 权限管理

```bash
# 设置目录所有者
chown -R www:www /www/wwwroot/ltbot-server

# 设置目录权限
chmod -R 755 /www/wwwroot/ltbot-server
```

---

## 🎬 一键部署脚本使用

如果您熟悉 Linux 命令行，可以使用自动部署脚本：

### 1. 上传脚本到服务器

```bash
# 上传 快速部署命令.sh 到服务器
scp 快速部署命令.sh root@your-server-ip:/root/
```

### 2. 执行脚本

```bash
# SSH 登录服务器
ssh root@your-server-ip

# 赋予执行权限
chmod +x /root/快速部署命令.sh

# 执行脚本
bash /root/快速部署命令.sh
```

脚本会自动完成：
- ✅ 检查 Node.js 环境
- ✅ 安装 pnpm 和 PM2
- ✅ 创建项目目录
- ✅ 安装项目依赖
- ✅ 设置目录权限
- ✅ 启动应用
- ✅ 配置 PM2 自启动

---

## 📊 项目配置文件说明

### ecosystem.config.js

这是 PM2 的配置文件，包含：
- 应用启动配置
- 环境变量设置
- 日志配置
- 进程管理策略

**使用方法：**
```bash
# 使用配置文件启动
pm2 start ecosystem.config.js

# 使用生产环境配置
pm2 start ecosystem.config.js --env production
```

---

## 🌐 域名和 SSL 配置

### 配置域名访问

1. **在宝塔面板中添加网站**
   ```
   网站 → 添加站点
   域名: api.yourdomain.com
   根目录: /www/wwwroot/ltbot-server
   ```

2. **配置反向代理**
   ```
   网站设置 → 反向代理 → 添加反向代理
   目标URL: http://127.0.0.1:3000
   ```

### 配置 SSL 证书

1. **申请 Let's Encrypt 证书**
   ```
   网站设置 → SSL → Let's Encrypt → 申请
   ```

2. **强制 HTTPS**
   ```
   网站设置 → SSL → 强制HTTPS → 开启
   ```

---

## 🔒 安全建议

### 1. 防火墙配置

- ✅ 放行 80 (HTTP)
- ✅ 放行 443 (HTTPS)
- ❌ 不要对外开放 3000 端口

### 2. 定期备份

在宝塔面板设置自动备份：
```
计划任务 → 添加任务
任务类型: 备份目录
目录: /www/wwwroot/ltbot-server
执行周期: 每天凌晨2点
```

### 3. 日志监控

定期查看日志，及时发现问题：
```bash
# 查看 PM2 日志
pm2 logs ltbot-server --lines 100

# 查看 Nginx 日志
tail -f /www/wwwlogs/your-domain-access.log
```

---

## ❓ 常见问题

### 1. 应用启动失败

**查看错误日志：**
```bash
pm2 logs ltbot-server --err
```

**常见原因：**
- Node.js 版本不符合要求
- 端口被占用
- 依赖未安装
- 权限不足

### 2. 502 Bad Gateway

**检查清单：**
- [ ] Node 应用是否运行：`pm2 status`
- [ ] 端口是否正确：`netstat -tulnp | grep 3000`
- [ ] Nginx 配置是否正确：`nginx -t`

### 3. 外网无法访问

**检查清单：**
- [ ] 防火墙是否放行端口
- [ ] 域名是否正确解析
- [ ] Nginx 反向代理是否配置
- [ ] 安全组规则是否配置（云服务器）

---

## 📞 获取帮助

### 查看详细文档

- 🔗 [宝塔部署指南.md](./宝塔部署指南.md) - 完整部署流程
- 🔗 [宝塔面板配置对照表.md](./宝塔面板配置对照表.md) - 配置项说明

### 在线资源

- [宝塔官方论坛](https://www.bt.cn/bbs/)
- [PM2 官方文档](https://pm2.keymetrics.io/)
- [Node.js 官方文档](https://nodejs.org/)

---

## ✅ 部署检查清单

部署完成后，请检查以下项目：

### 环境检查
- [ ] Node.js 版本 >= 18.0.0
- [ ] PM2 已安装
- [ ] Nginx 已安装

### 项目检查
- [ ] 项目文件已上传
- [ ] 依赖已安装（node_modules 存在）
- [ ] 配置文件正确

### 运行检查
- [ ] PM2 进程正常运行
- [ ] 端口正常监听
- [ ] API 接口正常响应

### 安全检查
- [ ] 防火墙规则配置正确
- [ ] 目录权限设置正确
- [ ] SSL 证书配置完成（如需要）

### 自动化检查
- [ ] PM2 开机自启已配置
- [ ] 自动备份已设置
- [ ] 日志轮转已配置

---

## 🎉 部署成功！

如果所有检查项都已完成，恭喜您！ltbot-server 已成功部署到生产环境。

**下一步：**
1. 配置前端项目的 API 地址
2. 测试所有功能是否正常
3. 设置监控和告警
4. 准备上线

---

**最后更新：** 2025-11-11  
**维护者：** 运维团队


# 需求文档 HTML 设计规范

> 参考 noteToHtml 设计系统，适用于本 skill 生成的所有需求记录 HTML。

## 颜色

| Token | Value | 用途 |
| --- | --- | --- |
| `--accent` | `#7c3aed` | 主色（紫），链接/强调/边框 |
| `--accent-soft` | `rgba(124,58,237,0.08)` | 轻量强调背景 |
| `--bg` | `#faf7f2` | 页面背景（暖白，贴合 beige 主题） |
| `--surface` | `#ffffff` | 卡片/容器表面 |
| `--fg` | `#1a1d23` | 主要文字 |
| `--muted` | `#6b7280` | 次要文字 |
| `--border` | `#e7dfd4` | 边框/分割线 |
| `--code-bg` | `#0d1117` | 代码块背景 |
| `--code-fg` | `#c9d1d9` | 代码文字 |
| `--code-hl` | `#58a6ff` | 内联代码/高亮 |
| `--success` | `#10b981` | 成功/方案 |
| `--warning` | `#d97706` | 警告/待确认 |
| `--danger` | `#dc2626` | 风险/错误 |

## 字体与布局

- 标题：Space Grotesk + Noto Sans SC，fallback system-ui；H1 `clamp(32px,4.5vw,52px)`，H2 `clamp(24px,3vw,34px)`，H3 `20px`。
- 正文：Noto Sans SC 16px；元信息 13px；代码 JetBrains Mono/Consolas 13.5px。
- 主内容最大宽 1100px；TOC 宽 240px；间距 24px gutter、48px 章节距；圆角 10/16px。
- 响应式：>900px 双栏（左侧 TOC + 内容），≤900px 隐藏 TOC 单栏。

## 组件约定

- 数据表：表头浅灰底、无外框线、行悬停高亮。
- 代码块：深色终端风（#161b22 顶栏 + 三点指示器），右上角语言标签。
- 提示框：info/success/warning/danger，左侧 3px 彩色边条。
- 卡片：白底、hover 上浮 2px。
- 脱敏：密码/密钥/token/私钥/含凭证连接串一律显示 `***`。

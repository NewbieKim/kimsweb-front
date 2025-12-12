# 文档中心

欢迎来到 AI睡眠空间 项目文档中心！

---

## 📚 文档列表

### 1. [Tailwind CSS 使用指南](./tailwind-guide.md)
完整的 Tailwind CSS 使用指南，涵盖响应式设计、布局模式、组件开发等最佳实践。

**适合：**
- 前端开发人员
- 需要了解项目样式规范的团队成员
- 学习响应式设计的开发者

**内容包括：**
- 响应式设计断点详解
- 移动优先策略
- 常用布局模式
- 自定义颜色系统
- 字体和排版规范
- 组件开发规范
- 性能优化建议
- 实战示例和调试技巧

---

### 2. [配置指南](./configuration-guide.md)
详细说明项目配置文件和全局样式的使用方法。

**适合：**
- 项目维护人员
- 需要修改配置的开发者
- 了解项目技术架构的成员

**内容包括：**
- Tailwind 配置详解
- 全局样式说明
- CSS 变量使用
- 预设组件类
- 工具类介绍
- 微信小程序适配
- 常见问题解答

---

## 🚀 快速开始

### 新成员入门流程

1. **阅读顺序建议：**
   - 先阅读 [配置指南](./configuration-guide.md) 了解项目配置
   - 再阅读 [Tailwind 使用指南](./tailwind-guide.md) 学习实际应用

2. **环境搭建：**
   ```bash
   # 安装依赖
   pnpm install
   
   # 启动开发服务器
   pnpm dev
   
   # 访问 http://localhost:3000
   ```

3. **开始开发：**
   - 使用配置好的响应式断点
   - 遵循移动优先策略
   - 使用预设的组件类
   - 参考文档中的示例代码

---

## 🎯 响应式开发快速参考

### 断点速查

| 断点 | 最小宽度 | 设备类型 | 使用示例 |
|------|---------|---------|---------|
| `xs` | 375px | 小手机 | `xs:text-sm` |
| `sm` | 640px | 手机横屏 | `sm:flex-row` |
| `md` | 768px | 平板竖屏 | `md:grid-cols-2` |
| `lg` | 1024px | 平板横屏 | `lg:text-xl` |
| `xl` | 1280px | 桌面 | `xl:max-w-7xl` |
| `2xl` | 1536px | 大屏 | `2xl:px-16` |

### 常用颜色

| 颜色系 | 用途 | 类名示例 |
|-------|------|---------|
| Primary (紫) | 主按钮、品牌色 | `bg-primary-500` |
| Secondary (粉) | 次要元素、装饰 | `text-secondary-600` |
| Accent (蓝) | 链接、提示 | `border-accent-500` |

### 预设组件类

| 类名 | 用途 | 效果 |
|-----|------|------|
| `btn-primary` | 主按钮 | 紫粉渐变 + 响应式尺寸 |
| `btn-secondary` | 次要按钮 | 边框样式 + 悬停效果 |
| `card` | 卡片容器 | 圆角 + 阴影 + 内边距 |
| `input` | 输入框 | 边框 + 聚焦效果 |
| `text-gradient-primary` | 渐变文字 | 紫粉渐变文字 |
| `bg-gradient-soft` | 柔和背景 | 柔和渐变背景 |

---

## 💡 开发技巧

### 1. 使用代码片段

在 VSCode 中创建代码片段加速开发：

**创建响应式容器：**
```jsx
<div className="container-responsive py-8 md:py-12 lg:py-16">
  {/* 内容 */}
</div>
```

**创建响应式网格：**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {/* 项目 */}
</div>
```

### 2. 调试断点

开发时在页面右下角显示当前断点（仅开发环境）：

```jsx
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 right-4 bg-black text-white px-3 py-2 rounded text-xs">
    <span className="md:hidden">Mobile</span>
    <span className="hidden md:inline lg:hidden">Tablet</span>
    <span className="hidden lg:inline">Desktop</span>
  </div>
)}
```

### 3. 性能检查清单

开发完成后检查：
- [ ] 所有图片都使用 Next.js Image 组件
- [ ] 文字大小在所有设备上可读
- [ ] 按钮点击区域足够大（≥44x44px）
- [ ] 在真实设备上测试（不仅浏览器模拟）
- [ ] 无横向滚动条
- [ ] 动画流畅，无卡顿

---

## 🔗 相关资源

### 官方文档
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev)

### 设计工具
- [Figma](https://www.figma.com)
- [Tailwind UI](https://tailwindui.com)
- [HeroUI](https://www.heroui.com)

### 开发工具
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) - VSCode 扩展
- [PostCSS Language Support](https://marketplace.visualstudio.com/items?itemName=csstools.postcss) - VSCode 扩展

---

## 📝 贡献指南

### 文档更新

如需更新文档，请遵循以下步骤：

1. 确保内容准确、清晰
2. 使用中文简体
3. 包含代码示例
4. 添加适当的表格和列表
5. 更新此 README 的相关链接

### 提交规范

```bash
# 文档更新
docs: 更新 Tailwind 使用指南

# 配置更新
config: 添加新的响应式断点

# 样式更新
style: 完善全局样式定义
```

---

## 📮 反馈与支持

如有疑问或建议，请：

1. 查阅本文档中心的相关文档
2. 查看项目根目录的 README.md
3. 联系项目维护人员

---

## 📄 许可证

本项目采用 [MIT License](../LICENSE)

---

**最后更新：** 2025年12月

**维护者：** AI睡眠空间开发团队


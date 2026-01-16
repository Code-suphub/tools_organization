# 在线开发者工具箱 (DevTools)

一个现代化、美观且功能丰富的在线开发者工具集合，基于 React、MUI 和 Tailwind CSS 构建。

## ✨ 特性

- **现代化设计**: 采用流行的 SaaS 风格设计（Linear/Vercel 风格），黑白灰主色调搭配蓝色强调。
- **响应式布局**: 完美适配桌面、平板和移动端设备。
- **深色模式**: 内置完美支持的深色/浅色主题切换。
- **纯前端实现**: 所有处理均在浏览器端完成，保障数据安全隐私。
- **丰富的工具集**: 包含 JSON、时间、编码、加密、文本、运维等 13 大类实用工具。

## 🛠️ 工具列表

### P0 核心工具
- **JSON 工具**: 格式化、压缩、校验、Diff 对比
- **时间工具**: Unix 时间戳转换、多时区支持
- **编码工具**: Base64 编码/解码、URL 编码/解码
- **哈希加密**: MD5, SHA-1, SHA-256, SHA-512
- **文本处理**: 文本 Diff 对比
- **UUID 生成**: 批量生成 UUID v4
- **二维码**: 生成自定义二维码图片

### P1 重要功能
- **代码格式化**: HTML, CSS, JavaScript, XML, SQL 多语言美化与压缩
- **正则测试**: 实时正则表达式匹配与高亮
- **颜色工具**: HEX/RGB/HSL 转换与取色器
- **Cron 生成**: 可视化 Cron 表达式生成器

### P2 增强功能
- **图片工具**: 图片与 Base64 互转
- **文本工具箱**: 字符统计、大小写转换、去重、去空行
- **网络工具**: 本机公网 IP 查询、User-Agent 分析
- **运维工具**: Linux Chmod 权限计算器
- **数学工具**: 多进制数值转换 (2/8/10/16 进制)

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可使用。

### 构建生产版本

```bash
npm run build
```

构建产物位于 `dist/` 目录。

## 🏗️ 技术栈

- **Core**: React 18, Vite
- **Router**: React Router v6
- **UI**: Material-UI (MUI v5)
- **Styling**: Tailwind CSS
- **Editor**: CodeMirror 6
- **Utils**:
  - `crypto-js`: 加密哈希
  - `dayjs`: 时间处理
  - `js-beautify`: 代码格式化
  - `diff`: 文本/JSON 对比
  - `qrcode`: 二维码生成

## 📂 目录结构

```
src/
├── components/     # 通用组件 (Layout, ToolCard, CodeEditor)
├── config/         # 工具注册配置 (tools.js)
├── pages/          # 页面组件 (Home, NotFound)
├── styles/         # 全局样式
├── tools/          # 具体工具实现
│   ├── json/       # JSON 相关工具
│   ├── time/       # 时间相关工具
│   ├── encode/     # 编码相关工具
│   ├── text/       # 文本相关工具
│   ├── ...         # 其他工具分类
└── App.jsx         # 路由与主题配置
```

## 📝 开发指南

要添加一个新工具：

1. 在 `src/tools/<category>/` 下创建工具组件（参考 `src/tools/json/JsonFormat.jsx`）。
2. 在 `src/config/tools.js` 中注册工具配置。
3. 在 `src/App.jsx` 中添加路由和懒加载导入。
4. (可选) 如果是新分类，在 `src/config/tools.js` 添加分类并在 `Sidebar.jsx` 添加图标映射。

## 📄 License

MIT

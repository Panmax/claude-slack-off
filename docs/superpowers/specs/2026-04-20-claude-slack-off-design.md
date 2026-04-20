# claude-slack-off 设计文档

一个伪装成 Claude Code 的程序员摸鱼 CLI 工具。外观模仿 Claude Code 终端界面，实际用来看电子书和浏览网页。

## 核心功能

### 1. 电子书阅读器

- 支持 `.txt`（UTF-8，按空行分段）和 `.epub`（解析章节结构，提取正文）
- 自动分页适配终端高度
- 阅读进度保存与恢复（`~/.claude-slack-off/bookmarks.json`）
- EPUB 章节目录跳转
- 文本搜索（`/` 进入搜索，`n`/`N` 跳转结果）

### 2. 网页浏览器

- `fetch` HTML → `cheerio` 提取正文（去广告/导航/侧边栏）→ `turndown` 转 Markdown → 终端渲染
- 页内链接跟踪（数字键选择链接跳转）
- 浏览历史后退/前进
- 收藏夹

### 3. 伪装引擎

采用**注释流策略**：将电子书/网页文字逐句嵌入代码注释中，周围自动填充合理的代码骨架（函数声明、变量、条件语句等）。

伪装代码支持多种语言模板：TypeScript（默认）、Python、Go、Rust。每种语言有独立的代码骨架模板，存放在 `src/templates/` 下。

伪装模式界面元素：
- 顶部：紫色圆点 + AI 操作描述文字
- 中间：带语法高亮的代码块，原文藏在注释中
- 底部：`Generating code...` 状态提示
- 偶尔插入 `"Reading file..."`、`"Running tests..."` 等假状态消息

### 4. 模式切换

两种模式：**正常模式**（直接显示内容）和**伪装模式**（Claude Code 风格）。

- 切换热键：`Ctrl+S`
- 正常 → 伪装：屏幕内容快速向上滚出（~200ms），渲染 Claude Code 风格状态栏，打字机效果开始输出伪装代码
- 伪装 → 正常：代码输出停止，屏幕清除，直接恢复阅读/浏览界面（~100ms），光标回到之前阅读位置
- 支持 `--disguise` 参数直接以伪装模式启动

## 快捷键

### 全局

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 切换伪装模式 |
| `q` | 退出程序 |
| `Tab` | 切换阅读/浏览模式 |
| `:` | 进入命令行（类 vim） |

### 电子书阅读（正常模式）

| 快捷键 | 功能 |
|--------|------|
| `j` / `↓` | 下一页 |
| `k` / `↑` | 上一页 |
| `g` | 跳到开头 |
| `G` | 跳到末尾 |
| `/` | 搜索文本 |
| `n` / `N` | 下/上一个搜索结果 |
| `t` | 目录（EPUB 章节列表） |

### 网页浏览（正常模式）

| 快捷键 | 功能 |
|--------|------|
| `o` | 输入 URL 打开 |
| `1-9` | 点击页面中的链接 |
| `H` | 后退 |
| `L` | 前进 |
| `r` | 刷新页面 |
| `Ctrl+B` | 添加收藏 |

### 伪装模式

仅保留最少按键，其余全部静默忽略：

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 退出伪装模式 |
| `j` / `↓` | 继续"生成"下一段 |
| `k` / `↑` | 回看上一段 |
| `q` | 退出程序 |

伪装模式自动行为：
- 打字机效果逐字输出代码
- 输出速度随机波动（模拟 AI 思考）
- 偶尔插入假状态消息
- 长时间无操作自动慢速滚动

## CLI 命令

```
Usage: claude-slack-off <command> [options]

Commands:
  read [file]       打开电子书阅读（无参数恢复上次阅读）
  browse [url]      打开网页浏览（无参数进入交互模式）
  list              列出阅读记录和收藏
  config            编辑配置

Options:
  --disguise, -d    启动时直接进入伪装模式
  --speed <n>       伪装打字速度 (1-10, 默认 5)
  --lang <lang>     伪装代码语言 (ts/py/go/rs, 默认 ts)
  --help, -h        帮助信息
  --version, -v     版本号
```

## 技术栈

- **语言**: TypeScript
- **运行时**: Node.js
- **TUI 框架**: Ink (React for CLI)
- **CLI 解析**: commander.js
- **EPUB 解析**: @epubjs/core (epub.js v5)
- **网页抓取**: node-fetch + cheerio
- **HTML → Markdown**: turndown
- **分发**: npm 全局包 (`npm install -g claude-slack-off`)

## 项目结构

```
claude-slack-off/
├── package.json
├── tsconfig.json
├── bin/
│   └── cli.ts                  # 入口, commander 解析命令
├── src/
│   ├── app.tsx                  # Ink 根组件, 模式路由
│   ├── components/
│   │   ├── reader/
│   │   │   ├── ReaderView.tsx        # 电子书正常模式
│   │   │   ├── Pagination.tsx        # 分页逻辑
│   │   │   └── TableOfContents.tsx   # EPUB 目录
│   │   ├── browser/
│   │   │   ├── BrowserView.tsx       # 网页正常模式
│   │   │   ├── LinkSelector.tsx      # 链接选择交互
│   │   │   └── UrlBar.tsx            # URL 输入栏
│   │   ├── disguise/
│   │   │   ├── DisguiseView.tsx      # 伪装模式容器
│   │   │   ├── CodeBlock.tsx         # 代码块渲染
│   │   │   ├── Typewriter.tsx        # 打字机效果
│   │   │   └── StatusFaker.tsx       # 假状态消息生成
│   │   └── shared/
│   │       ├── StatusBar.tsx         # 底部状态栏
│   │       └── KeyHandler.tsx        # 统一快捷键处理
│   ├── services/
│   │   ├── book-parser.ts       # TXT/EPUB 解析
│   │   ├── web-fetcher.ts       # 网页抓取+正文提取
│   │   ├── disguise-engine.ts   # 文本→伪装代码转换
│   │   └── storage.ts           # 书签/历史/配置持久化
│   ├── templates/
│   │   ├── typescript.ts        # TypeScript 代码模板
│   │   ├── python.ts            # Python 代码模板
│   │   ├── golang.ts            # Go 代码模板
│   │   └── rust.ts              # Rust 代码模板
│   └── types/
│       └── index.ts             # 共享类型定义
└── tests/
    ├── book-parser.test.ts
    ├── web-fetcher.test.ts
    └── disguise-engine.test.ts
```

## 数据持久化

```
~/.claude-slack-off/
├── bookmarks.json    # 电子书阅读进度
├── favorites.json    # 网页收藏夹
├── history.json      # 浏览历史
└── config.json       # 用户配置
```

## 安全措施

- 伪装模式下所有非功能按键静默忽略，防止误操作暴露
- 终端标题显示为 `"claude — project"`
- 伪装模式屏幕内容不含任何明文原文（全部嵌入代码注释中）

# claude-slack-off

[English](./README.md)

一个伪装成 **Claude Code** 的程序员摸鱼 CLI 工具。看起来你在用 AI 辅助编程 —— 实际上你在看小说。

## 功能特性

- **电子书阅读器** — 在终端中阅读 `.txt` 和 `.epub` 文件，支持 vim 风格导航
- **网页浏览器** — 抓取网页并渲染为 Markdown，数字键跟踪链接
- **伪装模式** — 一键 (`Ctrl+S`) 将阅读内容变成 Claude Code 风格的代码输出
  - 文本隐藏在代码注释中，周围包裹真实的代码骨架
  - 打字机效果，随机速度波动
  - 假状态消息（"Reading file..."、"Running tests..."）
  - 多语言模板：TypeScript、Python、Go、Rust
- **书签与历史** — 阅读进度自动保存，网页浏览历史和收藏夹

## 安装

```bash
npm install -g claude-slack-off
```

## 使用方法

```bash
# 阅读电子书
claude-slack-off read ~/books/三体.txt

# 直接以伪装模式启动
claude-slack-off read ~/books/小说.txt -d --lang py

# 浏览网页
claude-slack-off browse https://news.ycombinator.com

# 查看阅读历史和收藏
claude-slack-off list
```

## 快捷键

### 全局

| 按键 | 功能 |
|------|------|
| `Ctrl+S` | 切换伪装模式 |
| `Tab` | 切换阅读/浏览模式 |
| `q` | 退出 |

### 阅读器（正常模式）

| 按键 | 功能 |
|------|------|
| `j` / `↓` | 下一页 |
| `k` / `↑` | 上一页 |
| `g` / `G` | 跳到开头 / 末尾 |
| `/` | 搜索文本 |
| `n` / `N` | 下/上一个搜索结果 |
| `t` | 目录（EPUB 章节列表） |

### 浏览器（正常模式）

| 按键 | 功能 |
|------|------|
| `o` | 输入 URL |
| `1-9` | 跟踪链接 |
| `H` / `L` | 后退 / 前进 |
| `r` | 刷新 |
| `Ctrl+B` | 添加收藏 |

### 伪装模式

仅以下按键有效，其余全部静默忽略：

| 按键 | 功能 |
|------|------|
| `Ctrl+S` | 退出伪装模式 |
| `j` / `↓` | 下一段代码 |
| `k` / `↑` | 上一段代码 |
| `q` | 退出 |

## 命令行选项

```
选项:
  -d, --disguise     以伪装模式启动
  --speed <n>        打字速度 1-10（默认: 5）
  --lang <lang>      代码语言: ts/py/go/rs（默认: ts）
  -h, --help         显示帮助
  -v, --version      显示版本
```

## 伪装模式原理

你的阅读内容会被嵌入到看起来真实的代码注释中：

```typescript
async function processRequest(handler: RequestContext): Promise<void> {
  // 汪淼骑着自行车穿过喧闹的城市街道
  // 心中充满了困惑
  const result = await this.handleEvent();
  // 那些科学家接连自杀的消息
  // 如同一记记重锤
  if (events.impact > THRESHOLD) {
    // 敲打着他原本平静的生活
    rider.state = 'confused';
  }
  return handler;
}
```

## 开发

```bash
git clone https://github.com/user/claude-slack-off
cd claude-slack-off
npm install
npm run dev -- read tests/fixtures/sample.txt
npm test
```

## 技术栈

- TypeScript + Node.js
- [Ink](https://github.com/vadimdemedes/ink)（React CLI 框架）
- [Commander.js](https://github.com/tj/commander.js)（命令行解析）
- [Cheerio](https://github.com/cheeriojs/cheerio)（HTML 解析）
- [Turndown](https://github.com/mixmark-io/turndown)（HTML 转 Markdown）

## 许可证

MIT

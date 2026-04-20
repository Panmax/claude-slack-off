# claude-slack-off

[中文](./README.zh-CN.md)

A CLI tool disguised as **Claude Code** for reading ebooks and browsing the web at work. Looks like you're pair-programming with AI — but you're actually reading a novel.

## Features

- **Ebook Reader** — Read `.txt` and `.epub` files in the terminal with vim-style navigation
- **Web Browser** — Fetch and render web pages as markdown, follow links with number keys
- **Disguise Mode** — One key (`Ctrl+S`) transforms your reading into fake Claude Code output
  - Text hidden inside code comments surrounded by realistic code skeletons
  - Typewriter effect with random speed variation
  - Fake status messages ("Reading file...", "Running tests...")
  - Multiple language templates: TypeScript, Python, Go, Rust
- **Bookmark & History** — Reading progress saved automatically, web browsing history and favorites

## Install

```bash
npm install -g claude-slack-off
```

## Usage

```bash
# Read an ebook
claude-slack-off read ~/books/three-body.txt

# Read in disguise mode from the start
claude-slack-off read ~/books/novel.txt -d --lang py

# Browse a webpage
claude-slack-off browse https://news.ycombinator.com

# List reading history and favorites
claude-slack-off list
```

## Keybindings

### Global

| Key | Action |
|-----|--------|
| `Ctrl+S` | Toggle disguise mode |
| `Tab` | Switch between reader/browser |
| `q` | Quit |

### Reader (Normal Mode)

| Key | Action |
|-----|--------|
| `j` / `↓` | Next page |
| `k` / `↑` | Previous page |
| `g` / `G` | Jump to start / end |
| `/` | Search text |
| `n` / `N` | Next / previous search result |
| `t` | Table of contents (EPUB) |

### Browser (Normal Mode)

| Key | Action |
|-----|--------|
| `o` | Open URL |
| `1-9` | Follow link |
| `H` / `L` | Back / Forward |
| `r` | Refresh |
| `Ctrl+B` | Add to favorites |

### Disguise Mode

Only these keys work — all others are silently ignored:

| Key | Action |
|-----|--------|
| `Ctrl+S` | Exit disguise mode |
| `j` / `↓` | Next code block |
| `k` / `↑` | Previous code block |
| `q` | Quit |

## CLI Options

```
Options:
  -d, --disguise     Start in disguise mode
  --speed <n>        Typing speed 1-10 (default: 5)
  --lang <lang>      Code language: ts/py/go/rs (default: ts)
  -h, --help         Show help
  -v, --version      Show version
```

## How Disguise Mode Works

Your reading content is embedded into realistic-looking code as comments:

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

## Development

```bash
git clone https://github.com/user/claude-slack-off
cd claude-slack-off
npm install
npm run dev -- read tests/fixtures/sample.txt
npm test
```

## Tech Stack

- TypeScript + Node.js
- [Ink](https://github.com/vadimdemedes/ink) (React for CLI)
- [Commander.js](https://github.com/tj/commander.js) (CLI parsing)
- [Cheerio](https://github.com/cheeriojs/cheerio) (HTML parsing)
- [Turndown](https://github.com/mixmark-io/turndown) (HTML to Markdown)

## License

MIT

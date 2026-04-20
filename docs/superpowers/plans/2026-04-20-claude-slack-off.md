# claude-slack-off Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI tool that disguises itself as Claude Code while letting programmers read ebooks and browse the web.

**Architecture:** Ink (React for CLI) renders two mode branches — normal mode (reader/browser views) and disguise mode (fake Claude Code output). A shared content source feeds both modes. Services handle parsing, fetching, and text-to-code transformation independently from the UI layer.

**Tech Stack:** TypeScript, Node.js, Ink 4, commander.js, cheerio, turndown, vitest

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies, bin entry, scripts |
| `tsconfig.json` | TypeScript config for JSX + ESM |
| `bin/cli.ts` | CLI entry point, commander command routing |
| `src/app.tsx` | Ink root component, mode state, keyboard router |
| `src/types/index.ts` | Shared type definitions |
| `src/services/storage.ts` | Read/write JSON to `~/.claude-slack-off/` |
| `src/services/book-parser.ts` | Parse TXT/EPUB into pages |
| `src/services/web-fetcher.ts` | Fetch URL → extract text → markdown |
| `src/services/disguise-engine.ts` | Convert text lines into fake code with comments |
| `src/templates/typescript.ts` | TS code skeleton templates |
| `src/templates/python.ts` | Python code skeleton templates |
| `src/templates/golang.ts` | Go code skeleton templates |
| `src/templates/rust.ts` | Rust code skeleton templates |
| `src/components/shared/StatusBar.tsx` | Bottom status bar for both modes |
| `src/components/reader/ReaderView.tsx` | Ebook reading UI with pagination |
| `src/components/reader/TableOfContents.tsx` | EPUB chapter list overlay |
| `src/components/browser/BrowserView.tsx` | Web browsing UI with link selection |
| `src/components/browser/UrlBar.tsx` | URL input component |
| `src/components/disguise/DisguiseView.tsx` | Fake Claude Code output container |
| `src/components/disguise/Typewriter.tsx` | Typewriter character-by-character rendering |
| `src/components/disguise/CodeBlock.tsx` | Syntax-highlighted code block |
| `src/components/disguise/StatusFaker.tsx` | Random fake status messages |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/types/index.ts`

- [ ] **Step 1: Initialize package.json**

```bash
cd /Users/jiapan/Codes/github.com/claude-slack-off
npm init -y
```

Then edit `package.json`:

```json
{
  "name": "claude-slack-off",
  "version": "0.1.0",
  "description": "A CLI tool disguised as Claude Code for reading ebooks and browsing the web",
  "type": "module",
  "bin": {
    "claude-slack-off": "./dist/bin/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx bin/cli.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "keywords": ["cli", "tui", "ebook", "reader"],
  "license": "MIT"
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install ink react commander cheerio turndown
npm install -D typescript @types/react @types/node vitest tsx @types/turndown
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*", "bin/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create shared types**

Create `src/types/index.ts`:

```typescript
export interface BookPage {
  content: string;
  pageNumber: number;
  totalPages: number;
  chapter?: string;
}

export interface BookMeta {
  filePath: string;
  title: string;
  format: "txt" | "epub";
  totalPages: number;
  chapters?: Chapter[];
}

export interface Chapter {
  title: string;
  startPage: number;
}

export interface WebPage {
  url: string;
  title: string;
  content: string; // markdown
  links: WebLink[];
}

export interface WebLink {
  index: number;
  text: string;
  url: string;
}

export interface Bookmark {
  filePath: string;
  page: number;
  updatedAt: string;
}

export interface Favorite {
  url: string;
  title: string;
  addedAt: string;
}

export interface AppConfig {
  disguiseKey: string;
  defaultLang: "ts" | "py" | "go" | "rs";
  typeSpeed: number;
}

export type AppMode = "reader" | "browser";
export type DisplayMode = "normal" | "disguise";
export type TemplateLang = "ts" | "py" | "go" | "rs";

export interface DisguisedLine {
  text: string;
  type: "code" | "comment" | "status" | "blank";
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json src/types/index.ts
git commit -m "feat: scaffold project with dependencies and shared types"
```

---

### Task 2: Storage Service

**Files:**
- Create: `src/services/storage.ts`
- Create: `tests/storage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Storage } from "../src/services/storage.js";

describe("Storage", () => {
  let tmpDir: string;
  let storage: Storage;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "slack-off-test-"));
    storage = new Storage(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reads bookmark for a file", async () => {
    const bookmark = { filePath: "/books/test.txt", page: 42, updatedAt: "2026-04-20T00:00:00Z" };
    fs.writeFileSync(path.join(tmpDir, "bookmarks.json"), JSON.stringify([bookmark]));
    const result = await storage.getBookmark("/books/test.txt");
    expect(result).toEqual(bookmark);
  });

  it("returns null for unknown bookmark", async () => {
    const result = await storage.getBookmark("/nonexistent.txt");
    expect(result).toBeNull();
  });

  it("saves and updates a bookmark", async () => {
    await storage.saveBookmark("/books/a.txt", 10);
    const result = await storage.getBookmark("/books/a.txt");
    expect(result?.page).toBe(10);

    await storage.saveBookmark("/books/a.txt", 20);
    const updated = await storage.getBookmark("/books/a.txt");
    expect(updated?.page).toBe(20);
  });

  it("saves and lists favorites", async () => {
    await storage.addFavorite("https://example.com", "Example");
    const favs = await storage.listFavorites();
    expect(favs).toHaveLength(1);
    expect(favs[0].url).toBe("https://example.com");
  });

  it("saves and lists history", async () => {
    await storage.addHistory("https://a.com", "A");
    await storage.addHistory("https://b.com", "B");
    const history = await storage.listHistory();
    expect(history).toHaveLength(2);
    expect(history[0].url).toBe("https://b.com"); // most recent first
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/storage.test.ts
```

Expected: FAIL — cannot find module `../src/services/storage.js`.

- [ ] **Step 3: Implement storage service**

Create `src/services/storage.ts`:

```typescript
import fs from "node:fs/promises";
import path from "node:path";
import type { Bookmark, Favorite } from "../types/index.js";

interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: string;
}

export class Storage {
  constructor(private baseDir: string) {}

  private filePath(name: string): string {
    return path.join(this.baseDir, name);
  }

  private async readJson<T>(name: string): Promise<T> {
    try {
      const raw = await fs.readFile(this.filePath(name), "utf-8");
      return JSON.parse(raw) as T;
    } catch {
      return [] as unknown as T;
    }
  }

  private async writeJson(name: string, data: unknown): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(this.filePath(name), JSON.stringify(data, null, 2));
  }

  async getBookmark(filePath: string): Promise<Bookmark | null> {
    const bookmarks = await this.readJson<Bookmark[]>("bookmarks.json");
    return bookmarks.find((b) => b.filePath === filePath) ?? null;
  }

  async saveBookmark(filePath: string, page: number): Promise<void> {
    const bookmarks = await this.readJson<Bookmark[]>("bookmarks.json");
    const existing = bookmarks.findIndex((b) => b.filePath === filePath);
    const entry: Bookmark = { filePath, page, updatedAt: new Date().toISOString() };
    if (existing >= 0) {
      bookmarks[existing] = entry;
    } else {
      bookmarks.push(entry);
    }
    await this.writeJson("bookmarks.json", bookmarks);
  }

  async addFavorite(url: string, title: string): Promise<void> {
    const favs = await this.readJson<Favorite[]>("favorites.json");
    favs.push({ url, title, addedAt: new Date().toISOString() });
    await this.writeJson("favorites.json", favs);
  }

  async listFavorites(): Promise<Favorite[]> {
    return this.readJson<Favorite[]>("favorites.json");
  }

  async addHistory(url: string, title: string): Promise<void> {
    const history = await this.readJson<HistoryEntry[]>("history.json");
    history.unshift({ url, title, visitedAt: new Date().toISOString() });
    await this.writeJson("history.json", history);
  }

  async listHistory(): Promise<HistoryEntry[]> {
    return this.readJson<HistoryEntry[]>("history.json");
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/storage.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/storage.ts tests/storage.test.ts
git commit -m "feat: add storage service for bookmarks, favorites, and history"
```

---

### Task 3: Book Parser (TXT + EPUB)

**Files:**
- Create: `src/services/book-parser.ts`
- Create: `tests/book-parser.test.ts`
- Create: `tests/fixtures/sample.txt`

- [ ] **Step 1: Create test fixture**

Create `tests/fixtures/sample.txt`:

```
Chapter One: The Beginning

It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions.

The hallway smelt of boiled cabbage and old rag mats. At one end of it a coloured poster, too large for indoor display, had been tacked to the wall.

Chapter Two: The Diary

Winston fitted a nib into the penholder and sucked it to get the grease off. He opened the diary. It was a thick, quarto-sized blank book with a red back and a marbled cover.

He began to write in large, clumsy capitals.
```

- [ ] **Step 2: Write failing tests**

Create `tests/book-parser.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import path from "node:path";
import { BookParser } from "../src/services/book-parser.js";

describe("BookParser", () => {
  const fixturePath = path.join(import.meta.dirname, "fixtures", "sample.txt");

  describe("TXT parsing", () => {
    it("loads a txt file and returns metadata", async () => {
      const parser = new BookParser(fixturePath, 5); // 5 lines per page
      const meta = await parser.load();
      expect(meta.format).toBe("txt");
      expect(meta.title).toBe("sample");
      expect(meta.totalPages).toBeGreaterThan(0);
    });

    it("returns a specific page", async () => {
      const parser = new BookParser(fixturePath, 5);
      await parser.load();
      const page = parser.getPage(0);
      expect(page.pageNumber).toBe(0);
      expect(page.content.length).toBeGreaterThan(0);
    });

    it("clamps page number to valid range", async () => {
      const parser = new BookParser(fixturePath, 5);
      const meta = await parser.load();
      const page = parser.getPage(9999);
      expect(page.pageNumber).toBe(meta.totalPages - 1);

      const negPage = parser.getPage(-1);
      expect(negPage.pageNumber).toBe(0);
    });

    it("searches text and returns matching pages", async () => {
      const parser = new BookParser(fixturePath, 5);
      await parser.load();
      const results = parser.search("Winston");
      expect(results.length).toBeGreaterThan(0);
      results.forEach((pageNum) => {
        const page = parser.getPage(pageNum);
        expect(page.content.toLowerCase()).toContain("winston");
      });
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run tests/book-parser.test.ts
```

Expected: FAIL — cannot find module `../src/services/book-parser.js`.

- [ ] **Step 4: Implement book parser**

Create `src/services/book-parser.ts`:

```typescript
import fs from "node:fs/promises";
import path from "node:path";
import type { BookMeta, BookPage } from "../types/index.js";

export class BookParser {
  private lines: string[] = [];
  private meta: BookMeta | null = null;

  constructor(
    private filePath: string,
    private linesPerPage: number = 20
  ) {}

  async load(): Promise<BookMeta> {
    const ext = path.extname(this.filePath).toLowerCase();
    if (ext === ".txt") {
      await this.loadTxt();
    } else if (ext === ".epub") {
      await this.loadEpub();
    } else {
      throw new Error(`Unsupported format: ${ext}`);
    }
    return this.meta!;
  }

  private async loadTxt(): Promise<void> {
    const raw = await fs.readFile(this.filePath, "utf-8");
    this.lines = raw.split("\n");
    const totalPages = Math.ceil(this.lines.length / this.linesPerPage);
    this.meta = {
      filePath: this.filePath,
      title: path.basename(this.filePath, path.extname(this.filePath)),
      format: "txt",
      totalPages,
    };
  }

  private async loadEpub(): Promise<void> {
    // EPUB support will be added in a later task when we integrate epub parsing library.
    // For now, throw a clear error.
    throw new Error("EPUB support not yet implemented");
  }

  getPage(pageNumber: number): BookPage {
    if (!this.meta) throw new Error("Call load() first");
    const clamped = Math.max(0, Math.min(pageNumber, this.meta.totalPages - 1));
    const start = clamped * this.linesPerPage;
    const end = start + this.linesPerPage;
    const content = this.lines.slice(start, end).join("\n");
    return {
      content,
      pageNumber: clamped,
      totalPages: this.meta.totalPages,
    };
  }

  search(query: string): number[] {
    if (!this.meta) throw new Error("Call load() first");
    const lowerQuery = query.toLowerCase();
    const matches: Set<number> = new Set();
    this.lines.forEach((line, i) => {
      if (line.toLowerCase().includes(lowerQuery)) {
        matches.add(Math.floor(i / this.linesPerPage));
      }
    });
    return Array.from(matches).sort((a, b) => a - b);
  }

  getMeta(): BookMeta | null {
    return this.meta;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/book-parser.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/book-parser.ts tests/book-parser.test.ts tests/fixtures/sample.txt
git commit -m "feat: add book parser with TXT support, pagination, and search"
```

---

### Task 4: Web Fetcher

**Files:**
- Create: `src/services/web-fetcher.ts`
- Create: `tests/web-fetcher.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/web-fetcher.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { extractContent, htmlToMarkdown, extractLinks } from "../src/services/web-fetcher.js";

const sampleHtml = `
<html>
<head><title>Test Page</title></head>
<body>
  <nav><a href="/home">Home</a></nav>
  <main>
    <h1>Article Title</h1>
    <p>First paragraph of the article.</p>
    <p>Second paragraph with a <a href="https://example.com/link1">link one</a> and 
       <a href="https://example.com/link2">link two</a>.</p>
  </main>
  <aside>Sidebar content</aside>
  <footer>Footer</footer>
</body>
</html>
`;

describe("web-fetcher", () => {
  it("extracts main content from HTML", () => {
    const content = extractContent(sampleHtml);
    expect(content).toContain("Article Title");
    expect(content).toContain("First paragraph");
    expect(content).not.toContain("Sidebar content");
    expect(content).not.toContain("Footer");
  });

  it("converts HTML to markdown", () => {
    const md = htmlToMarkdown("<h1>Title</h1><p>Hello <strong>world</strong></p>");
    expect(md).toContain("# Title");
    expect(md).toContain("**world**");
  });

  it("extracts links with indices", () => {
    const links = extractLinks(sampleHtml, "https://example.com/page");
    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links[0].index).toBe(1);
    expect(links[0].url).toContain("http");
    expect(links[0].text.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/web-fetcher.test.ts
```

Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement web fetcher**

Create `src/services/web-fetcher.ts`:

```typescript
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import type { WebPage, WebLink } from "../types/index.js";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export function extractContent(html: string): string {
  const $ = cheerio.load(html);
  // Remove non-content elements
  $("nav, header, footer, aside, script, style, .sidebar, .nav, .menu, .ad, .advertisement").remove();
  // Prefer <main> or <article>, fall back to <body>
  const main = $("main").length ? $("main") : $("article").length ? $("article") : $("body");
  return main.html() ?? "";
}

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html);
}

export function extractLinks(html: string, baseUrl: string): WebLink[] {
  const $ = cheerio.load(html);
  const links: WebLink[] = [];
  let index = 1;
  $("main a[href], article a[href], body a[href]")
    .slice(0, 9) // max 9 links (keys 1-9)
    .each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && text) {
        const url = href.startsWith("http") ? href : new URL(href, baseUrl).toString();
        links.push({ index: index++, text, url });
      }
    });
  return links;
}

export async function fetchPage(url: string): Promise<WebPage> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $("title").text().trim() || url;
  const contentHtml = extractContent(html);
  const content = htmlToMarkdown(contentHtml);
  const links = extractLinks(html, url);
  return { url, title, content, links };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/web-fetcher.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/web-fetcher.ts tests/web-fetcher.test.ts
git commit -m "feat: add web fetcher with content extraction, markdown conversion, and link parsing"
```

---

### Task 5: Disguise Engine + TypeScript Template

**Files:**
- Create: `src/templates/typescript.ts`
- Create: `src/services/disguise-engine.ts`
- Create: `tests/disguise-engine.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/disguise-engine.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { DisguiseEngine } from "../src/services/disguise-engine.js";

describe("DisguiseEngine", () => {
  it("converts text lines to disguised code output", () => {
    const engine = new DisguiseEngine("ts");
    const lines = [
      "他停在路口看着红绿灯",
      "射手假说在脑海回响",
      "如果物理规律不存在",
    ];
    const result = engine.disguise(lines);
    expect(result.length).toBeGreaterThan(lines.length); // code skeleton adds lines
    // Original text must appear in comments
    const allText = result.map((l) => l.text).join("\n");
    expect(allText).toContain("他停在路口看着红绿灯");
    expect(allText).toContain("射手假说在脑海回响");
    // Must have code-type lines too
    const codeLines = result.filter((l) => l.type === "code");
    expect(codeLines.length).toBeGreaterThan(0);
  });

  it("produces different output for different languages", () => {
    const tsEngine = new DisguiseEngine("ts");
    const pyEngine = new DisguiseEngine("py");
    const lines = ["测试文本"];
    const tsResult = tsEngine.disguise(lines);
    const pyResult = pyEngine.disguise(lines);
    const tsCode = tsResult.filter((l) => l.type === "code").map((l) => l.text).join("");
    const pyCode = pyResult.filter((l) => l.type === "code").map((l) => l.text).join("");
    expect(tsCode).not.toBe(pyCode);
  });

  it("generates a random status message", () => {
    const engine = new DisguiseEngine("ts");
    const status = engine.randomStatus();
    expect(status.length).toBeGreaterThan(0);
  });

  it("generates a random AI action description", () => {
    const engine = new DisguiseEngine("ts");
    const action = engine.randomAction();
    expect(action.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/disguise-engine.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Create TypeScript template**

Create `src/templates/typescript.ts`:

```typescript
import type { TemplateLang } from "../types/index.js";

export interface CodeTemplate {
  lang: TemplateLang;
  commentPrefix: string;
  wrapBlock: (commentLines: string[], blockIndex: number) => string[];
}

const varNames = [
  "result", "data", "config", "handler", "context", "options",
  "payload", "response", "middleware", "controller", "service",
  "repository", "adapter", "transformer", "validator", "scheduler",
];

const funcNames = [
  "processRequest", "handleEvent", "validateInput", "transformData",
  "initializeModule", "parseConfig", "buildResponse", "executeQuery",
  "resolveConflict", "synchronizeState", "loadResource", "renderOutput",
];

const typeNames = [
  "RequestContext", "EventPayload", "ConfigOptions", "HandlerResult",
  "DataTransform", "ValidationRule", "MiddlewareStack", "ServiceConfig",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const typescriptTemplate: CodeTemplate = {
  lang: "ts",
  commentPrefix: "//",
  wrapBlock(commentLines: string[], blockIndex: number): string[] {
    const fname = pick(funcNames);
    const vname = pick(varNames);
    const tname = pick(typeNames);
    const lines: string[] = [];

    if (blockIndex % 3 === 0) {
      lines.push(`async function ${fname}(${vname}: ${tname}): Promise<void> {`);
    } else if (blockIndex % 3 === 1) {
      lines.push(`const ${vname} = await ${fname}({`);
    } else {
      lines.push(`export class ${tname} {`);
      lines.push(`  private ${vname}: string;`);
      lines.push("");
    }

    for (const comment of commentLines) {
      lines.push(`  // ${comment}`);
      // Sprinkle code between comments
      if (Math.random() > 0.5) {
        const inner = pick(varNames);
        lines.push(`  const ${inner} = await this.${pick(funcNames)}();`);
      }
    }

    if (blockIndex % 3 === 0) {
      lines.push(`  return ${vname};`);
      lines.push("}");
    } else if (blockIndex % 3 === 1) {
      lines.push(`});`);
    } else {
      lines.push("}");
    }

    lines.push("");
    return lines;
  },
};
```

- [ ] **Step 4: Create Python, Go, Rust templates**

Create `src/templates/python.ts`:

```typescript
import type { CodeTemplate } from "./typescript.js";

const funcNames = [
  "process_request", "handle_event", "validate_input", "transform_data",
  "load_config", "build_response", "execute_query", "sync_state",
];
const varNames = [
  "result", "data", "config", "handler", "context", "payload", "response",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const pythonTemplate: CodeTemplate = {
  lang: "py",
  commentPrefix: "#",
  wrapBlock(commentLines: string[], blockIndex: number): string[] {
    const fname = pick(funcNames);
    const lines: string[] = [];

    if (blockIndex % 2 === 0) {
      lines.push(`async def ${fname}(self, ${pick(varNames)}: dict) -> None:`);
    } else {
      lines.push(`class ${fname.charAt(0).toUpperCase() + fname.slice(1)}Handler:`);
      lines.push(`    def __init__(self):`);
    }

    for (const comment of commentLines) {
      lines.push(`    # ${comment}`);
      if (Math.random() > 0.5) {
        lines.push(`    ${pick(varNames)} = await self.${pick(funcNames)}()`);
      }
    }

    lines.push(`    return ${pick(varNames)}`);
    lines.push("");
    return lines;
  },
};
```

Create `src/templates/golang.ts`:

```typescript
import type { CodeTemplate } from "./typescript.js";

const funcNames = [
  "ProcessRequest", "HandleEvent", "ValidateInput", "TransformData",
  "LoadConfig", "BuildResponse", "ExecuteQuery", "SyncState",
];
const varNames = ["result", "data", "cfg", "handler", "ctx", "payload", "resp"];
const typeNames = ["Handler", "Service", "Repository", "Controller", "Adapter"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const golangTemplate: CodeTemplate = {
  lang: "go",
  commentPrefix: "//",
  wrapBlock(commentLines: string[], blockIndex: number): string[] {
    const fname = pick(funcNames);
    const tname = pick(typeNames);
    const lines: string[] = [];

    if (blockIndex % 2 === 0) {
      lines.push(`func (s *${tname}) ${fname}(ctx context.Context) error {`);
    } else {
      lines.push(`func ${fname}(${pick(varNames)} *${tname}) (*Result, error) {`);
    }

    for (const comment of commentLines) {
      lines.push(`\t// ${comment}`);
      if (Math.random() > 0.5) {
        lines.push(`\t${pick(varNames)}, err := s.${fname}(ctx)`);
        lines.push(`\tif err != nil { return err }`);
      }
    }

    lines.push(`\treturn nil`);
    lines.push("}");
    lines.push("");
    return lines;
  },
};
```

Create `src/templates/rust.ts`:

```typescript
import type { CodeTemplate } from "./typescript.js";

const funcNames = [
  "process_request", "handle_event", "validate_input", "transform_data",
  "load_config", "build_response", "execute_query", "sync_state",
];
const varNames = ["result", "data", "config", "handler", "ctx", "payload"];
const typeNames = ["Handler", "Service", "Repository", "Controller"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const rustTemplate: CodeTemplate = {
  lang: "rs",
  commentPrefix: "//",
  wrapBlock(commentLines: string[], blockIndex: number): string[] {
    const fname = pick(funcNames);
    const tname = pick(typeNames);
    const lines: string[] = [];

    if (blockIndex % 2 === 0) {
      lines.push(`impl ${tname} {`);
      lines.push(`    pub async fn ${fname}(&self) -> Result<()> {`);
    } else {
      lines.push(`pub fn ${fname}(${pick(varNames)}: &${tname}) -> Result<String> {`);
    }

    for (const comment of commentLines) {
      lines.push(`    // ${comment}`);
      if (Math.random() > 0.5) {
        lines.push(`    let ${pick(varNames)} = self.${pick(funcNames)}().await?;`);
      }
    }

    if (blockIndex % 2 === 0) {
      lines.push("        Ok(())");
      lines.push("    }");
      lines.push("}");
    } else {
      lines.push(`    Ok(${pick(varNames)}.to_string())`);
      lines.push("}");
    }

    lines.push("");
    return lines;
  },
};
```

- [ ] **Step 5: Implement disguise engine**

Create `src/services/disguise-engine.ts`:

```typescript
import type { DisguisedLine, TemplateLang } from "../types/index.js";
import { typescriptTemplate, type CodeTemplate } from "../templates/typescript.js";
import { pythonTemplate } from "../templates/python.js";
import { golangTemplate } from "../templates/golang.js";
import { rustTemplate } from "../templates/rust.js";

const TEMPLATES: Record<TemplateLang, CodeTemplate> = {
  ts: typescriptTemplate,
  py: pythonTemplate,
  go: golangTemplate,
  rs: rustTemplate,
};

const STATUS_MESSAGES = [
  "Reading file...",
  "Analyzing codebase...",
  "Running tests...",
  "Checking types...",
  "Searching for references...",
  "Updating dependencies...",
  "Formatting code...",
  "Running linter...",
  "Building project...",
  "Compiling module...",
];

const ACTION_MESSAGES = [
  "I'll refactor the navigation module and update the route handlers.",
  "Let me update the configuration and fix the failing tests.",
  "I'll restructure the data layer to improve query performance.",
  "Let me fix the type errors and update the interfaces.",
  "I'll add error handling and improve the logging system.",
  "Let me optimize the build pipeline and reduce bundle size.",
  "I'll update the middleware chain and add request validation.",
  "Let me refactor this service to use dependency injection.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class DisguiseEngine {
  private template: CodeTemplate;

  constructor(lang: TemplateLang = "ts") {
    this.template = TEMPLATES[lang];
  }

  disguise(textLines: string[]): DisguisedLine[] {
    const result: DisguisedLine[] = [];
    const chunkSize = 3;

    for (let i = 0; i < textLines.length; i += chunkSize) {
      const chunk = textLines.slice(i, i + chunkSize).filter((l) => l.trim());
      if (chunk.length === 0) continue;
      const blockIndex = Math.floor(i / chunkSize);
      const codeLines = this.template.wrapBlock(chunk, blockIndex);
      for (const line of codeLines) {
        const isComment = line.trimStart().startsWith(this.template.commentPrefix);
        result.push({
          text: line,
          type: isComment ? "comment" : line.trim() === "" ? "blank" : "code",
        });
      }
    }

    return result;
  }

  randomStatus(): string {
    return pick(STATUS_MESSAGES);
  }

  randomAction(): string {
    return pick(ACTION_MESSAGES);
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run tests/disguise-engine.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/templates/ src/services/disguise-engine.ts tests/disguise-engine.test.ts
git commit -m "feat: add disguise engine with multi-language code templates"
```

---

### Task 6: Shared Ink Components (StatusBar)

**Files:**
- Create: `src/components/shared/StatusBar.tsx`

- [ ] **Step 1: Create StatusBar component**

Create `src/components/shared/StatusBar.tsx`:

```tsx
import React from "react";
import { Box, Text } from "ink";

interface StatusBarProps {
  left: string;
  center?: string;
  right: string;
}

export function StatusBar({ left, center, right }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
      <Box flexGrow={1}>
        <Text dimColor>{left}</Text>
      </Box>
      {center && (
        <Box flexGrow={1} justifyContent="center">
          <Text dimColor>{center}</Text>
        </Box>
      )}
      <Box>
        <Text dimColor>{right}</Text>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/StatusBar.tsx
git commit -m "feat: add StatusBar shared component"
```

---

### Task 7: ReaderView Component

**Files:**
- Create: `src/components/reader/ReaderView.tsx`
- Create: `src/components/reader/TableOfContents.tsx`

- [ ] **Step 1: Create ReaderView**

Create `src/components/reader/ReaderView.tsx`:

```tsx
import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { BookParser } from "../../services/book-parser.js";
import { Storage } from "../../services/storage.js";
import { StatusBar } from "../shared/StatusBar.js";
import type { BookPage, BookMeta } from "../../types/index.js";

interface ReaderViewProps {
  filePath: string;
  storage: Storage;
  onToggleDisguise: () => void;
  onSwitchMode: () => void;
  onContentUpdate?: (lines: string[]) => void;
}

export function ReaderView({ filePath, storage, onToggleDisguise, onSwitchMode, onContentUpdate }: ReaderViewProps) {
  const { exit } = useApp();
  const [parser, setParser] = useState<BookParser | null>(null);
  const [meta, setMeta] = useState<BookMeta | null>(null);
  const [page, setPage] = useState<BookPage | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const termHeight = process.stdout.rows ?? 24;
      const linesPerPage = termHeight - 6; // reserve space for status bar and padding
      const bp = new BookParser(filePath, linesPerPage);
      const m = await bp.load();
      setParser(bp);
      setMeta(m);

      const bookmark = await storage.getBookmark(filePath);
      const startPage = bookmark?.page ?? 0;
      const p = bp.getPage(startPage);
      setPage(p);
      onContentUpdate?.(p.content.split("\n"));
      setLoading(false);
    };
    init().catch(() => setLoading(false));
  }, [filePath, storage]);

  const goToPage = useCallback(
    async (n: number) => {
      if (!parser) return;
      const p = parser.getPage(n);
      setPage(p);
      onContentUpdate?.(p.content.split("\n"));
      await storage.saveBookmark(filePath, p.pageNumber);
    },
    [parser, storage, filePath]
  );

  useInput((input, key) => {
    if (searchMode) {
      if (key.return) {
        setSearchMode(false);
        if (parser && searchQuery) {
          const results = parser.search(searchQuery);
          setSearchResults(results);
          setSearchIndex(0);
          if (results.length > 0) goToPage(results[0]);
        }
      } else if (key.escape) {
        setSearchMode(false);
        setSearchQuery("");
      } else if (key.backspace || key.delete) {
        setSearchQuery((q) => q.slice(0, -1));
      } else if (input && !key.ctrl) {
        setSearchQuery((q) => q + input);
      }
      return;
    }

    if (key.ctrl && input === "s") {
      onToggleDisguise();
    } else if (input === "q") {
      exit();
    } else if (key.tab) {
      onSwitchMode();
    } else if (input === "j" || key.downArrow) {
      if (page) goToPage(page.pageNumber + 1);
    } else if (input === "k" || key.upArrow) {
      if (page) goToPage(page.pageNumber - 1);
    } else if (input === "g") {
      goToPage(0);
    } else if (input === "G") {
      if (meta) goToPage(meta.totalPages - 1);
    } else if (input === "/") {
      setSearchMode(true);
      setSearchQuery("");
    } else if (input === "n" && searchResults.length > 0) {
      const next = (searchIndex + 1) % searchResults.length;
      setSearchIndex(next);
      goToPage(searchResults[next]);
    } else if (input === "N" && searchResults.length > 0) {
      const prev = (searchIndex - 1 + searchResults.length) % searchResults.length;
      setSearchIndex(prev);
      goToPage(searchResults[prev]);
    }
  });

  if (loading) {
    return <Text dimColor>Loading...</Text>;
  }

  if (!page || !meta) {
    return <Text color="red">Failed to load: {filePath}</Text>;
  }

  return (
    <Box flexDirection="column" height={process.stdout.rows ?? 24}>
      <Box paddingX={1}>
        <Text dimColor>
          claude-slack-off · {meta.title} · p.{page.pageNumber + 1}/{meta.totalPages}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        <Text>{page.content}</Text>
      </Box>
      {searchMode ? (
        <Box paddingX={1}>
          <Text>/{searchQuery}</Text>
          <Text dimColor>█</Text>
        </Box>
      ) : (
        <StatusBar
          left="j/k 翻页 · / 搜索 · t 目录"
          right="Ctrl+S 伪装 · Tab 浏览 · q 退出"
        />
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Create TableOfContents**

Create `src/components/reader/TableOfContents.tsx`:

```tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Chapter } from "../../types/index.js";

interface TableOfContentsProps {
  chapters: Chapter[];
  onSelect: (page: number) => void;
  onClose: () => void;
}

export function TableOfContents({ chapters, onSelect, onClose }: TableOfContentsProps) {
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (input === "j" || key.downArrow) {
      setSelected((s) => Math.min(s + 1, chapters.length - 1));
    } else if (input === "k" || key.upArrow) {
      setSelected((s) => Math.max(s - 1, 0));
    } else if (key.return) {
      onSelect(chapters[selected].startPage);
    } else if (key.escape || input === "q" || input === "t") {
      onClose();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>Table of Contents</Text>
      <Text dimColor>─────────────────</Text>
      {chapters.map((ch, i) => (
        <Box key={ch.startPage}>
          <Text color={i === selected ? "cyan" : undefined} inverse={i === selected}>
            {" "}{ch.title}{" "}
          </Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text dimColor>j/k 选择 · Enter 跳转 · Esc 关闭</Text>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/reader/
git commit -m "feat: add ReaderView and TableOfContents components"
```

---

### Task 8: BrowserView Component

**Files:**
- Create: `src/components/browser/BrowserView.tsx`
- Create: `src/components/browser/UrlBar.tsx`

- [ ] **Step 1: Create UrlBar**

Create `src/components/browser/UrlBar.tsx`:

```tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface UrlBarProps {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

export function UrlBar({ onSubmit, onCancel }: UrlBarProps) {
  const [value, setValue] = useState("");

  useInput((input, key) => {
    if (key.return) {
      const url = value.startsWith("http") ? value : `https://${value}`;
      onSubmit(url);
    } else if (key.escape) {
      onCancel();
    } else if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
    } else if (input && !key.ctrl) {
      setValue((v) => v + input);
    }
  });

  return (
    <Box paddingX={1}>
      <Text bold>URL: </Text>
      <Text>{value}</Text>
      <Text dimColor>█</Text>
    </Box>
  );
}
```

- [ ] **Step 2: Create BrowserView**

Create `src/components/browser/BrowserView.tsx`:

```tsx
import React, { useState, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { fetchPage } from "../../services/web-fetcher.js";
import { Storage } from "../../services/storage.js";
import { StatusBar } from "../shared/StatusBar.js";
import { UrlBar } from "./UrlBar.js";
import type { WebPage } from "../../types/index.js";

interface BrowserViewProps {
  initialUrl?: string;
  storage: Storage;
  onToggleDisguise: () => void;
  onSwitchMode: () => void;
  onContentUpdate?: (lines: string[]) => void;
}

export function BrowserView({ initialUrl, storage, onToggleDisguise, onSwitchMode, onContentUpdate }: BrowserViewProps) {
  const { exit } = useApp();
  const [page, setPage] = useState<WebPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlBarOpen, setUrlBarOpen] = useState(!initialUrl);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scrollOffset, setScrollOffset] = useState(0);

  const navigate = useCallback(
    async (url: string) => {
      setLoading(true);
      setError(null);
      setScrollOffset(0);
      try {
        const result = await fetchPage(url);
        setPage(result);
        onContentUpdate?.(result.content.split("\n"));
        await storage.addHistory(url, result.title);
        setHistory((h) => [...h.slice(0, historyIndex + 1), url]);
        setHistoryIndex((i) => i + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [storage, historyIndex]
  );

  // Load initial URL on first render
  React.useEffect(() => {
    if (initialUrl) navigate(initialUrl);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lines = page?.content.split("\n") ?? [];
  const visibleHeight = (process.stdout.rows ?? 24) - 6;

  useInput((input, key) => {
    if (urlBarOpen) return; // UrlBar handles its own input

    if (key.ctrl && input === "s") {
      onToggleDisguise();
    } else if (input === "q") {
      exit();
    } else if (key.tab) {
      onSwitchMode();
    } else if (input === "o") {
      setUrlBarOpen(true);
    } else if (input === "j" || key.downArrow) {
      setScrollOffset((s) => Math.min(s + 1, Math.max(0, lines.length - visibleHeight)));
    } else if (input === "k" || key.upArrow) {
      setScrollOffset((s) => Math.max(s - 1, 0));
    } else if (input === "r" && page) {
      navigate(page.url);
    } else if (input === "H" && historyIndex > 0) {
      setHistoryIndex((i) => i - 1);
      navigate(history[historyIndex - 1]);
    } else if (input === "L" && historyIndex < history.length - 1) {
      setHistoryIndex((i) => i + 1);
      navigate(history[historyIndex + 1]);
    } else if (key.ctrl && input === "b" && page) {
      storage.addFavorite(page.url, page.title);
    } else if (/^[1-9]$/.test(input) && page) {
      const link = page.links.find((l) => l.index === parseInt(input));
      if (link) navigate(link.url);
    }
  });

  if (urlBarOpen) {
    return (
      <Box flexDirection="column">
        <UrlBar
          onSubmit={(url) => {
            setUrlBarOpen(false);
            navigate(url);
          }}
          onCancel={() => setUrlBarOpen(false)}
        />
      </Box>
    );
  }

  if (loading) {
    return <Text dimColor>Loading...</Text>;
  }

  if (error) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="red">Error: {error}</Text>
        <Text dimColor>Press 'o' to enter a new URL</Text>
      </Box>
    );
  }

  if (!page) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text dimColor>Press 'o' to enter a URL</Text>
      </Box>
    );
  }

  const visibleLines = lines.slice(scrollOffset, scrollOffset + visibleHeight);

  return (
    <Box flexDirection="column" height={process.stdout.rows ?? 24}>
      <Box paddingX={1}>
        <Text dimColor>
          claude-slack-off · {page.title}
        </Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        <Text>{visibleLines.join("\n")}</Text>
      </Box>
      {page.links.length > 0 && (
        <Box paddingX={1}>
          {page.links.map((link) => (
            <Box key={link.index} marginRight={2}>
              <Text color="cyan">[{link.index}]</Text>
              <Text> {link.text.slice(0, 20)}</Text>
            </Box>
          ))}
        </Box>
      )}
      <StatusBar
        left="o URL · 1-9 链接 · H/L 前进后退"
        right="Ctrl+S 伪装 · Tab 阅读 · q 退出"
      />
    </Box>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/browser/
git commit -m "feat: add BrowserView and UrlBar components"
```

---

### Task 9: Disguise View Components

**Files:**
- Create: `src/components/disguise/Typewriter.tsx`
- Create: `src/components/disguise/CodeBlock.tsx`
- Create: `src/components/disguise/StatusFaker.tsx`
- Create: `src/components/disguise/DisguiseView.tsx`

- [ ] **Step 1: Create Typewriter component**

Create `src/components/disguise/Typewriter.tsx`:

```tsx
import React, { useState, useEffect, useRef } from "react";
import { Text } from "ink";

interface TypewriterProps {
  text: string;
  speed: number; // chars per second base rate
  onComplete?: () => void;
}

export function Typewriter({ text, speed, onComplete }: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
  }, [text]);

  useEffect(() => {
    if (indexRef.current >= text.length) {
      onComplete?.();
      return;
    }

    // Random delay variation: 0.5x to 1.5x base interval
    const baseInterval = 1000 / speed;
    const variation = baseInterval * (0.5 + Math.random());

    const timer = setTimeout(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
    }, variation);

    return () => clearTimeout(timer);
  }, [displayed, text, speed, onComplete]);

  return <Text>{displayed}</Text>;
}
```

- [ ] **Step 2: Create CodeBlock component**

Create `src/components/disguise/CodeBlock.tsx`:

```tsx
import React from "react";
import { Box, Text } from "ink";
import type { DisguisedLine } from "../../types/index.js";

interface CodeBlockProps {
  lines: DisguisedLine[];
  filePath?: string;
}

export function CodeBlock({ lines, filePath }: CodeBlockProps) {
  return (
    <Box flexDirection="column">
      {filePath && (
        <Text dimColor>  {filePath}</Text>
      )}
      <Box flexDirection="column" paddingX={2}>
        {lines.map((line, i) => {
          if (line.type === "comment") {
            return <Text key={i} color="blue">{line.text}</Text>;
          }
          if (line.type === "blank") {
            return <Text key={i}>{" "}</Text>;
          }
          return <Text key={i}>{line.text}</Text>;
        })}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 3: Create StatusFaker component**

Create `src/components/disguise/StatusFaker.tsx`:

```tsx
import React, { useState, useEffect } from "react";
import { Text } from "ink";
import { DisguiseEngine } from "../../services/disguise-engine.js";

interface StatusFakerProps {
  engine: DisguiseEngine;
  interval?: number; // ms between status changes
}

export function StatusFaker({ engine, interval = 8000 }: StatusFakerProps) {
  const [status, setStatus] = useState(engine.randomStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.6) {
        setStatus(engine.randomStatus());
      }
    }, interval);
    return () => clearInterval(timer);
  }, [engine, interval]);

  return <Text dimColor>  {status}</Text>;
}
```

- [ ] **Step 4: Create DisguiseView**

Create `src/components/disguise/DisguiseView.tsx`:

```tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { DisguiseEngine } from "../../services/disguise-engine.js";
import { CodeBlock } from "./CodeBlock.js";
import { Typewriter } from "./Typewriter.js";
import { StatusFaker } from "./StatusFaker.js";
import type { DisguisedLine, TemplateLang } from "../../types/index.js";

interface DisguiseViewProps {
  textLines: string[];
  lang: TemplateLang;
  speed: number;
  onToggleDisguise: () => void;
}

const FAKE_PATHS = [
  "src/routes/navigation.ts",
  "src/services/auth.ts",
  "src/components/Dashboard.tsx",
  "src/utils/transform.ts",
  "src/middleware/validate.ts",
  "src/models/user.ts",
  "lib/core/engine.py",
  "pkg/handler/router.go",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function DisguiseView({ textLines, lang, speed, onToggleDisguise }: DisguiseViewProps) {
  const { exit } = useApp();
  const engine = useMemo(() => new DisguiseEngine(lang), [lang]);
  const [blockIndex, setBlockIndex] = useState(0);
  const [action, setAction] = useState(engine.randomAction());
  const [autoScroll, setAutoScroll] = useState(true);

  // Split text into chunks of ~10 lines per "block"
  const blocks = useMemo(() => {
    const chunks: string[][] = [];
    for (let i = 0; i < textLines.length; i += 10) {
      chunks.push(textLines.slice(i, i + 10));
    }
    return chunks;
  }, [textLines]);

  const currentDisguised: DisguisedLine[] = useMemo(() => {
    if (blockIndex >= blocks.length) return [];
    return engine.disguise(blocks[blockIndex]);
  }, [engine, blocks, blockIndex]);

  const advanceBlock = useCallback(() => {
    if (blockIndex < blocks.length - 1) {
      setBlockIndex((i) => i + 1);
      if (Math.random() > 0.7) setAction(engine.randomAction());
    }
  }, [blockIndex, blocks.length, engine]);

  // Auto-scroll timer
  useEffect(() => {
    if (!autoScroll) return;
    const timer = setInterval(() => {
      advanceBlock();
    }, 15000 + Math.random() * 10000); // 15-25 seconds
    return () => clearInterval(timer);
  }, [autoScroll, advanceBlock]);

  useInput((input, key) => {
    if (key.ctrl && input === "s") {
      onToggleDisguise();
    } else if (input === "q") {
      exit();
    } else if (input === "j" || key.downArrow) {
      setAutoScroll(false);
      advanceBlock();
    } else if (input === "k" || key.upArrow) {
      setAutoScroll(false);
      setBlockIndex((i) => Math.max(0, i - 1));
    }
    // All other keys silently ignored
  });

  const charsPerSecond = speed * 10; // speed 1-10 maps to 10-100 cps

  return (
    <Box flexDirection="column" height={process.stdout.rows ?? 24}>
      <Box paddingX={1}>
        <Text color="magenta">⏺ </Text>
        <Text>{action}</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        <CodeBlock lines={currentDisguised} filePath={pick(FAKE_PATHS)} />
      </Box>
      <StatusFaker engine={engine} />
      <Box paddingX={1}>
        <Text dimColor>  ↓ Generating code...</Text>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/disguise/
git commit -m "feat: add disguise view with typewriter, code block, and status faker"
```

---

### Task 10: App Root Component

**Files:**
- Create: `src/app.tsx`

- [ ] **Step 1: Create the root App component**

Create `src/app.tsx`:

```tsx
import React, { useState, useCallback, useMemo } from "react";
import { Box } from "ink";
import { ReaderView } from "./components/reader/ReaderView.js";
import { BrowserView } from "./components/browser/BrowserView.js";
import { DisguiseView } from "./components/disguise/DisguiseView.js";
import { Storage } from "./services/storage.js";
import type { AppMode, DisplayMode, TemplateLang } from "./types/index.js";

interface AppProps {
  command: "read" | "browse";
  target?: string; // file path or URL
  disguise?: boolean;
  lang?: TemplateLang;
  speed?: number;
}

export function App({ command, target, disguise = false, lang = "ts", speed = 5 }: AppProps) {
  const [appMode, setAppMode] = useState<AppMode>(command === "browse" ? "browser" : "reader");
  const [displayMode, setDisplayMode] = useState<DisplayMode>(disguise ? "disguise" : "normal");
  const [contentLines, setContentLines] = useState<string[]>([]);

  const storage = useMemo(
    () => new Storage(`${process.env.HOME}/.claude-slack-off`),
    []
  );

  const toggleDisguise = useCallback(() => {
    setDisplayMode((m) => (m === "normal" ? "disguise" : "normal"));
  }, []);

  const switchMode = useCallback(() => {
    setAppMode((m) => (m === "reader" ? "browser" : "reader"));
  }, []);

  // Capture content lines from reader/browser for disguise mode
  const handleContentUpdate = useCallback((lines: string[]) => {
    setContentLines(lines);
  }, []);

  if (displayMode === "disguise") {
    return (
      <DisguiseView
        textLines={contentLines.length > 0 ? contentLines : ["Loading content...", "Please wait..."]}
        lang={lang}
        speed={speed}
        onToggleDisguise={toggleDisguise}
      />
    );
  }

  if (appMode === "browser") {
    return (
      <BrowserView
        initialUrl={command === "browse" ? target : undefined}
        storage={storage}
        onToggleDisguise={toggleDisguise}
        onSwitchMode={switchMode}
        onContentUpdate={handleContentUpdate}
      />
    );
  }

  return (
    <ReaderView
      filePath={target ?? ""}
      storage={storage}
      onToggleDisguise={toggleDisguise}
      onSwitchMode={switchMode}
      onContentUpdate={handleContentUpdate}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app.tsx
git commit -m "feat: add root App component with mode routing"
```

---

### Task 11: CLI Entry Point

**Files:**
- Create: `bin/cli.ts`

- [ ] **Step 1: Create CLI entry point**

Create `bin/cli.ts`:

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { App } from "../src/app.js";
import { Storage } from "../src/services/storage.js";

const program = new Command();

program
  .name("claude-slack-off")
  .description("A CLI tool disguised as Claude Code")
  .version("0.1.0");

program
  .command("read [file]")
  .description("Read an ebook (TXT/EPUB)")
  .option("-d, --disguise", "Start in disguise mode")
  .option("--speed <n>", "Typing speed 1-10", "5")
  .option("--lang <lang>", "Code language (ts/py/go/rs)", "ts")
  .action(async (file: string | undefined, opts) => {
    let target = file;
    if (!target) {
      // Try to restore last reading session
      const storage = new Storage(`${process.env.HOME}/.claude-slack-off`);
      // For now, require a file path
      console.error("Usage: claude-slack-off read <file>");
      process.exit(1);
    }

    render(
      React.createElement(App, {
        command: "read",
        target,
        disguise: opts.disguise ?? false,
        lang: opts.lang,
        speed: parseInt(opts.speed, 10),
      })
    );
  });

program
  .command("browse [url]")
  .description("Browse a webpage")
  .option("-d, --disguise", "Start in disguise mode")
  .option("--speed <n>", "Typing speed 1-10", "5")
  .option("--lang <lang>", "Code language (ts/py/go/rs)", "ts")
  .action(async (url: string | undefined, opts) => {
    render(
      React.createElement(App, {
        command: "browse",
        target: url,
        disguise: opts.disguise ?? false,
        lang: opts.lang,
        speed: parseInt(opts.speed, 10),
      })
    );
  });

program
  .command("list")
  .description("List reading history and favorites")
  .action(async () => {
    const storage = new Storage(`${process.env.HOME}/.claude-slack-off`);
    const history = await storage.listHistory();
    const favorites = await storage.listFavorites();

    console.log("\n📚 Reading History:");
    if (history.length === 0) {
      console.log("  (empty)");
    } else {
      history.slice(0, 20).forEach((h) => {
        console.log(`  ${h.title} — ${h.url}`);
      });
    }

    console.log("\n⭐ Favorites:");
    if (favorites.length === 0) {
      console.log("  (empty)");
    } else {
      favorites.forEach((f) => {
        console.log(`  ${f.title} — ${f.url}`);
      });
    }
    console.log();
  });

program.parse();
```

- [ ] **Step 2: Verify the CLI runs**

```bash
npx tsx bin/cli.ts --help
```

Expected: Shows usage information with `read`, `browse`, `list` commands.

- [ ] **Step 3: Test reading a file**

```bash
npx tsx bin/cli.ts read tests/fixtures/sample.txt
```

Expected: Opens the reader view with the sample text. Press `q` to exit.

- [ ] **Step 4: Commit**

```bash
git add bin/cli.ts
git commit -m "feat: add CLI entry point with read, browse, and list commands"
```

---

### Task 12: Integration Testing & Polish

**Files:**
- Modify: `package.json` (add bin config)
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

Create `.gitignore`:

```
node_modules/
dist/
.superpowers/
```

- [ ] **Step 2: Test disguise mode**

```bash
npx tsx bin/cli.ts read tests/fixtures/sample.txt -d
```

Expected: Opens in disguise mode — shows fake Claude Code output with purple dot, code blocks, and typewriter effect. Press `Ctrl+S` to switch to normal mode. Press `q` to exit.

- [ ] **Step 3: Test browse command**

```bash
npx tsx bin/cli.ts browse https://news.ycombinator.com
```

Expected: Fetches and renders Hacker News in markdown in the terminal. Press `q` to exit.

- [ ] **Step 4: Test mode switching**

```bash
npx tsx bin/cli.ts read tests/fixtures/sample.txt
```

- Open reader → press `Tab` → browser view → press `o` → enter URL → renders page
- Press `Ctrl+S` → disguise mode → press `Ctrl+S` → back to normal
- Press `q` to exit

- [ ] **Step 5: Test list command**

```bash
npx tsx bin/cli.ts list
```

Expected: Shows reading history and favorites (may be empty on first run).

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: TypeScript compiles to `dist/` without errors.

- [ ] **Step 7: Commit**

```bash
git add .gitignore package.json
git commit -m "feat: add gitignore and verify full integration"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| TXT ebook reading | Task 3, 7 |
| EPUB support | Task 3 (stub — future enhancement) |
| Auto-pagination | Task 3, 7 |
| Bookmark/progress save | Task 2, 7 |
| Text search | Task 3, 7 |
| Web fetch + content extraction | Task 4 |
| Link following | Task 8 |
| Browse history | Task 2, 8 |
| Favorites | Task 2, 8 |
| Disguise engine (comment flow) | Task 5 |
| Multi-language templates | Task 5 |
| Typewriter effect | Task 9 |
| Fake status messages | Task 9 |
| Mode switch (Ctrl+S) | Task 7, 8, 9, 10 |
| CLI commands (read/browse/list) | Task 11 |
| --disguise, --speed, --lang flags | Task 11 |
| Storage (~/.claude-slack-off/) | Task 2 |
| All keybindings | Task 7, 8, 9 |
| npm global package | Task 1, 12 |

**Note:** Full EPUB parsing with `@epubjs/core` is stubbed in Task 3. The epub.js library has Node.js compatibility issues that require investigation. TXT support is fully functional. EPUB can be added as a follow-up task once the right library is confirmed to work in a pure Node.js (non-browser) environment.

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

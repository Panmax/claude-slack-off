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

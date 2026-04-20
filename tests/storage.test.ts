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

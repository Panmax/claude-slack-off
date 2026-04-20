import { describe, it, expect } from "vitest";
import path from "node:path";
import { BookParser } from "../src/services/book-parser.js";

describe("BookParser", () => {
  const fixturePath = path.join(import.meta.dirname, "fixtures", "sample.txt");

  describe("TXT parsing", () => {
    it("loads a txt file and returns metadata", async () => {
      const parser = new BookParser(fixturePath, 5);
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

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

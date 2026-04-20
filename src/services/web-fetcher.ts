import * as cheerio from "cheerio";
import TurndownService from "turndown";
import type { WebPage, WebLink } from "../types/index.js";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export function extractContent(html: string): string {
  const $ = cheerio.load(html);
  $("nav, header, footer, aside, script, style, .sidebar, .nav, .menu, .ad, .advertisement").remove();
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
    .slice(0, 9)
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

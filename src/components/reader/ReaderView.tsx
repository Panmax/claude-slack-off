import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { BookParser } from "../../services/book-parser.js";
import { Storage } from "../../services/storage.js";
import { StatusBar } from "../shared/StatusBar.js";
import type { BookPage, BookMeta } from "../../types/index.js";

interface ReaderViewProps {
  filePath: string;
  contentLines?: string[];
  contentTitle?: string;
  storage: Storage;
  onToggleDisguise: () => void;
  onSwitchMode: () => void;
  onContentUpdate?: (lines: string[], title?: string) => void;
}

export function ReaderView({ filePath, contentLines, contentTitle, storage, onToggleDisguise, onSwitchMode, onContentUpdate }: ReaderViewProps) {
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
      const linesPerPage = termHeight - 6;

      let bp: BookParser;
      if (contentLines && contentLines.length > 0) {
        bp = BookParser.fromContent(contentTitle || "Web Page", contentLines.join("\n"), linesPerPage);
      } else {
        bp = new BookParser(filePath, linesPerPage);
        await bp.load();
      }

      setParser(bp);
      setMeta(bp.getMeta());

      const bookmarkKey = filePath || contentTitle || "";
      const bookmark = await storage.getBookmark(bookmarkKey);
      const startPage = bookmark?.page ?? 0;
      const p = bp.getPage(startPage);
      setPage(p);
      onContentUpdate?.(p.content.split("\n"));
      setLoading(false);
    };
    init().catch(() => setLoading(false));
  }, [filePath, contentLines, storage]);

  const goToPage = useCallback(
    async (n: number) => {
      if (!parser) return;
      const p = parser.getPage(n);
      setPage(p);
      onContentUpdate?.(p.content.split("\n"));
      const bookmarkKey = filePath || contentTitle || "";
      await storage.saveBookmark(bookmarkKey, p.pageNumber);
    },
    [parser, storage, filePath, contentTitle]
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

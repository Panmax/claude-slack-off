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
  onContentUpdate?: (lines: string[], title?: string) => void;
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
        onContentUpdate?.(result.content.split("\n"), result.title);
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

  React.useEffect(() => {
    if (initialUrl) navigate(initialUrl);
  }, []);

  const lines = page?.content.split("\n") ?? [];
  const visibleHeight = (process.stdout.rows ?? 24) - 6;

  useInput((input, key) => {
    if (urlBarOpen) return;

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

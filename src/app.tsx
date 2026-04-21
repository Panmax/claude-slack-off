import React, { useState, useCallback, useMemo } from "react";
import { Box } from "ink";
import { ReaderView } from "./components/reader/ReaderView.js";
import { BrowserView } from "./components/browser/BrowserView.js";
import { DisguiseView } from "./components/disguise/DisguiseView.js";
import { Storage } from "./services/storage.js";
import type { AppMode, DisplayMode, TemplateLang } from "./types/index.js";

interface AppProps {
  command: "read" | "browse";
  target?: string;
  disguise?: boolean;
  lang?: TemplateLang;
  speed?: number;
}

export function App({ command, target, disguise = false, lang = "ts", speed = 5 }: AppProps) {
  const [appMode, setAppMode] = useState<AppMode>(command === "browse" ? "browser" : "reader");
  const [displayMode, setDisplayMode] = useState<DisplayMode>(disguise ? "disguise" : "normal");
  const [contentLines, setContentLines] = useState<string[]>([]);
  const [contentTitle, setContentTitle] = useState<string>("");

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

  const handleContentUpdate = useCallback((lines: string[], title?: string) => {
    setContentLines(lines);
    if (title !== undefined) setContentTitle(title);
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
      contentLines={contentLines.length > 0 ? contentLines : undefined}
      contentTitle={contentTitle || undefined}
      storage={storage}
      onToggleDisguise={toggleDisguise}
      onSwitchMode={switchMode}
      onContentUpdate={handleContentUpdate}
    />
  );
}

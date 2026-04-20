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

  useEffect(() => {
    if (!autoScroll) return;
    const timer = setInterval(() => {
      advanceBlock();
    }, 15000 + Math.random() * 10000);
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
  });

  const charsPerSecond = speed * 10;

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

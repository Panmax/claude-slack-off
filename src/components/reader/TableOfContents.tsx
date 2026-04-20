import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Chapter } from "../../types/index.js";

interface TableOfContentsProps {
  chapters: Chapter[];
  onSelect: (page: number) => void;
  onClose: () => void;
}

export function TableOfContents({ chapters, onSelect, onClose }: TableOfContentsProps) {
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (input === "j" || key.downArrow) {
      setSelected((s) => Math.min(s + 1, chapters.length - 1));
    } else if (input === "k" || key.upArrow) {
      setSelected((s) => Math.max(s - 1, 0));
    } else if (key.return) {
      onSelect(chapters[selected].startPage);
    } else if (key.escape || input === "q" || input === "t") {
      onClose();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>Table of Contents</Text>
      <Text dimColor>─────────────────</Text>
      {chapters.map((ch, i) => (
        <Box key={ch.startPage}>
          <Text color={i === selected ? "cyan" : undefined} inverse={i === selected}>
            {" "}{ch.title}{" "}
          </Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text dimColor>j/k 选择 · Enter 跳转 · Esc 关闭</Text>
      </Box>
    </Box>
  );
}

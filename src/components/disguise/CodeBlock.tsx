import React from "react";
import { Box, Text } from "ink";
import type { DisguisedLine } from "../../types/index.js";

interface CodeBlockProps {
  lines: DisguisedLine[];
  filePath?: string;
}

export function CodeBlock({ lines, filePath }: CodeBlockProps) {
  return (
    <Box flexDirection="column">
      {filePath && (
        <Text dimColor>  {filePath}</Text>
      )}
      <Box flexDirection="column" paddingX={2}>
        {lines.map((line, i) => {
          if (line.type === "comment") {
            return <Text key={i} color="blue">{line.text}</Text>;
          }
          if (line.type === "blank") {
            return <Text key={i}>{" "}</Text>;
          }
          return <Text key={i}>{line.text}</Text>;
        })}
      </Box>
    </Box>
  );
}

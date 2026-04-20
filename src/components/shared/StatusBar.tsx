import React from "react";
import { Box, Text } from "ink";

interface StatusBarProps {
  left: string;
  center?: string;
  right: string;
}

export function StatusBar({ left, center, right }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingX={1}>
      <Box flexGrow={1}>
        <Text dimColor>{left}</Text>
      </Box>
      {center && (
        <Box flexGrow={1} justifyContent="center">
          <Text dimColor>{center}</Text>
        </Box>
      )}
      <Box>
        <Text dimColor>{right}</Text>
      </Box>
    </Box>
  );
}

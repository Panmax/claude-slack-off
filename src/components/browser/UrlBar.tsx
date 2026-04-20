import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface UrlBarProps {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

export function UrlBar({ onSubmit, onCancel }: UrlBarProps) {
  const [value, setValue] = useState("");

  useInput((input, key) => {
    if (key.return) {
      const url = value.startsWith("http") ? value : `https://${value}`;
      onSubmit(url);
    } else if (key.escape) {
      onCancel();
    } else if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
    } else if (input && !key.ctrl) {
      setValue((v) => v + input);
    }
  });

  return (
    <Box paddingX={1}>
      <Text bold>URL: </Text>
      <Text>{value}</Text>
      <Text dimColor>█</Text>
    </Box>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { Text } from "ink";

interface TypewriterProps {
  text: string;
  speed: number;
  onComplete?: () => void;
}

export function Typewriter({ text, speed, onComplete }: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
  }, [text]);

  useEffect(() => {
    if (indexRef.current >= text.length) {
      onComplete?.();
      return;
    }

    const baseInterval = 1000 / speed;
    const variation = baseInterval * (0.5 + Math.random());

    const timer = setTimeout(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
    }, variation);

    return () => clearTimeout(timer);
  }, [displayed, text, speed, onComplete]);

  return <Text>{displayed}</Text>;
}

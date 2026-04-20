import React, { useState, useEffect } from "react";
import { Text } from "ink";
import { DisguiseEngine } from "../../services/disguise-engine.js";

interface StatusFakerProps {
  engine: DisguiseEngine;
  interval?: number;
}

export function StatusFaker({ engine, interval = 8000 }: StatusFakerProps) {
  const [status, setStatus] = useState(engine.randomStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.6) {
        setStatus(engine.randomStatus());
      }
    }, interval);
    return () => clearInterval(timer);
  }, [engine, interval]);

  return <Text dimColor>  {status}</Text>;
}

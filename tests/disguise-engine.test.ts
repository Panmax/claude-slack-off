import { describe, it, expect } from "vitest";
import { DisguiseEngine } from "../src/services/disguise-engine.js";

describe("DisguiseEngine", () => {
  it("converts text lines to disguised code output", () => {
    const engine = new DisguiseEngine("ts");
    const lines = [
      "他停在路口看着红绿灯",
      "射手假说在脑海回响",
      "如果物理规律不存在",
    ];
    const result = engine.disguise(lines);
    expect(result.length).toBeGreaterThan(lines.length);
    const allText = result.map((l) => l.text).join("\n");
    expect(allText).toContain("他停在路口看着红绿灯");
    expect(allText).toContain("射手假说在脑海回响");
    const codeLines = result.filter((l) => l.type === "code");
    expect(codeLines.length).toBeGreaterThan(0);
  });

  it("produces different output for different languages", () => {
    const tsEngine = new DisguiseEngine("ts");
    const pyEngine = new DisguiseEngine("py");
    const lines = ["测试文本"];
    const tsResult = tsEngine.disguise(lines);
    const pyResult = pyEngine.disguise(lines);
    const tsCode = tsResult.filter((l) => l.type === "code").map((l) => l.text).join("");
    const pyCode = pyResult.filter((l) => l.type === "code").map((l) => l.text).join("");
    expect(tsCode).not.toBe(pyCode);
  });

  it("generates a random status message", () => {
    const engine = new DisguiseEngine("ts");
    const status = engine.randomStatus();
    expect(status.length).toBeGreaterThan(0);
  });

  it("generates a random AI action description", () => {
    const engine = new DisguiseEngine("ts");
    const action = engine.randomAction();
    expect(action.length).toBeGreaterThan(0);
  });
});

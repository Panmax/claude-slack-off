import type { CodeTemplate } from "./typescript.js";

const funcNames = [
  "process_request", "handle_event", "validate_input", "transform_data",
  "load_config", "build_response", "execute_query", "sync_state",
];
const varNames = [
  "result", "data", "config", "handler", "context", "payload", "response",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const pythonTemplate: CodeTemplate = {
  lang: "py",
  commentPrefix: "#",
  wrapBlock(commentLines: string[], blockIndex: number): string[] {
    const fname = pick(funcNames);
    const lines: string[] = [];

    if (blockIndex % 2 === 0) {
      lines.push(`async def ${fname}(self, ${pick(varNames)}: dict) -> None:`);
    } else {
      lines.push(`class ${fname.charAt(0).toUpperCase() + fname.slice(1)}Handler:`);
      lines.push(`    def __init__(self):`);
    }

    for (const comment of commentLines) {
      lines.push(`    # ${comment}`);
      if (Math.random() > 0.5) {
        lines.push(`    ${pick(varNames)} = await self.${pick(funcNames)}()`);
      }
    }

    lines.push(`    return ${pick(varNames)}`);
    lines.push("");
    return lines;
  },
};

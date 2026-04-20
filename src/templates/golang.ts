import type { CodeTemplate } from "./typescript.js";

const funcNames = [
  "ProcessRequest", "HandleEvent", "ValidateInput", "TransformData",
  "LoadConfig", "BuildResponse", "ExecuteQuery", "SyncState",
];
const varNames = ["result", "data", "cfg", "handler", "ctx", "payload", "resp"];
const typeNames = ["Handler", "Service", "Repository", "Controller", "Adapter"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const golangTemplate: CodeTemplate = {
  lang: "go",
  commentPrefix: "//",
  wrapBlock(commentLines: string[], blockIndex: number): string[] {
    const fname = pick(funcNames);
    const tname = pick(typeNames);
    const lines: string[] = [];

    if (blockIndex % 2 === 0) {
      lines.push(`func (s *${tname}) ${fname}(ctx context.Context) error {`);
    } else {
      lines.push(`func ${fname}(${pick(varNames)} *${tname}) (*Result, error) {`);
    }

    for (const comment of commentLines) {
      lines.push(`\t// ${comment}`);
      if (Math.random() > 0.5) {
        lines.push(`\t${pick(varNames)}, err := s.${fname}(ctx)`);
        lines.push(`\tif err != nil { return err }`);
      }
    }

    lines.push(`\treturn nil`);
    lines.push("}");
    lines.push("");
    return lines;
  },
};

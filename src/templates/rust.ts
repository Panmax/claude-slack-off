import type { CodeTemplate } from "./typescript.js";

const funcNames = [
  "process_request", "handle_event", "validate_input", "transform_data",
  "load_config", "build_response", "execute_query", "sync_state",
];
const varNames = ["result", "data", "config", "handler", "ctx", "payload"];
const typeNames = ["Handler", "Service", "Repository", "Controller"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const rustTemplate: CodeTemplate = {
  lang: "rs",
  commentPrefix: "//",
  wrapBlock(commentLines: string[], blockIndex: number): string[] {
    const fname = pick(funcNames);
    const tname = pick(typeNames);
    const lines: string[] = [];

    if (blockIndex % 2 === 0) {
      lines.push(`impl ${tname} {`);
      lines.push(`    pub async fn ${fname}(&self) -> Result<()> {`);
    } else {
      lines.push(`pub fn ${fname}(${pick(varNames)}: &${tname}) -> Result<String> {`);
    }

    for (const comment of commentLines) {
      lines.push(`    // ${comment}`);
      if (Math.random() > 0.5) {
        lines.push(`    let ${pick(varNames)} = self.${pick(funcNames)}().await?;`);
      }
    }

    if (blockIndex % 2 === 0) {
      lines.push("        Ok(())");
      lines.push("    }");
      lines.push("}");
    } else {
      lines.push(`    Ok(${pick(varNames)}.to_string())`);
      lines.push("}");
    }

    lines.push("");
    return lines;
  },
};

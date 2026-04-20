import type { TemplateLang } from "../types/index.js";

export interface CodeTemplate {
  lang: TemplateLang;
  commentPrefix: string;
  wrapBlock: (commentLines: string[], blockIndex: number) => string[];
}

const varNames = [
  "result", "data", "config", "handler", "context", "options",
  "payload", "response", "middleware", "controller", "service",
  "repository", "adapter", "transformer", "validator", "scheduler",
];

const funcNames = [
  "processRequest", "handleEvent", "validateInput", "transformData",
  "initializeModule", "parseConfig", "buildResponse", "executeQuery",
  "resolveConflict", "synchronizeState", "loadResource", "renderOutput",
];

const typeNames = [
  "RequestContext", "EventPayload", "ConfigOptions", "HandlerResult",
  "DataTransform", "ValidationRule", "MiddlewareStack", "ServiceConfig",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const typescriptTemplate: CodeTemplate = {
  lang: "ts",
  commentPrefix: "//",
  wrapBlock(commentLines: string[], blockIndex: number): string[] {
    const fname = pick(funcNames);
    const vname = pick(varNames);
    const tname = pick(typeNames);
    const lines: string[] = [];

    if (blockIndex % 3 === 0) {
      lines.push(`async function ${fname}(${vname}: ${tname}): Promise<void> {`);
    } else if (blockIndex % 3 === 1) {
      lines.push(`const ${vname} = await ${fname}({`);
    } else {
      lines.push(`export class ${tname} {`);
      lines.push(`  private ${vname}: string;`);
      lines.push("");
    }

    for (const comment of commentLines) {
      lines.push(`  // ${comment}`);
      if (Math.random() > 0.5) {
        const inner = pick(varNames);
        lines.push(`  const ${inner} = await this.${pick(funcNames)}();`);
      }
    }

    if (blockIndex % 3 === 0) {
      lines.push(`  return ${vname};`);
      lines.push("}");
    } else if (blockIndex % 3 === 1) {
      lines.push(`});`);
    } else {
      lines.push("}");
    }

    lines.push("");
    return lines;
  },
};

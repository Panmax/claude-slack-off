import type { DisguisedLine, TemplateLang } from "../types/index.js";
import { typescriptTemplate, type CodeTemplate } from "../templates/typescript.js";
import { pythonTemplate } from "../templates/python.js";
import { golangTemplate } from "../templates/golang.js";
import { rustTemplate } from "../templates/rust.js";

const TEMPLATES: Record<TemplateLang, CodeTemplate> = {
  ts: typescriptTemplate,
  py: pythonTemplate,
  go: golangTemplate,
  rs: rustTemplate,
};

const STATUS_MESSAGES = [
  "Reading file...",
  "Analyzing codebase...",
  "Running tests...",
  "Checking types...",
  "Searching for references...",
  "Updating dependencies...",
  "Formatting code...",
  "Running linter...",
  "Building project...",
  "Compiling module...",
];

const ACTION_MESSAGES = [
  "I'll refactor the navigation module and update the route handlers.",
  "Let me update the configuration and fix the failing tests.",
  "I'll restructure the data layer to improve query performance.",
  "Let me fix the type errors and update the interfaces.",
  "I'll add error handling and improve the logging system.",
  "Let me optimize the build pipeline and reduce bundle size.",
  "I'll update the middleware chain and add request validation.",
  "Let me refactor this service to use dependency injection.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class DisguiseEngine {
  private template: CodeTemplate;

  constructor(lang: TemplateLang = "ts") {
    this.template = TEMPLATES[lang];
  }

  disguise(textLines: string[]): DisguisedLine[] {
    const result: DisguisedLine[] = [];
    const chunkSize = 3;

    for (let i = 0; i < textLines.length; i += chunkSize) {
      const chunk = textLines.slice(i, i + chunkSize).filter((l) => l.trim());
      if (chunk.length === 0) continue;
      const blockIndex = Math.floor(i / chunkSize);
      const codeLines = this.template.wrapBlock(chunk, blockIndex);
      for (const line of codeLines) {
        const isComment = line.trimStart().startsWith(this.template.commentPrefix);
        result.push({
          text: line,
          type: isComment ? "comment" : line.trim() === "" ? "blank" : "code",
        });
      }
    }

    return result;
  }

  randomStatus(): string {
    return pick(STATUS_MESSAGES);
  }

  randomAction(): string {
    return pick(ACTION_MESSAGES);
  }
}

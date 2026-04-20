#!/usr/bin/env node
import { Command } from "commander";
import { render } from "ink";
import React from "react";
import { App } from "../src/app.js";
import { Storage } from "../src/services/storage.js";

const program = new Command();

program
  .name("claude-slack-off")
  .description("A CLI tool disguised as Claude Code")
  .version("0.1.0");

program
  .command("read [file]")
  .description("Read an ebook (TXT/EPUB)")
  .option("-d, --disguise", "Start in disguise mode")
  .option("--speed <n>", "Typing speed 1-10", "5")
  .option("--lang <lang>", "Code language (ts/py/go/rs)", "ts")
  .action(async (file: string | undefined, opts) => {
    let target = file;
    if (!target) {
      console.error("Usage: claude-slack-off read <file>");
      process.exit(1);
    }

    render(
      React.createElement(App, {
        command: "read",
        target,
        disguise: opts.disguise ?? false,
        lang: opts.lang,
        speed: parseInt(opts.speed, 10),
      })
    );
  });

program
  .command("browse [url]")
  .description("Browse a webpage")
  .option("-d, --disguise", "Start in disguise mode")
  .option("--speed <n>", "Typing speed 1-10", "5")
  .option("--lang <lang>", "Code language (ts/py/go/rs)", "ts")
  .action(async (url: string | undefined, opts) => {
    render(
      React.createElement(App, {
        command: "browse",
        target: url,
        disguise: opts.disguise ?? false,
        lang: opts.lang,
        speed: parseInt(opts.speed, 10),
      })
    );
  });

program
  .command("list")
  .description("List reading history and favorites")
  .action(async () => {
    const storage = new Storage(`${process.env.HOME}/.claude-slack-off`);
    const history = await storage.listHistory();
    const favorites = await storage.listFavorites();

    console.log("\n📚 Reading History:");
    if (history.length === 0) {
      console.log("  (empty)");
    } else {
      history.slice(0, 20).forEach((h) => {
        console.log(`  ${h.title} — ${h.url}`);
      });
    }

    console.log("\n⭐ Favorites:");
    if (favorites.length === 0) {
      console.log("  (empty)");
    } else {
      favorites.forEach((f) => {
        console.log(`  ${f.title} — ${f.url}`);
      });
    }
    console.log();
  });

program.parse();

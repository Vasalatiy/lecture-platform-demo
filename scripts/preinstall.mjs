import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const forbiddenLockfiles = ["package-lock.json", "yarn.lock"];

await Promise.all(
  forbiddenLockfiles.map((fileName) =>
    rm(resolve(root, fileName), { force: true }),
  ),
);

const userAgent = process.env.npm_config_user_agent ?? "";

if (userAgent.startsWith("pnpm/")) {
  process.exit(0);
}

const detected = userAgent || "unknown package manager";

console.error("");
console.error("This repository uses pnpm.");
console.error(`Detected: ${detected}`);
console.error("Please run commands with pnpm, for example:");
console.error("  pnpm install");
console.error("");

process.exit(1);

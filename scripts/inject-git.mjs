#!/usr/bin/env node
/**
 * Injects GIT_SHA into .env.local before build.
 * Run via: npm run prebuild (or manually before build)
 */
import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

let sha = "dev";
try {
  sha = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
} catch {
  // not a git repo or git unavailable
}

const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const lines = existing.split("\n").filter((l) => !l.startsWith("GIT_SHA=") && !l.startsWith("NEXT_PUBLIC_GIT_SHA="));
lines.push(`GIT_SHA=${sha}`);
writeFileSync(envPath, lines.join("\n").trimEnd() + "\n", "utf8");
console.log(`Injected GIT_SHA=${sha} into .env.local`);

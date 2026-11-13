#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { API_BASE, getApiKey, clearConfig, readConfig } from "../lib/config.js";
import { login, loginWithKey } from "../lib/auth.js";
import { MODELS, TOOLS } from "../lib/tools.js";

const HELP = `
  dzaistore — top AI models with one subscription

  Usage:
    npx dzaistore claude [args...]   Start Claude Code with your subscription
    npx dzaistore opencode [args...] Start OpenCode with your subscription
    npx dzaistore login              Sign in (opens your browser)
    npx dzaistore login --key sk-…   Sign in with an API key from the dashboard
    npx dzaistore usage              Show remaining 5h / 30-day usage
    npx dzaistore logout             Remove the saved key

  Any extra args are passed to the tool, e.g.:
    npx dzaistore claude --model sonnet

  Without --model you'll be asked to pick one at launch
  (or set DZAISTORE_MODEL to skip the question).
`;

function commandExists(bin) {
  const probe = process.platform === "win32" ? "where" : "which";
  return spawnSync(probe, [bin], { stdio: "ignore" }).status === 0;
}

async function ensureKey() {
  return getApiKey() || (await login());
}

async function showUsage(key, quiet = false) {
  try {
    const res = await fetch(`${API_BASE}/v1/usage`, {
      headers: { authorization: `Bearer ${key}` },
    });
    if (res.status === 401) {
      console.error("  Your key is invalid or revoked. Run `npx dzaistore login`.");
      process.exit(1);
    }
    if (res.status === 402) {
      console.error("  Your subscription is not active. Renew it on the website (CIB / Edahabia).");
      process.exit(1);
    }
    if (!res.ok) throw new Error();
    // Expected: { plan, window: { used_pct, credits_left, resets_at }, month: { used_pct, credits_left, resets_at } }
    const u = await res.json();
    const t = (iso) => new Date(iso).toLocaleString();
    console.log(`  Plan: ${u.plan}`);
    console.log(`  5h window: ${u.window.used_pct}% used — ${Math.ceil(u.window.credits_left)} credits left — resets ${t(u.window.resets_at)}`);
    console.log(`  30 days:   ${u.month.used_pct}% used — ${Math.ceil(u.month.credits_left)} credits left — resets ${t(u.month.resets_at)}\n`);
  } catch {
    if (!quiet) console.error("  Could not fetch usage right now.");
  }
}

/** Asked before Claude Code starts, unless a model or a non-interactive mode was given. */
async function chooseModel(args) {
  const passThrough = args.some((arg) =>
    arg === "--model" || arg.startsWith("--model=") ||
    ["-h", "--help", "-v", "--version", "-p", "--print"].includes(arg));
  if (passThrough) return undefined;
  if (process.env.DZAISTORE_MODEL) return process.env.DZAISTORE_MODEL;
  if (!process.stdin.isTTY) return undefined;

  console.log("\n  Choose a model for this session:\n");
  MODELS.forEach((m, i) => console.log(`  ${i + 1}) ${m.name} — ${m.note}`));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question("\n  Model [1]: ")).trim();
    const picked = MODELS[Number(answer) - 1] ?? MODELS.find((m) => m.id === answer);
    if (picked) console.log(`\n  Using ${picked.name}\n`);
    return picked?.id; // undefined keeps the default from tools.js
  } catch {
    return undefined;
  } finally {
    rl.close();
  }
}

function runTool(name, key, args, model) {
  const tool = TOOLS[name];
  const env = { ...process.env, ...tool.env(key), ...(model ? { ANTHROPIC_MODEL: model } : {}) };

  let cmd = tool.bin;
  let cmdArgs = args;
  if (!commandExists(tool.bin)) {
    console.log(`  ${tool.label} isn't installed — running it via npx (first run may take a minute)…\n`);
    [cmd, cmdArgs] = [tool.fallback[0], [...tool.fallback[1], ...args]];
  }

  const child = spawn(cmd, cmdArgs, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32", // needed for .cmd shims on Windows
  });
  child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 0));
  child.on("error", (e) => {
    console.error(`  Failed to start ${tool.label}: ${e.message}`);
    process.exit(1);
  });
  // Let the tool handle Ctrl+C itself.
  process.on("SIGINT", () => {});
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === "-h" || cmd === "--help" || cmd === "help") {
    console.log(HELP);
    return;
  }

  if (cmd === "login") {
    const i = rest.indexOf("--key");
    if (i !== -1) loginWithKey(rest[i + 1]);
    else await login();
    return;
  }

  if (cmd === "logout") {
    clearConfig();
    console.log("  ✔ Signed out.");
    return;
  }

  if (cmd === "usage") {
    const key = await ensureKey();
    const { email } = readConfig();
    if (email) console.log(`  Account: ${email}`);
    await showUsage(key);
    return;
  }

  if (TOOLS[cmd]) {
    const key = await ensureKey();
    const model = cmd === "claude" ? await chooseModel(rest) : undefined;
    await showUsage(key, true); // short status line before launching
    runTool(cmd, key, rest, model);
    return;
  }

  console.error(`  Unknown command: ${cmd}`);
  console.log(HELP);
  process.exit(1);
}

main().catch((e) => {
  console.error(`  ${e.message}`);
  process.exit(1);
});

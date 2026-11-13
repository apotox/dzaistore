import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Where the user's API key is stored (only readable by the user).
const DIR = path.join(os.homedir(), ".dzaistore");
const FILE = path.join(DIR, "config.json");

// Your gateway. Can be overridden for testing: DZAISTORE_API=http://localhost:4000
export const API_BASE = (process.env.DZAISTORE_API || "https://cli.dzai.store").replace(/\/+$/, "");

export function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
}

export function writeConfig(cfg) {
  fs.mkdirSync(DIR, { recursive: true, mode: 0o700 });
  fs.writeFileSync(FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

export function clearConfig() {
  try {
    fs.rmSync(FILE);
  } catch {}
}

export function getApiKey() {
  return process.env.DZAISTORE_API_KEY || readConfig().apiKey || null;
}

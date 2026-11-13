import { spawn } from "node:child_process";
import { API_BASE, writeConfig, readConfig } from "./config.js";

function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? "open" :
    process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", () => {});
    child.unref();
  } catch {}
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Device login flow (like `gh auth login`):
 *  1. POST /cli/device        -> { device_code, user_code, verification_url, interval, expires_in }
 *  2. user opens the URL, signs in, confirms the code
 *  3. poll POST /cli/token    -> 428 while pending, 200 { api_key, email } when approved
 */
export async function login() {
  const res = await fetch(`${API_BASE}/cli/device`, { method: "POST" });
  if (!res.ok) throw new Error(`Could not start login (HTTP ${res.status}).`);
  const d = await res.json();

  console.log("\n  Open this page to sign in / تسجيل الدخول / Connexion:");
  console.log(`\n    ${d.verification_url}\n`);
  console.log(`  Confirm this code: ${d.user_code}\n`);
  openBrowser(`${d.verification_url}?code=${encodeURIComponent(d.user_code)}`);

  const interval = (d.interval || 3) * 1000;
  const deadline = Date.now() + (d.expires_in || 600) * 1000;

  while (Date.now() < deadline) {
    await sleep(interval);
    const t = await fetch(`${API_BASE}/cli/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ device_code: d.device_code }),
    });
    if (t.status === 428) continue; // still waiting for the user
    if (!t.ok) throw new Error(`Login failed (HTTP ${t.status}).`);
    const { api_key, email } = await t.json();
    writeConfig({ ...readConfig(), apiKey: api_key, email });
    console.log(`  ✔ Signed in as ${email}\n`);
    return api_key;
  }
  throw new Error("Login timed out. Run `npx dzaistore login` again.");
}

export function loginWithKey(key) {
  if (!key || !key.startsWith("sk-")) throw new Error("That doesn't look like a valid key (should start with sk-).");
  writeConfig({ ...readConfig(), apiKey: key });
  console.log("  ✔ Key saved.\n");
  return key;
}

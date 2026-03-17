/**
 * Saves Twitter cookies from values you paste in from Chrome DevTools.
 *
 *  1. In Chrome, go to x.com (make sure you're logged in)
 *  2. Open DevTools → Application → Storage → Cookies → https://x.com
 *  3. Find and copy the values for: auth_token, ct0, twid
 *  4. Run:  npm run get-twitter-cookies
 *  5. Paste each value when prompted
 */

import fs from "fs";
import path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, "../.twitter-cookies.json");

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

(async () => {
  console.log("\n🐦 Twitter Cookie Setup");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Steps:");
  console.log("  1. Go to x.com in Chrome (make sure you're logged in)");
  console.log("  2. Open DevTools  →  F12  or  Cmd+Option+I");
  console.log("  3. Click: Application  →  Storage  →  Cookies  →  https://x.com");
  console.log("  4. Paste the values below\n");
  console.log("  TIP: Click on a row, then Cmd+C copies its Value column");
  console.log("═══════════════════════════════════════════════════════\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const authToken = (await prompt(rl, "Paste auth_token value: ")).trim();
  const ct0       = (await prompt(rl, "Paste ct0 value:        ")).trim();
  const twid      = (await prompt(rl, "Paste twid value:       ")).trim();

  rl.close();

  if (!authToken || !ct0) {
    console.error("\n❌ auth_token and ct0 are required.");
    process.exit(1);
  }

  const now = Date.now() / 1000;
  const expires = now + 60 * 60 * 24 * 365; // 1 year

  const cookies = [
    { name: "auth_token", value: authToken, domain: ".x.com", path: "/", expires, httpOnly: true,  secure: true, sameSite: "None" },
    { name: "ct0",        value: ct0,        domain: ".x.com", path: "/", expires, httpOnly: false, secure: true, sameSite: "Lax"  },
    ...(twid ? [{ name: "twid", value: twid, domain: ".x.com", path: "/", expires, httpOnly: true, secure: true, sameSite: "None" }] : []),
  ];

  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));

  console.log(`\n✅ Saved to .twitter-cookies.json`);
  console.log("Restart the dev server — Twitter feeds will now load.\n");
})();

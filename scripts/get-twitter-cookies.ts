/**
 * Run once to log into Twitter and save cookies:
 *   npm run get-twitter-cookies
 *
 * A browser window will open. Log in, then come back here —
 * cookies are saved automatically to .twitter-cookies.json
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_PATH = path.join(__dirname, "../.twitter-cookies.json");

(async () => {
  console.log("\n🐦 Twitter Cookie Extractor");
  console.log("═══════════════════════════════════════");
  console.log("A browser window is opening...");
  console.log("1. Log into Twitter / X");
  console.log("2. Once you're on your home feed, come back here");
  console.log("3. Cookies will be saved automatically\n");

  const browser = await chromium.launch({
    headless: false,
    channel: "chrome", // uses system Chrome if available
    args: ["--no-sandbox"],
  }).catch(() =>
    // fall back to Playwright's own Chromium
    chromium.launch({ headless: false, args: ["--no-sandbox"] })
  );

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  await page.goto("https://x.com/login");

  // Poll until the user lands on the home feed
  console.log("Waiting for you to log in...");
  await page.waitForURL((url) => url.hostname === "x.com" && !url.pathname.includes("login"), {
    timeout: 5 * 60 * 1000, // 5 min to log in
  });

  // Give the page a moment to settle and set all cookies
  await page.waitForTimeout(2000);

  const cookies = await context.cookies();
  const twitterCookies = cookies.filter((c) => c.domain.includes("x.com") || c.domain.includes("twitter.com"));

  if (twitterCookies.length === 0) {
    console.error("❌ No Twitter cookies found. Make sure you're fully logged in.");
    await browser.close();
    process.exit(1);
  }

  fs.writeFileSync(COOKIES_PATH, JSON.stringify(twitterCookies, null, 2));

  console.log(`\n✅ Saved ${twitterCookies.length} cookies to .twitter-cookies.json`);
  console.log("You can now restart the dev server — Twitter feeds will load.\n");

  await browser.close();
})();

import { Scraper } from "@the-convocation/twitter-scraper";
import fs from "fs";
import path from "path";

const COOKIES_PATH = path.join(process.cwd(), ".twitter-cookies.json");

let scraper: Scraper | null = null;
let initPromise: Promise<Scraper> | null = null;
let lastFailedAt = 0;
const RETRY_COOLDOWN_MS = 5 * 60 * 1000;

function loadCookies(): string | null {
  try {
    if (!fs.existsSync(COOKIES_PATH)) return null;
    const raw = fs.readFileSync(COOKIES_PATH, "utf-8");
    const cookies = JSON.parse(raw) as Array<{ name: string; value: string }>;
    // Format the scraper expects: "name=value; name2=value2"
    return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  } catch {
    return null;
  }
}

export async function getScraper(): Promise<Scraper> {
  if (scraper) return scraper;

  if (Date.now() - lastFailedAt < RETRY_COOLDOWN_MS) {
    throw new Error("Twitter init cooldown — skipping");
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const s = new Scraper();
    const cookieString = loadCookies();

    if (cookieString) {
      // Use saved browser cookies — no login request needed
      await s.setCookies(cookieString.split("; ").map((pair) => {
        const [name, ...rest] = pair.split("=");
        return { name, value: rest.join("="), domain: ".x.com", path: "/" };
      }));
      console.log("Twitter: loaded cookies from .twitter-cookies.json");
    } else {
      // Fall back to password login (may be blocked by Cloudflare)
      const username = process.env.TWITTER_USERNAME;
      const password = process.env.TWITTER_PASSWORD;
      if (!username || !password) {
        throw new Error("No .twitter-cookies.json and no TWITTER_USERNAME/PASSWORD in .env.local");
      }
      await s.login(username, password);
      console.log("Twitter: logged in with credentials");
    }

    // Verify the session is actually authenticated
    const isLoggedIn = await s.isLoggedIn();
    if (!isLoggedIn) {
      throw new Error("Twitter session invalid — cookies may be expired. Re-run: npm run get-twitter-cookies");
    }

    scraper = s;
    initPromise = null;
    return s;
  })().catch((err) => {
    lastFailedAt = Date.now();
    initPromise = null;
    scraper = null;
    throw err;
  });

  return initPromise;
}

import { Scraper } from "@the-convocation/twitter-scraper";

let scraper: Scraper | null = null;
let loginPromise: Promise<Scraper> | null = null;
let lastFailedAt = 0;
const RETRY_COOLDOWN_MS = 5 * 60 * 1000; // don't retry a failed login for 5 min

export async function getScraper(): Promise<Scraper> {
  if (scraper) return scraper;

  // Don't hammer a failing login
  if (Date.now() - lastFailedAt < RETRY_COOLDOWN_MS) {
    throw new Error("Twitter login cooldown — skipping");
  }

  if (loginPromise) return loginPromise;

  loginPromise = (async () => {
    const s = new Scraper();
    const username = process.env.TWITTER_USERNAME;
    const password = process.env.TWITTER_PASSWORD;

    if (!username || !password) {
      throw new Error("TWITTER_USERNAME / TWITTER_PASSWORD not set in .env.local");
    }

    await s.login(username, password);
    scraper = s;
    loginPromise = null;
    return s;
  })().catch((err) => {
    lastFailedAt = Date.now();
    loginPromise = null;
    throw err;
  });

  return loginPromise;
}

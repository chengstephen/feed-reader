/**
 * Disk-backed tweet cache.
 * Survives server restarts; only calls Twitter when cache is stale.
 */
import fs from "fs";
import path from "path";
import type { FeedItem } from "./types";

const CACHE_PATH = path.join(process.cwd(), ".tweet-cache.json");
const TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry {
  fetchedAt: number;
  items: FeedItem[];
}

type CacheStore = Record<string, CacheEntry>;

function readStore(): CacheStore {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as CacheStore;
    }
  } catch {}
  return {};
}

function writeStore(store: CacheStore) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(store));
  } catch {}
}

export function getCached(username: string): FeedItem[] | null {
  const store = readStore();
  const entry = store[username];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) return null; // stale
  return entry.items;
}

export function getStale(username: string): FeedItem[] | null {
  const store = readStore();
  return store[username]?.items ?? null;
}

export function setCached(username: string, items: FeedItem[]) {
  const store = readStore();
  store[username] = { fetchedAt: Date.now(), items };
  writeStore(store);
}

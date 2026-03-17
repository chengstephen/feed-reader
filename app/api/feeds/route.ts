import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { BR_TEAMS } from "@/lib/constants";
import type { FeedItem } from "@/lib/types";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
});

type RawItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  creator?: string;
  author?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mediaContent?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mediaThumbnail?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enclosure?: any;
};

function extractImage(item: RawItem): string | undefined {
  if (item.mediaContent?.["$"]?.url) return item.mediaContent["$"].url;
  if (item.mediaThumbnail?.["$"]?.url) return item.mediaThumbnail["$"].url;
  if (item.enclosure?.url) return item.enclosure.url;
  const match = item.content?.match(/<img[^>]+src="([^"]+)"/);
  if (match) return match[1];
  return undefined;
}

// Strip trailing source attribution like " - ESPN" or " | The Athletic"
function cleanTitle(title: string): string {
  return title.replace(/\s[-|]\s+[^-|]+$/, "").trim();
}

async function fetchTwitterFeed(username: string): Promise<FeedItem[]> {
  // Nitter is universally down as of 2026; use Google News search by username/name instead
  const query = username.replace(/([a-z])([A-Z])/g, "$1 $2"); // "ShamsCharania" → "Shams Charania"
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SportsFeedReader/1.0" },
      next: { revalidate: 900 },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const text = await res.text();
    const feed = await parser.parseString(text);

    return (feed.items as RawItem[]).map((item, i) => ({
      id: `tw-${username}-${i}-${item.pubDate ?? ""}`,
      title: item.title ? cleanTitle(item.title) : "(no title)",
      link: item.link ?? "#",
      pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      snippet: item.contentSnippet?.slice(0, 200),
      imageUrl: extractImage(item),
      source: "twitter" as const,
      sourceLabel: `@${username}`,
      author: username,
    }));
  } catch {
    return [];
  }
}

async function fetchTeamFeed(slug: string): Promise<FeedItem[]> {
  // Resolve human-readable team name from slug for the search query
  const team = BR_TEAMS.find((t) => t.slug === slug);
  const label = team?.label ?? slug.replace(/-/g, " ");
  const query = team ? `${team.label} ${team.sport}` : label;

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "SportsFeedReader/1.0" },
      next: { revalidate: 900 },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const text = await res.text();
    const feed = await parser.parseString(text);

    return (feed.items as RawItem[]).map((item, i) => ({
      id: `team-${slug}-${i}-${item.pubDate ?? ""}`,
      title: item.title ? cleanTitle(item.title) : "(no title)",
      link: item.link ?? "#",
      pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      snippet: item.contentSnippet?.slice(0, 200),
      imageUrl: extractImage(item),
      source: "bleacher-report" as const,
      sourceLabel: label,
      author: item.creator ?? item.author,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const twitterParam = searchParams.get("twitter") ?? "";
  const brParam = searchParams.get("br") ?? "";

  const twitterAccounts = twitterParam ? twitterParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const teamSlugs = brParam ? brParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const results = await Promise.allSettled([
    ...twitterAccounts.map((u) => fetchTwitterFeed(u)),
    ...teamSlugs.map((s) => fetchTeamFeed(s)),
  ]);

  const allItems: FeedItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  // Deduplicate by link (same article may appear across team feeds)
  const seen = new Set<string>();
  const deduped = allItems.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  deduped.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return NextResponse.json({ items: deduped });
}

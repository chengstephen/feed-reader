import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { NITTER_INSTANCES } from "@/lib/constants";
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
  // Try to extract from content HTML
  const match = item.content?.match(/<img[^>]+src="([^"]+)"/);
  if (match) return match[1];
  return undefined;
}

async function fetchTwitterFeed(username: string): Promise<FeedItem[]> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const url = `${instance}/${username}/rss`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "FeedReader/1.0" },
        next: { revalidate: 300 },
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const text = await res.text();
      const feed = await parser.parseString(text);
      return (feed.items as RawItem[]).map((item, i) => ({
        id: `tw-${username}-${i}-${item.pubDate ?? ""}`,
        title: item.title ?? "(no title)",
        link: item.link ?? "#",
        pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        snippet: item.contentSnippet?.slice(0, 200),
        imageUrl: extractImage(item),
        source: "twitter" as const,
        sourceLabel: `@${username}`,
        author: username,
      }));
    } catch {
      // try next instance
    }
  }
  return [];
}

async function fetchBRFeed(sport: string): Promise<FeedItem[]> {
  try {
    const url = `https://bleacherreport.com/${sport}/articles/feed`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "FeedReader/1.0" },
      next: { revalidate: 300 },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const text = await res.text();
    const feed = await parser.parseString(text);
    const label = feed.title?.replace("Bleacher Report - ", "").trim() ?? sport.toUpperCase();
    return (feed.items as RawItem[]).map((item, i) => ({
      id: `br-${sport}-${i}-${item.pubDate ?? ""}`,
      title: item.title ?? "(no title)",
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
  const brSports = brParam ? brParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const results = await Promise.allSettled([
    ...twitterAccounts.map((u) => fetchTwitterFeed(u)),
    ...brSports.map((s) => fetchBRFeed(s)),
  ]);

  const allItems: FeedItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  // Sort newest first
  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return NextResponse.json({ items: allItems });
}

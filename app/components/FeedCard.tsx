"use client";

import type { FeedItem } from "@/lib/types";

interface FeedCardProps {
  item: FeedItem;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function FeedCard({ item }: FeedCardProps) {
  const isTwitter = item.source === "twitter";

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-600 hover:bg-gray-800/80"
    >
      {/* Source badge + time */}
      <div className="flex w-28 shrink-0 flex-col items-start gap-1">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
            isTwitter
              ? "bg-sky-500/20 text-sky-400"
              : "bg-orange-500/20 text-orange-400"
          }`}
        >
          {item.sourceLabel}
        </span>
        <span className="text-xs text-gray-500">{timeLabel(item.pubDate)}</span>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium text-gray-100 leading-snug group-hover:text-white line-clamp-2">
          {item.title}
        </p>
        {item.snippet && (
          <p className="text-sm text-gray-400 line-clamp-2">{item.snippet}</p>
        )}
        {item.author && !isTwitter && (
          <p className="text-xs text-gray-600 mt-1">{item.author}</p>
        )}
      </div>

      {/* Thumbnail */}
      {item.imageUrl && (
        <div className="hidden shrink-0 sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt=""
            className="h-16 w-24 rounded-lg object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </a>
  );
}

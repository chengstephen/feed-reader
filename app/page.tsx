"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import DateTabs from "./components/DateTabs";
import FeedCard from "./components/FeedCard";
import SettingsPanel from "./components/SettingsPanel";
import { DEFAULT_BR_TEAMS, DEFAULT_TWITTER_ACCOUNTS, DAYS_SHOWN, REFRESH_INTERVAL_MS } from "@/lib/constants";
import { BR_TEAMS } from "@/lib/constants";
import type { FeedItem } from "@/lib/types";

const STORAGE_KEY = "feed-reader-config";

function dayStart(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayEnd(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(23, 59, 59, 999);
  return d;
}

function itemsForDay(items: FeedItem[], daysAgo: number): FeedItem[] {
  const start = dayStart(daysAgo).getTime();
  const end = dayEnd(daysAgo).getTime();
  return items.filter((item) => {
    const t = new Date(item.pubDate).getTime();
    return t >= start && t <= end;
  });
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildUrl(twitterAccounts: string[], brTeams: string[]): string | null {
  if (twitterAccounts.length === 0 && brTeams.length === 0) return null;
  const params = new URLSearchParams();
  if (twitterAccounts.length) params.set("twitter", twitterAccounts.join(","));
  if (brTeams.length) params.set("br", brTeams.join(","));
  return `/api/feeds?${params.toString()}`;
}

function formatCountdown(ms: number): string {
  const secs = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function teamLabel(slug: string): string {
  return BR_TEAMS.find((t) => t.slug === slug)?.label ?? slug;
}

export default function HomePage() {
  const [twitterAccounts, setTwitterAccounts] = useState<string[]>(DEFAULT_TWITTER_ACCOUNTS);
  const [brTeams, setBrTeams] = useState<string[]>(DEFAULT_BR_TEAMS);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS);
  const nextRefreshAt = useRef(Date.now() + REFRESH_INTERVAL_MS);

  // Load config from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const config = JSON.parse(raw);
        if (config.twitterAccounts) setTwitterAccounts(config.twitterAccounts);
        if (config.brTeams) setBrTeams(config.brTeams);
      }
    } catch {}
    setConfigLoaded(true);
  }, []);

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      const remaining = nextRefreshAt.current - Date.now();
      setCountdown(remaining);
      if (remaining <= 0) {
        nextRefreshAt.current = Date.now() + REFRESH_INTERVAL_MS;
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const url = configLoaded ? buildUrl(twitterAccounts, brTeams) : null;

  const { data, error, isLoading, mutate } = useSWR<{ items: FeedItem[] }>(
    url,
    fetcher,
    {
      refreshInterval: REFRESH_INTERVAL_MS,
      onSuccess: () => {
        nextRefreshAt.current = Date.now() + REFRESH_INTERVAL_MS;
        setCountdown(REFRESH_INTERVAL_MS);
      },
    }
  );

  const handleRefresh = useCallback(() => {
    nextRefreshAt.current = Date.now() + REFRESH_INTERVAL_MS;
    setCountdown(REFRESH_INTERVAL_MS);
    mutate();
  }, [mutate]);

  const handleSaveSettings = useCallback((accounts: string[], teams: string[]) => {
    setTwitterAccounts(accounts);
    setBrTeams(teams);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ twitterAccounts: accounts, brTeams: teams }));
    nextRefreshAt.current = Date.now() + REFRESH_INTERVAL_MS;
    setCountdown(REFRESH_INTERVAL_MS);
  }, []);

  const allItems = data?.items ?? [];
  const countsByDay = Array.from({ length: DAYS_SHOWN }, (_, i) => itemsForDay(allItems, i).length);
  const visibleItems = itemsForDay(allItems, selectedDay);

  const hasNoConfig = twitterAccounts.length === 0 && brTeams.length === 0;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white tracking-tight">Feed Reader</h1>
            {!isLoading && !error && url && (
              <span className="text-xs text-gray-500">
                refreshes in {formatCountdown(countdown)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh now"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition disabled:opacity-40"
            >
              <svg
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </div>

        {/* Active feeds summary */}
        {!hasNoConfig && (
          <div className="border-t border-gray-800/60 px-4 py-2">
            <div className="mx-auto max-w-3xl flex flex-wrap gap-1.5">
              {twitterAccounts.map((a) => (
                <span key={a} className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs text-sky-400 border border-sky-500/20">
                  @{a}
                </span>
              ))}
              {brTeams.map((slug) => (
                <span key={slug} className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs text-orange-400 border border-orange-500/20">
                  {teamLabel(slug)}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5">
        {/* Empty state */}
        {hasNoConfig && (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-gray-800 p-5">
              <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-200 mb-1">No feeds configured</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Add Twitter accounts or Bleacher Report teams to start reading.
            </p>
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* Date tabs + feed */}
        {!hasNoConfig && (
          <>
            <DateTabs
              selectedIndex={selectedDay}
              onSelect={setSelectedDay}
              countsByDay={countsByDay}
            />

            <div className="mt-5">
              {isLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-gray-800 animate-pulse" />
                  ))}
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
                  Failed to load feeds. Check your connection and try refreshing.
                </div>
              )}

              {!isLoading && !error && visibleItems.length === 0 && (
                <div className="mt-16 flex flex-col items-center text-center text-gray-500">
                  <svg className="mb-3 h-10 w-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">No articles found for this day.</p>
                </div>
              )}

              {!isLoading && !error && visibleItems.length > 0 && (
                <div className="space-y-2.5">
                  {visibleItems.map((item) => (
                    <FeedCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showSettings && (
        <SettingsPanel
          twitterAccounts={twitterAccounts}
          brTeams={brTeams}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}

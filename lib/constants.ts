import type { BRSport } from "./types";

export const BR_SPORTS: BRSport[] = [
  { slug: "nba", label: "NBA" },
  { slug: "nfl", label: "NFL" },
  { slug: "mlb", label: "MLB" },
  { slug: "nhl", label: "NHL" },
  { slug: "world-football", label: "Soccer" },
  { slug: "college-football", label: "College Football" },
  { slug: "college-basketball", label: "College Basketball" },
  { slug: "mma", label: "MMA/UFC" },
  { slug: "tennis", label: "Tennis" },
  { slug: "golf", label: "Golf" },
  { slug: "nascar", label: "NASCAR" },
  { slug: "wrestling", label: "Wrestling" },
  { slug: "boxing", label: "Boxing" },
];

export const DEFAULT_BR_SPORTS = ["nba", "nfl"];

export const DEFAULT_TWITTER_ACCOUNTS: string[] = [];

// Nitter public instances to try in order
export const NITTER_INSTANCES = [
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.1d4.us",
  "https://nitter.unixfox.eu",
];

export const DAYS_SHOWN = 7;

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  pubDate: string; // ISO string
  snippet?: string;
  imageUrl?: string;
  source: "twitter" | "bleacher-report";
  sourceLabel: string; // e.g. "@KingJames" or "LA Lakers"
  author?: string;
}

export interface FeedConfig {
  twitterAccounts: string[]; // usernames without @
  brTeams: string[]; // slugs e.g. "los-angeles-lakers"
}

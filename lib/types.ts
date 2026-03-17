export interface FeedItem {
  id: string;
  title: string;
  link: string;
  pubDate: string; // ISO string
  snippet?: string;
  imageUrl?: string;
  source: "twitter" | "bleacher-report";
  sourceLabel: string; // e.g. "@KingJames" or "NBA"
  author?: string;
}

export interface BRSport {
  slug: string;
  label: string;
}

export interface FeedConfig {
  twitterAccounts: string[]; // usernames without @
  brSports: string[]; // slugs
}

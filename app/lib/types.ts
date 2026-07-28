export type NewsCategoryId =
  | "global-affairs"
  | "trade-policy"
  | "asia-pacific"
  | "markets"
  | "multilateral";

export interface NewsSource {
  id: string;
  name: string;
  country: string;
  homepage: string;
}

export interface NewsCategory {
  id: NewsCategoryId;
  label: string;
  labelEn: string;
  description: string;
}

export interface TrackedEntity {
  id: string;
  name: string;
  fullName: string;
  homepage: string;
  keywords: string[];
  highlight?: boolean;
}

export interface RssFeedConfig {
  id: string;
  name: string;
  url: string;
  type: "google-news" | "direct";
  defaultCategory: NewsCategoryId;
  description: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  sourceId: string;
  sourceName: string;
  publishedAt: string;
  category: NewsCategoryId;
  summary: string;
  region: string;
  entityIds: string[];
}

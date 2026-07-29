import Parser from "rss-parser";
import type { NewsArticle, NewsCategoryId, RssFeedConfig } from "./types";
import {
  NEWS_SOURCES,
  RSS_FEEDS,
  TRACKED_ENTITIES,
} from "./preferences";

// ============================================================
//  RSS 抓取与解析引擎
//  ----------------------------------------------------------
//  从配置的 RSS Feed 获取新闻，自动：
//    1. 提取媒体来源名称
//    2. 检测重点机构（AIIB 等）并打标签
//    3. 分类到五大编辑方向
//    4. AIIB 过滤规则：标题提及 或 正文 2 次以上提及
// ============================================================

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
  creator?: string;
  source?: string | { _: string };
};

const parser = new Parser({
  timeout: 8000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  },
});

// ---- 从 Google News 标题中提取来源 ----
// Google News 标题格式通常为 "文章标题 - 媒体名称"
function extractSourceFromTitle(title: string): {
  cleanTitle: string;
  sourceName: string;
} {
  const dashIndex = title.lastIndexOf(" - ");
  if (dashIndex > 10) {
    return {
      cleanTitle: title.substring(0, dashIndex).trim(),
      sourceName: title.substring(dashIndex + 3).trim(),
    };
  }
  return { cleanTitle: title, sourceName: "" };
}

// ---- 将来源名称匹配到已配置的媒体源 ----
function matchSourceId(sourceName: string): string {
  if (!sourceName) return "other";
  const lower = sourceName.toLowerCase();
  for (const src of NEWS_SOURCES) {
    if (lower.includes(src.name.toLowerCase()) || src.name.toLowerCase().includes(lower)) {
      return src.id;
    }
  }
  return "other";
}

// ---- 检测文章中提及的重点机构 ----
function detectEntities(
  title: string,
  content: string
): { entityIds: string[]; aiibMentionCount: number } {
  const fullText = `${title} ${content}`.toLowerCase();
  const entityIds: string[] = [];
  let aiibMentionCount = 0;

  for (const entity of TRACKED_ENTITIES) {
    let count = 0;
    for (const kw of entity.keywords) {
      const regex = new RegExp(escapeRegExp(kw), "gi");
      const matches = fullText.match(regex);
      if (matches) count += matches.length;
    }
    if (count > 0) {
      if (entity.id === "aiib") {
        aiibMentionCount = count;
      }
      entityIds.push(entity.id);
    }
  }

  return { entityIds, aiibMentionCount };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---- 根据关键词重新分类 ----
function classifyCategory(
  title: string,
  content: string,
  defaultCategory: NewsCategoryId
): NewsCategoryId {
  const text = `${title} ${content}`.toLowerCase();
  const keywordMap: Record<NewsCategoryId, string[]> = {
    "global-affairs": [
      "geopolitic", "sanction", "conflict", "war", "nato", "military",
      "iran", "russia", "ukraine", "middle east", "strait", "ceasefire",
      "security council", "nuclear",
    ],
    "trade-policy": [
      "trade agreement", "trade deal", "trade war", "trade policy",
      "trade negotiation", "trade pact", "trade barrier", "trade tension",
      "trade framework", "trade accord", "trade dialogue", "trade council",
      "trade commission", "trade ministry", "trade department", "trade agency",
      "trade bureau", "trade office", "trade representative", "trade attaché",
      "trade delegation", "trade mission", "trade forum", "trade summit",
      "trade conference", "trade symposium", "trade seminar", "trade workshop",
      "trade event", "trade gathering", "trade meeting", "trade talk",
      "trade consultation", "trade discussion", "trade exchange", "trade cooperation",
      "trade partnership", "trade alliance", "trade union", "trade association",
      "trade federation", "trade chamber", "WTO", "customs", "quota",
      "export control", "sanction",
    ],
    "asia-pacific": [
      "gdp", "manufactur", "industrial output", "energy transition",
      "renewable", "infrastructure", "semiconductor", "asia pacific",
      "asean", "india", "vietnam", "japan", "korea", "china",
    ],
    markets: [
      "stock", "bond yield", "treasury", "federal reserve", "fed",
      "interest rate", "dollar", "gold", "oil price", "crude", "brent",
      "inflation", "equity", "rally", "bear", "bull",
    ],
    multilateral: [
      "world bank", "imf", "development bank", "aiib", "adb", "ebrd",
      "eib", "loan approval", "financing", "climate finance", "sukuk",
      "sco", "shanghai cooperation",
    ],
  };

  let bestCategory = defaultCategory;
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(keywordMap)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as NewsCategoryId;
    }
  }

  return bestCategory;
}

// ---- 解析单个 RSS item 为 NewsArticle ----
function parseRssItem(
  item: RssItem,
  feed: RssFeedConfig,
  index: number
): NewsArticle | null {
  if (!item.title || !item.link) return null;

  const { cleanTitle, sourceName } =
    feed.type === "google-news"
      ? extractSourceFromTitle(item.title)
      : { cleanTitle: item.title, sourceName: feed.name };

  const content = item.contentSnippet || item.content || "";
  const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();

  // 检测机构
  const { entityIds, aiibMentionCount } = detectEntities(cleanTitle, content);

  // AIIB feed 的过滤规则：标题提及 或 正文 2 次以上
  if (feed.id === "feed-aiib") {
    const titleMentionsAiib = entityIds.includes("aiib");
    const bodyMentionsAiib = aiibMentionCount >= 2;
    if (!titleMentionsAiib && !bodyMentionsAiib) return null;
  }

  // 分类
  const category = classifyCategory(cleanTitle, content, feed.defaultCategory);

  const sourceId = matchSourceId(sourceName);

  return {
    id: `${feed.id}-${index}`,
    title: cleanTitle,
    url: item.link,
    sourceId,
    sourceName: sourceName || feed.name,
    publishedAt,
    category,
    summary: content.length > 300 ? content.substring(0, 300) + "…" : content,
    region: detectRegion(cleanTitle, content),
    entityIds,
  };
}

function detectRegion(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  const regions: [string, string[]][] = [
    ["Middle East", ["middle east", "gulf", "iran", "israel", "saudi", "qatar", "yemen", "hormuz"]],
    ["Europe", ["europe", "eu ", "european", "germany", "france", "uk ", "britain", "russia", "ukraine"]],
    ["Asia", ["asia", "china", "japan", "korea", "india", "vietnam", "asean", "taiwan"]],
    ["Africa", ["africa", "african", "nigeria", "egypt", "kenya"]],
    ["United States", ["united states", "u.s.", "washington", "congress", "federal reserve"]],
    ["Latin America", ["latin america", "brazil", "argentina", "mexico"]],
    ["Global", ["global", "world", "international", "g20", "g7", "un "]],
  ];
  for (const [region, keywords] of regions) {
    if (keywords.some((kw) => text.includes(kw))) return region;
  }
  return "Global";
}

// ---- 抓取单个 feed ----
async function fetchFeed(feed: RssFeedConfig): Promise<NewsArticle[]> {
  try {
    const feedData = await parser.parseURL(feed.url);
    const items = (feedData.items as RssItem[]) || [];
    const articles: NewsArticle[] = [];

    for (let i = 0; i < items.length; i++) {
      const article = parseRssItem(items[i], feed, i);
      if (article) articles.push(article);
    }

    return articles;
  } catch (error) {
    console.error(`[RSS] Failed to fetch feed "${feed.name}":`, error);
    return [];
  }
}

// ---- 抓取所有 feed 并合并去重 ----
export async function fetchAllFeeds(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map((feed) => fetchFeed(feed)));

  const allArticles: NewsArticle[] = [];
  const seenUrls = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const article of result.value) {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url);
          allArticles.push(article);
        }
      }
    }
  }

  // 按发布时间倒序
  allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return allArticles;
}

// ---- 检查 RSS 是否可用 ----
export async function isRssAvailable(): Promise<boolean> {
  try {
    const testFeed = RSS_FEEDS.find((f) => f.type === "direct");
    if (!testFeed) return false;
    await parser.parseURL(testFeed.url);
    return true;
  } catch {
    return false;
  }
}

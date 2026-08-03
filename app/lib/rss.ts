import Parser from "rss-parser";
import type { NewsArticle, NewsCategoryId, RssFeedConfig } from "./types";
import {
  NEWS_SOURCES,
  RSS_FEEDS,
  TRACKED_ENTITIES,
  COUNTRY_TOPICS,
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
// 包含常见别名，提升匹配命中率，避免主流媒体被误判为 "other"
const SOURCE_ALIASES: Record<string, string> = {
  reuters: "reuters",
  ap: "ap", "associated press": "ap", "ap news": "ap",
  bbc: "bbc", "bbc news": "bbc", "bbc.com": "bbc",
  nyt: "nyt", "nytimes": "nyt", "the new york times": "nyt", "new york times": "nyt",
  wsj: "wsj", "wall street journal": "wsj", "the wall street journal": "wsj",
  ft: "ft", "financial times": "ft", "ft.com": "ft",
  bloomberg: "bloomberg",
  guardian: "guardian", "the guardian": "guardian",
  economist: "economist", "the economist": "economist",
  cnn: "cnn",
  aljazeera: "aljazeera", "al jazeera": "aljazeera",
  dw: "dw", "deutsche welle": "dw",
  nikkei: "nikkei", "nikkei asia": "nikkei",
  japantimes: "japantimes", "japan times": "japantimes", "the japan times": "japantimes",
  koreatimes: "koreatimes", "korea times": "koreatimes", "the korea times": "koreatimes",
  scmp: "scmp", "south china morning post": "scmp",
  hindu: "hindu", "the hindu": "hindu",
  "abc-au": "abc-au", "abc news": "abc-au", "abc news australia": "abc-au",
  smh: "smh", "sydney morning herald": "smh", "the sydney morning herald": "smh",
  "politico-eu": "politico-eu", "politico": "politico-eu", "politico europe": "politico-eu",
  ftchinese: "ftchinese", "ft chinese": "ftchinese",
  caixin: "caixin", "caixin global": "caixin",
  dohanews: "dohanews", "doha news": "dohanews",
  qna: "qna", "qatar news agency": "qna", "qna.org.qa": "qna",
};

function matchSourceId(sourceName: string): string {
  if (!sourceName) return "other";
  const lower = sourceName.toLowerCase().trim();
  // 先走别名表
  if (SOURCE_ALIASES[lower]) return SOURCE_ALIASES[lower];
  // 再走配置媒体的双向 includes 匹配
  for (const src of NEWS_SOURCES) {
    const srcLower = src.name.toLowerCase();
    if (lower.includes(srcLower) || srcLower.includes(lower)) {
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

// ---- 检测文章关联的国家专题 ----
function detectCountry(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const countryIds: string[] = [];
  for (const country of COUNTRY_TOPICS) {
    for (const kw of country.keywords) {
      // "UK " 和 "U.K." 这类带空格/标点的关键词用 includes 即可
      if (text.includes(kw.toLowerCase())) {
        countryIds.push(country.id);
        break;
      }
    }
  }
  return countryIds;
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

// ---- 企业新闻过滤（仅用于 trade-policy 类别）----
// trade-policy 只关注贸易政策、经济政策大事件，不关注企业自身发展
function isCorporateNews(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  // 企业新闻特征词：财报、并购、IPO、股价、CEO、产品发布、季度业绩等
  const corporateKeywords = [
    "earnings", "quarterly results", "revenue rose", "profit fell", "net income",
    "shares surged", "stock jumped", "ipo", "buyout", "acquires", "merger",
    "ceo says", "ceo of", "appoints", "resigns as ceo", "new ceo",
    "launches new", "unveils", "debuts", "rolls out",
    "market cap", "dividend", "buyback", "stock split",
    "beats estimates", "misses estimates", "guidance",
  ];
  // 需要多个企业特征词同时命中才算企业新闻（避免误杀）
  let hitCount = 0;
  for (const kw of corporateKeywords) {
    if (text.includes(kw)) hitCount++;
  }
  return hitCount >= 2;
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
  const { entityIds } = detectEntities(cleanTitle, content);

  // AIIB feed 的过滤规则：仅收录标题提及 AIIB 的文章
  // （detectEntities 合并扫描标题+正文，需要单独检测标题）
  if (feed.id === "feed-aiib") {
    const titleLower = cleanTitle.toLowerCase();
    const aiibKeywords = TRACKED_ENTITIES.find((e) => e.id === "aiib")?.keywords ?? [];
    const titleMentionsAiib = aiibKeywords.some((kw) => titleLower.includes(kw.toLowerCase()));
    if (!titleMentionsAiib) return null;
  }

  // 分类
  const category = classifyCategory(cleanTitle, content, feed.defaultCategory);

  // 所有类别：过滤企业新闻，只保留政策/宏观经济大事件
  if (isCorporateNews(cleanTitle, content)) {
    return null;
  }

  // 检测关联的国家专题
  const countryIds = detectCountry(cleanTitle, content);

  const sourceId = matchSourceId(sourceName);

  // 四大核心板块（全球政经、国际贸易、亚太政经、金融市场）：
  // 只保留配置媒体源（NEWS_SOURCES）的新闻，过滤掉非指定来源（全网小报/聚合站）
  // AIIB 专题、多边机构、国家专题不受此限制（机构/地区新闻来源可更广）
  const CORE_CATEGORIES: NewsCategoryId[] = ["global-affairs", "trade-policy", "asia-pacific", "markets"];
  if (CORE_CATEGORIES.includes(category) && sourceId === "other") {
    return null;
  }

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
    countryIds,
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
  // 同一篇文章可能既出现在 direct feed（原始 URL）又出现在 google-news feed
  // （news.google.com 跳转链接），URL 不同所以 seenUrls 去不掉，需要按 normalized title 二次去重。
  // RSS_FEEDS 中 direct feed 排在数组前部，所以 direct 的 article 先入数组，
  // google-news 同篇文章后被过滤，从而保留原始 URL 而非 google news 跳转链接。
  const seenTitles = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const article of result.value) {
        if (seenUrls.has(article.url)) continue;
        const normTitle = normalizeTitle(article.title);
        if (normTitle && seenTitles.has(normTitle)) continue;
        seenUrls.add(article.url);
        if (normTitle) seenTitles.add(normTitle);
        allArticles.push(article);
      }
    }
  }

  // 排序：先按媒体来源优先级（NEWS_SOURCES 配置顺序），再按发布时间倒序
  const sourcePriority = new Map<string, number>();
  NEWS_SOURCES.forEach((s, i) => sourcePriority.set(s.id, i));

  allArticles.sort((a, b) => {
    const pa = sourcePriority.has(a.sourceId) ? sourcePriority.get(a.sourceId)! : 999;
    const pb = sourcePriority.has(b.sourceId) ? sourcePriority.get(b.sourceId)! : 999;
    if (pa !== pb) return pa - pb;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return allArticles;
}

// ---- 标题归一化（用于跨 feed 去重）----
// 不同 feed 抓到的同一篇文章，标题可能有细微差异（媒体前缀/后缀、空格、大小写）
// 归一化后用于二次去重，避免 direct 和 google-news 重复。
// 策略：小写化 → 去掉所有非字母数字字符 → 折叠空格 → 截断前 80 字符。
// 不做媒体前后缀正则替换（容易误伤有意义的标题），靠截断前 80 字符就够区分。
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
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

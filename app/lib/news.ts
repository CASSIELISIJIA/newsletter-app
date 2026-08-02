import { MOCK_ARTICLES } from "./mock-data";
import { fetchAllFeeds, isRssAvailable } from "./rss";
import type { NewsArticle } from "./types";

// ============================================================
//  数据获取层 (Data Layer)
//  ----------------------------------------------------------
//  生产环境：从 RSS Feed 获取实时新闻
//  开发环境：直接使用 Mock 数据（避免 RSS 超时等待）
//  部署到 Vercel 后 RSS 将正常工作。
// ============================================================

function sortArticles(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// 开发环境：把 mock 数据的时间戳重映射到最近 72 小时内，
// 避免时间过滤把所有样例数据都过滤掉
function remapMockTimestamps(articles: NewsArticle[]): NewsArticle[] {
  if (articles.length === 0) return articles;
  const now = Date.now();
  // 按原始时间排序，最早到最新
  const sorted = [...articles].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
  const oldest = new Date(sorted[0].publishedAt).getTime();
  const newest = new Date(sorted[sorted.length - 1].publishedAt).getTime();
  const originalSpan = Math.max(newest - oldest, 1);
  // 映射到最近 60 小时内（留余量，保证在 72h 筛选范围内）
  const targetSpan = 60 * 3600 * 1000;
  return articles.map((a) => {
    const originalTime = new Date(a.publishedAt).getTime();
    const ratio = (originalTime - oldest) / originalSpan;
    const newTime = now - Math.round((1 - ratio) * targetSpan);
    return { ...a, publishedAt: new Date(newTime).toISOString() };
  });
}

export async function getNews(): Promise<{
  articles: NewsArticle[];
  source: "rss" | "mock";
}> {
  // 开发环境直接返回 Mock 数据，避免等待 RSS 超时
  if (process.env.NODE_ENV === "development") {
    return { articles: sortArticles(remapMockTimestamps(MOCK_ARTICLES)), source: "mock" };
  }

  // 生产环境尝试 RSS
  try {
    const rssOk = await isRssAvailable();
    if (rssOk) {
      const articles = await fetchAllFeeds();
      if (articles.length >= 15) {
        return { articles, source: "rss" };
      }
    }
  } catch (error) {
    console.error("[News] RSS fetch failed, falling back to mock:", error);
  }

  return { articles: sortArticles(MOCK_ARTICLES), source: "mock" };
}

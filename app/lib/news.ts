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

export async function getNews(): Promise<{
  articles: NewsArticle[];
  source: "rss" | "mock";
}> {
  // 开发环境直接返回 Mock 数据，避免等待 RSS 超时
  if (process.env.NODE_ENV === "development") {
    return { articles: sortArticles(MOCK_ARTICLES), source: "mock" };
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

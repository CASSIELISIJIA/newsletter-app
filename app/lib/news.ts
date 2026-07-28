import { MOCK_ARTICLES } from "./mock-data";
import { fetchAllFeeds, isRssAvailable } from "./rss";
import type { NewsArticle } from "./types";

// ============================================================
//  数据获取层 (Data Layer)
//  ----------------------------------------------------------
//  优先从 RSS Feed 获取实时新闻（Google News 聚合 + Doha News 直连）。
//  若 RSS 不可用（如本地开发网络受限），自动回退到 Mock 数据。
//  部署到 Vercel 等平台后 RSS 将正常工作。
// ============================================================

export async function getNews(): Promise<{
  articles: NewsArticle[];
  source: "rss" | "mock";
}> {
  try {
    const rssOk = await isRssAvailable();
    if (rssOk) {
      const articles = await fetchAllFeeds();
      // 文章数过少说明大部分 Google News feed 超时失败，回退 Mock
      if (articles.length >= 15) {
        return { articles, source: "rss" };
      }
    }
  } catch (error) {
    console.error("[News] RSS fetch failed, falling back to mock:", error);
  }

  // 回退到 Mock 数据
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    articles: [...MOCK_ARTICLES].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ),
    source: "mock",
  };
}

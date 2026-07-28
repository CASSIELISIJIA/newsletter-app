import NewsletterClient from "@/app/components/NewsletterClient";
import { getNews } from "@/app/lib/news";
import { NEWS_CATEGORIES, NEWS_SOURCES, TRACKED_ENTITIES } from "@/app/lib/preferences";

// 每 30 分钟重新抓取 RSS（ISR 缓存）
export const revalidate = 1800;

export default async function Home() {
  const { articles, source } = await getNews();
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const aiibCount = articles.filter((a) => a.entityIds.includes("aiib")).length;

  return (
    <>
      {/* ---- Hero 头部 ---- */}
      <header className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                source === "rss" ? "bg-green-500" : "bg-amber-500"
              }`}
            />
            {source === "rss" ? "实时 RSS 更新" : "演示数据 · RSS 待连接"}
            · 海外重点媒体
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            全球政经要闻 Newsletter
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">
            聚焦全球重大政治与经济事件，覆盖日本、韩国、印度、中东、美国、英国、欧洲、澳大利亚及亚太地区，聚合 Reuters、Bloomberg、Nikkei、Japan Times、Korea Times、SCMP、Doha News 等海外重点媒体报道。
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>关注 {NEWS_SOURCES.length} 家媒体</span>
            <span>·</span>
            <span>{NEWS_CATEGORIES.length} 大编辑方向</span>
            <span>·</span>
            <span>追踪 {TRACKED_ENTITIES.length} 个重点机构</span>
            {aiibCount > 0 && (
              <>
                <span>·</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  AIIB 专题 {aiibCount} 篇
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---- 主体 ---- */}
      <NewsletterClient articles={articles} now={now} />

      {/* ---- 页脚 ---- */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-neutral-400 dark:text-neutral-500 md:px-6">
          <p>
            全球政经要闻 Newsletter · 数据来源：{source === "rss" ? "Google News RSS + 媒体直连" : "演示数据"}
          </p>
        </div>
      </footer>
    </>
  );
}

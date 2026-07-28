"use client";

import { useMemo, useState } from "react";
import type { NewsArticle, NewsCategoryId } from "@/app/lib/types";
import {
  NEWS_CATEGORIES,
  getCategoryLabel,
  getEntityName,
  getSourceHomepage,
} from "@/app/lib/preferences";
import { formatFullDate, formatRelativeTime } from "@/app/lib/utils";

type TimeRange = "1h" | "6h" | "12h" | "24h" | "3days" | "week" | "month" | "all" | "custom";

const TIME_RANGE_OPTIONS: { id: TimeRange; label: string }[] = [
  { id: "1h", label: "1小时" },
  { id: "6h", label: "6小时" },
  { id: "12h", label: "12小时" },
  { id: "24h", label: "24小时" },
  { id: "3days", label: "3天" },
  { id: "week", label: "一周" },
  { id: "month", label: "一月" },
  { id: "all", label: "全部" },
  { id: "custom", label: "自定义" },
];

const RANGE_MS: Record<Exclude<TimeRange, "all" | "custom">, number> = {
  "1h": 1 * 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "3days": 3 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

interface NewsletterClientProps {
  articles: NewsArticle[];
  now: number;
}

export default function NewsletterClient({ articles, now }: NewsletterClientProps) {
  const [activeCategory, setActiveCategory] = useState<NewsCategoryId | "all">("all");
  const [activeSource, setActiveSource] = useState<string>("all");
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [aiibOnly, setAiibOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const articleTime = new Date(article.publishedAt).getTime();

      // 时间范围筛选
      if (activeTimeRange === "custom") {
        if (customStart && articleTime < new Date(customStart).getTime()) return false;
        if (customEnd && articleTime > new Date(customEnd).getTime()) return false;
      } else if (activeTimeRange !== "all") {
        const age = now - articleTime;
        if (age > RANGE_MS[activeTimeRange]) return false;
      }

      if (aiibOnly && !article.entityIds.includes("aiib")) return false;
      if (activeCategory !== "all" && article.category !== activeCategory) return false;
      if (activeSource !== "all" && article.sourceId !== activeSource) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${article.title} ${article.summary} ${article.region}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, activeCategory, activeSource, activeTimeRange, customStart, customEnd, aiibOnly, searchQuery, now]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) counts[a.category] = (counts[a.category] ?? 0) + 1;
    return counts;
  }, [articles]);

  const sourceIdsInUse = useMemo(() => {
    return Array.from(new Set(articles.map((a) => a.sourceId)));
  }, [articles]);

  const aiibCount = articles.filter((a) => a.entityIds.includes("aiib")).length;

  const timeLabel = activeTimeRange === "custom"
    ? `${customStart || "不限"} ~ ${customEnd || "不限"}`
    : TIME_RANGE_OPTIONS.find((t) => t.id === activeTimeRange)?.label ?? "全部";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:px-6">
      {/* ---- 侧边栏 ---- */}
      <aside className="md:w-64 md:shrink-0">
        <div className="space-y-6 md:sticky md:top-24">
          {/* 时间范围 */}
          <FilterSection title="时间范围">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-2">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActiveTimeRange(opt.id)}
                  className={`rounded-lg px-2.5 py-2 text-xs transition ${
                    activeTimeRange === opt.id
                      ? "bg-neutral-900 font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {activeTimeRange === "custom" && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-500 dark:text-neutral-400">起始时间</label>
                  <input
                    type="datetime-local"
                    step={60}
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-500 dark:text-neutral-400">结束时间</label>
                  <input
                    type="datetime-local"
                    step={60}
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
                  />
                </div>
                {(customStart || customEnd) && (
                  <button
                    onClick={() => { setCustomStart(""); setCustomEnd(""); }}
                    className="text-xs text-neutral-400 transition hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    清除自定义时间
                  </button>
                )}
              </div>
            )}
          </FilterSection>

          {/* AIIB 专题 */}
          {aiibCount > 0 && (
            <FilterSection title="专题追踪">
              <button
                onClick={() => setAiibOnly(!aiibOnly)}
                className={`flex items-center rounded-md px-3 py-1.5 text-left text-sm transition ${
                  aiibOnly
                    ? "bg-blue-600 font-medium text-white"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold">A</span>
                AIIB 专题
                <span className="ml-auto text-xs opacity-70">{aiibCount}</span>
              </button>
            </FilterSection>
          )}

          {/* 分类 */}
          <FilterSection title="编辑方向">
            <FilterButton active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
              全部<span className="ml-auto text-xs opacity-60">{articles.length}</span>
            </FilterButton>
            {NEWS_CATEGORIES.map((cat) => (
              <FilterButton key={cat.id} active={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)}>
                {cat.label}<span className="ml-auto text-xs opacity-60">{categoryCounts[cat.id] ?? 0}</span>
              </FilterButton>
            ))}
          </FilterSection>

          {/* 来源 */}
          <FilterSection title="媒体来源">
            <FilterButton active={activeSource === "all"} onClick={() => setActiveSource("all")}>全部媒体</FilterButton>
            {sourceIdsInUse.map((sid) => {
              const sample = articles.find((a) => a.sourceId === sid);
              return (
                <FilterButton key={sid} active={activeSource === sid} onClick={() => setActiveSource(sid)}>
                  {sample?.sourceName ?? sid}
                </FilterButton>
              );
            })}
          </FilterSection>
        </div>
      </aside>

      {/* ---- 主内容区 ---- */}
      <main className="min-w-0 flex-1">
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索新闻标题、摘要或地区…"
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
          />
        </div>

        <div className="mb-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            共 {filtered.length} 篇 · {timeLabel}
            {activeCategory !== "all" && ` · ${getCategoryLabel(activeCategory)}`}
            {aiibOnly && ` · AIIB 专题`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700">
            <p className="text-neutral-500 dark:text-neutral-400">没有找到匹配的新闻</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center rounded-md px-3 py-1.5 text-left text-sm transition ${
        active
          ? "bg-neutral-900 font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  const hasAiib = article.entityIds.includes("aiib");
  const otherEntities = article.entityIds.filter((id) => id !== "aiib");

  return (
    <article
      className={`group rounded-xl border bg-white p-5 transition hover:shadow-sm dark:bg-neutral-900 ${
        hasAiib
          ? "border-blue-300 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-700"
          : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center rounded-full bg-neutral-900 px-2 py-0.5 font-medium text-white dark:bg-neutral-100 dark:text-neutral-900">
          {getCategoryLabel(article.category)}
        </span>
        {hasAiib && (
          <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 font-medium text-white">AIIB</span>
        )}
        <a href={getSourceHomepage(article.sourceId)} target="_blank" rel="noopener noreferrer" className="font-medium text-neutral-600 hover:underline dark:text-neutral-300">
          {article.sourceName || article.sourceId}
        </a>
        <span className="text-neutral-300 dark:text-neutral-600">|</span>
        <span className="text-neutral-500 dark:text-neutral-400">{article.region}</span>
      </div>

      <h2 className="mb-1.5 text-base font-semibold leading-snug">
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-neutral-900 transition group-hover:text-neutral-600 dark:text-neutral-100 dark:group-hover:text-neutral-300">
          {article.title}
        </a>
      </h2>

      <p className="mb-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{article.summary}</p>

      {otherEntities.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {otherEntities.map((eid) => (
            <span key={eid} className="inline-flex items-center rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              {getEntityName(eid)}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <time dateTime={article.publishedAt} title={formatFullDate(article.publishedAt)}>
          {formatRelativeTime(article.publishedAt)}
        </time>
        <span className="ml-auto inline-flex items-center gap-1 text-neutral-400 transition group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
          阅读原文
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </div>
    </article>
  );
}

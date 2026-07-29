"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsArticle, NewsCategoryId } from "@/app/lib/types";
import {
  NEWS_CATEGORIES,
  getCategoryLabel,
  getEntityName,
} from "@/app/lib/preferences";
import { formatFullDate, formatRelativeTime } from "@/app/lib/utils";
import NewsletterView, {
  getNewsletterSection,
  type NewsletterSectionId,
} from "@/app/components/NewsletterView";

type TimeRange = "72h" | "48h" | "24h" | "today" | "custom" | "all";

const TIME_RANGE_OPTIONS: { id: TimeRange | "all"; label: string }[] = [
  { id: "72h", label: "72小时" },
  { id: "48h", label: "48小时" },
  { id: "24h", label: "24小时" },
  { id: "today", label: "Today" },
  { id: "custom", label: "自定义" },
];

const RANGE_MS: Record<Exclude<TimeRange | "all", "custom">, number> = {
  "72h": 3 * 24 * 60 * 60 * 1000,
  "48h": 2 * 24 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "today": 24 * 60 * 60 * 1000, // Today will filter to today's articles only
};

interface NewsletterClientProps {
  articles: NewsArticle[];
  now: number;
}

export default function NewsletterClient({ articles, now }: NewsletterClientProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NewsCategoryId | "all">("all");
  const [activeSource, setActiveSource] = useState<string>("all");
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange | "all">("72h");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [aiibOnly, setAiibOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"news" | "newsletter">("news");
  const [taggedSections, setTaggedSections] = useState<Record<string, NewsletterSectionId>>({});

  // localStorage 持久化
  useEffect(() => {
    const saved = localStorage.getItem("tagged-sections");
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { setTaggedSections(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tagged-sections", JSON.stringify(taggedSections));
  }, [taggedSections]);

  const toggleTag = (article: NewsArticle) => {
    setTaggedSections((prev) => {
      const next = { ...prev };
      if (next[article.id]) {
        delete next[article.id];
      } else {
        next[article.id] = getNewsletterSection(article);
      }
      return next;
    });
  };

  const taggedCount = Object.keys(taggedSections).length;

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const articleTime = new Date(article.publishedAt).getTime();
      const articleDate = new Date(article.publishedAt).toDateString();

      if (activeTimeRange === "custom") {
        if (customStart && articleTime < new Date(customStart).getTime()) return false;
        if (customEnd && articleTime > new Date(customEnd).getTime()) return false;
      } else if (activeTimeRange !== "all" && activeTimeRange !== "custom") {
        const articleDate = new Date(article.publishedAt).toDateString();
        if (activeTimeRange === "today") {
          const today = new Date(now).toDateString();
          if (articleDate !== today) return false;
        } else {
          const age = now - articleTime;
          if (age > RANGE_MS[activeTimeRange]) return false;
        }
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

  const sourceIdsInUse = useMemo(() => Array.from(new Set(articles.map((a) => a.sourceId))), [articles]);
  const aiibCount = articles.filter((a) => a.entityIds.includes("aiib")).length;

  const activeFilterCount =
    (activeCategory !== "all" ? 1 : 0) +
    (activeSource !== "all" ? 1 : 0) +
    (activeTimeRange !== "all" ? 1 : 0) +
    (aiibOnly ? 1 : 0);

  const timeLabel = activeTimeRange === "custom"
    ? `${customStart ? customStart.replace("T", " ") : "不限"} ~ ${customEnd ? customEnd.replace("T", " ") : "不限"}`
    : TIME_RANGE_OPTIONS.find((t) => t.id === activeTimeRange)?.label ?? "全部";

  const resetAll = () => {
    setActiveCategory("all");
    setActiveSource("all");
    setActiveTimeRange("all");
    setCustomStart("");
    setCustomEnd("");
    setAiibOnly(false);
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      {/* 搜索栏 + 视图切换 + 移动端筛选按钮 */}
      <div className="mb-4 flex gap-2">
        {view === "news" && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索新闻标题、摘要或地区…"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
          />
        )}
        {view === "news" && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 md:hidden"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
            </svg>
            筛选
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-neutral-900 px-1.5 text-xs text-white dark:bg-neutral-100 dark:text-neutral-900">{activeFilterCount}</span>
            )}
          </button>
        )}
        {/* 视图切换 */}
        <div className={`flex shrink-0 rounded-lg border border-neutral-300 p-0.5 dark:border-neutral-700 ${view === "newsletter" ? "ml-auto" : ""}`}>
          <button
            onClick={() => setView("news")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              view === "news"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            }`}
          >
            新闻
          </button>
          <button
            onClick={() => setView("newsletter")}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              view === "newsletter"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            }`}
          >
            Newsletter
          </button>
        </div>
      </div>

      {view === "newsletter" ? (
        <NewsletterView
          articles={articles}
          taggedSections={taggedSections}
          onSectionChange={(id, section) => setTaggedSections((prev) => ({ ...prev, [id]: section }))}
          onRemove={(id) => setTaggedSections((prev) => { const n = { ...prev }; delete n[id]; return n; })}
          onClear={() => setTaggedSections({})}
        />
      ) : (
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* ---- 侧边栏 ---- */}
        <aside className={`${showFilters ? "block" : "hidden"} w-full md:block md:w-56 md:shrink-0 lg:w-64`}>
          <div className="space-y-5">
            {activeFilterCount > 0 && (
              <button onClick={resetAll} className="text-xs text-neutral-400 transition hover:text-neutral-600 dark:hover:text-neutral-300">
                ↺ 清除所有筛选
              </button>
            )}

            {/* 时间范围 */}
            <FilterSection title="时间范围">
              <div className="flex flex-wrap gap-1.5">
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setActiveTimeRange(opt.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs transition ${
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
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-neutral-500 dark:text-neutral-400">结束时间</label>
                    <input
                      type="datetime-local"
                      step={60}
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
                    />
                  </div>
                </div>
              )}
            </FilterSection>

            {/* AIIB 专题 */}
            {aiibCount > 0 && (
              <FilterSection title="专题追踪">
                <button
                  onClick={() => setAiibOnly(!aiibOnly)}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
                    aiibOnly
                      ? "bg-blue-600 font-medium text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-[10px] font-bold text-white">A</span>
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
              {activeTimeRange !== "all" && (
                <button onClick={() => setActiveTimeRange("all")} className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400">
                  试试更长的时间范围
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((article) => (
                <NewsCard key={article.id} article={article} tagged={!!taggedSections[article.id]} onToggleTag={() => toggleTag(article)} />
              ))}
            </div>
          )}
        </main>
      </div>
      )}
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
      className={`flex items-center rounded-lg px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-neutral-900 font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function NewsCard({ article, tagged, onToggleTag }: { article: NewsArticle; tagged: boolean; onToggleTag: () => void }) {
  const hasAiib = article.entityIds.includes("aiib");
  const otherEntities = article.entityIds.filter((id) => id !== "aiib");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `${article.title}\n${article.url}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article
      className={`group rounded-xl border bg-white p-4 transition hover:shadow-sm dark:bg-neutral-900 sm:p-5 ${
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
        <span className="font-medium text-neutral-600 dark:text-neutral-300">
          {article.sourceName || article.sourceId}
        </span>
        <span className="text-neutral-300 dark:text-neutral-600">·</span>
        <span className="text-neutral-500 dark:text-neutral-400">{article.region}</span>
      </div>

      <h2 className="mb-1.5 text-sm font-semibold leading-snug sm:text-base">
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
        <span className="ml-auto flex items-center gap-3">
          <button
            onClick={onToggleTag}
            className={`inline-flex items-center gap-1 transition ${
              tagged ? "text-blue-600 dark:text-blue-400" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill={tagged ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {tagged ? "已收录" : "Tag"}
          </button>
          <button
            onClick={handleShare}
            className={`inline-flex items-center gap-1 transition hover:text-neutral-600 dark:hover:text-neutral-300 ${
              copied ? "text-green-500" : "text-neutral-400"
            }`}
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已复制
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-8 4h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
                </svg>
                Share
              </>
            )}
          </button>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-neutral-400 transition group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
            阅读原文
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </span>
      </div>
    </article>
  );
}

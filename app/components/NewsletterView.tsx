"use client";

import { useMemo, useState } from "react";
import type { NewsArticle } from "@/app/lib/types";

export type NewsletterSectionId =
  | "aiib"
  | "macro-political"
  | "asia-pacific"
  | "finance"
  | "peer-highlights"
  | "deeper-dives";

export const NEWSLETTER_SECTIONS: { id: NewsletterSectionId; label: string }[] = [
  { id: "aiib", label: "AIIB in the News" },
  { id: "macro-political", label: "Macro and Political" },
  { id: "asia-pacific", label: "Asia-Pacific" },
  { id: "finance", label: "Finance and Capital Markets" },
  { id: "peer-highlights", label: "Peer Highlights" },
  { id: "deeper-dives", label: "Deeper Dives" },
];

export function getNewsletterSection(article: NewsArticle): NewsletterSectionId {
  if (article.entityIds.includes("aiib")) return "aiib";
  if (article.category === "global-affairs" || article.category === "trade-policy") return "macro-political";
  if (article.category === "asia-pacific") return "asia-pacific";
  if (article.category === "markets") return "finance";
  if (article.category === "multilateral") return "peer-highlights";
  return "macro-political";
}

interface NewsletterViewProps {
  articles: NewsArticle[];
  taggedSections: Record<string, NewsletterSectionId>;
  onSectionChange: (articleId: string, section: NewsletterSectionId) => void;
  onRemove: (articleId: string) => void;
  onClear: () => void;
}

export default function NewsletterView({
  articles,
  taggedSections,
  onSectionChange,
  onRemove,
  onClear,
}: NewsletterViewProps) {
  const [copied, setCopied] = useState(false);

  const taggedArticles = useMemo(() => {
    return articles.filter((a) => taggedSections[a.id]);
  }, [articles, taggedSections]);

  const grouped = useMemo(() => {
    const map: Record<string, NewsArticle[]> = {};
    for (const article of taggedArticles) {
      const section = taggedSections[article.id];
      if (!map[section]) map[section] = [];
      map[section].push(article);
    }
    return map;
  }, [taggedArticles, taggedSections]);

  const handleCopy = () => {
    let text = '<span style="font-family:Arial;font-size:12px"><strong>全球政经要闻 Newsletter</strong></span>\n\n';
    for (const section of NEWSLETTER_SECTIONS) {
      const items = grouped[section.id];
      if (!items || items.length === 0) continue;
      text += `<span style="font-family:Arial;font-size:14px;font-weight:bold">${section.label}</span>\n`;
      for (const item of items) {
        text += `• ${item.title}\n  ${item.url}\n`;
      }
      text += "\n";
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (taggedArticles.length === 0) {
    return (
      <div className="w-full rounded-xl border border-dashed border-neutral-300 py-20 text-center dark:border-neutral-700">
        <svg className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <p className="text-neutral-500 dark:text-neutral-400">还没有收录任何新闻</p>
        <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
          回到新闻列表，点击 Tag 按钮收录文章
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 工具栏 */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          已收录 {taggedArticles.length} 篇
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              copied
                ? "bg-green-500 text-white"
                : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            }`}
          >
            {copied ? "已复制" : "复制 Newsletter"}
          </button>
          <button
            onClick={onClear}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-500 transition hover:text-red-500 dark:border-neutral-700 dark:text-neutral-400"
          >
            清空
          </button>
        </div>
      </div>

      {/* 分组展示 */}
      <div className="space-y-8">
        {NEWSLETTER_SECTIONS.map((section) => {
          const items = grouped[section.id];
          if (!items || items.length === 0) return null;
          return (
            <div key={section.id}>
              <h2 className="mb-3 border-b border-neutral-200 pb-2 text-base font-bold text-neutral-900 dark:border-neutral-800 dark:text-neutral-100">
                {section.label}
              </h2>
              <div className="space-y-1">
                {items.map((article) => (
                  <div key={article.id} className="group flex items-start gap-2 rounded-lg px-2 py-2 transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <span className="mt-0.5 shrink-0 text-xs text-neutral-300 dark:text-neutral-600">•</span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block break-words text-sm text-neutral-700 hover:text-neutral-900 hover:underline dark:text-neutral-300 dark:hover:text-neutral-100"
                      >
                        {article.title}
                      </a>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block break-all text-xs text-neutral-400 hover:underline dark:text-neutral-500"
                      >
                        {article.url}
                      </a>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 md:opacity-0 md:transition md:group-hover:opacity-100">
                      <select
                        value={taggedSections[article.id]}
                        onChange={(e) => onSectionChange(article.id, e.target.value as NewsletterSectionId)}
                        className="rounded border border-neutral-200 bg-transparent px-1 py-0.5 text-xs text-neutral-400 outline-none dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        {NEWSLETTER_SECTIONS.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => onRemove(article.id)}
                        className="text-neutral-300 transition hover:text-red-500 dark:text-neutral-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

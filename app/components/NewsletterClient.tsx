"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { NewsArticle, NewsCategoryId } from "@/app/lib/types";
import {
  NEWS_CATEGORIES,
  COUNTRY_TOPICS,
  getCategoryLabel,
  getCountryName,
  getEntityName,
} from "@/app/lib/preferences";
import { formatFullDate, formatRelativeTime } from "@/app/lib/utils";
import NewsletterView, {
  getNewsletterSection,
  type NewsletterSectionId,
} from "@/app/components/NewsletterView";

type TimeRange = "72h" | "48h" | "24h" | "today" | "custom";

const TIME_RANGE_OPTIONS: { id: TimeRange; label: string }[] = [
  { id: "72h", label: "72小时" },
  { id: "48h", label: "48小时" },
  { id: "24h", label: "24小时" },
  { id: "today", label: "Today" },
  { id: "custom", label: "自定义" },
];

const RANGE_MS: Record<Exclude<TimeRange, "custom">, number> = {
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
  const [activeCategory, setActiveCategory] = useState<NewsCategoryId | "all">("all");
  const [activeSource, setActiveSource] = useState<string>("all");
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange>("72h");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeCountry, setActiveCountry] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // 顶层板块筛选（替代原 activeCategory + aiibOnly）
  // aiib / macro（=global-affairs+trade-policy）/ asia / finance / peers / all
  type Section = "all" | "aiib" | "macro" | "asia" | "finance" | "peers";
  const [activeSection, setActiveSection] = useState<Section>("all");
  const [view, setView] = useState<"news" | "newsletter">("news");
  const [taggedSections, setTaggedSections] = useState<Record<string, NewsletterSectionId>>({});

  // ---- 房间同步（多端 Tag 同步）----
  // lazy initializer：避免在 effect 中 setState（react-hooks/set-state-in-effect）
  // SSR 时返回 null，客户端首渲染即拿到 localStorage 值，避免 hydration mismatch 与闪烁
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("room-code");
  });
  const [roomStatus, setRoomStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [roomInput, setRoomInput] = useState("");
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const isLocalChange = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 创建房间
  const handleCreateRoom = async () => {
    setRoomStatus("connecting");
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", data: { taggedSections, updatedAt: Date.now() } }),
      });
      const json = await res.json();
      if (json.code) {
        setRoomCode(json.code);
        setRoomStatus("connected");
        localStorage.setItem("room-code", json.code);
        setShowRoomPanel(false);
      } else {
        setRoomStatus("error");
      }
    } catch {
      setRoomStatus("error");
    }
  };

  // 加入房间
  const handleJoinRoom = async () => {
    if (!roomInput.trim()) return;
    setRoomStatus("connecting");
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", code: roomInput.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (json.code) {
        setRoomCode(json.code);
        setRoomStatus("connected");
        localStorage.setItem("room-code", json.code);
        // 合并服务器数据到本地
        if (json.data?.taggedSections) {
          isLocalChange.current = false;
          setTaggedSections(json.data.taggedSections);
        }
        setShowRoomPanel(false);
        setRoomInput("");
      } else {
        setRoomStatus("error");
      }
    } catch {
      setRoomStatus("error");
    }
  };

  // 离开房间
  const handleLeaveRoom = () => {
    setRoomCode(null);
    setRoomStatus("idle");
    localStorage.removeItem("room-code");
  };

  // 本地变更 → debounce push 到服务器
  useEffect(() => {
    if (!roomCode || !isLocalChange.current) return;
    isLocalChange.current = false;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      await fetch("/api/room", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: roomCode, data: { taggedSections, updatedAt: Date.now() } }),
      });
    }, 600);
  }, [taggedSections, roomCode]);

  // 轮询服务器更新（每 4 秒）
  useEffect(() => {
    if (!roomCode) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/room?code=${roomCode}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.taggedSections) {
            const serverData = JSON.stringify(json.data.taggedSections);
            const localData = JSON.stringify(taggedSections);
            if (serverData !== localData) {
              isLocalChange.current = false;
              setTaggedSections(json.data.taggedSections);
            }
          }
        }
      } catch {}
    };
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [roomCode]);

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
    isLocalChange.current = true;
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
      } else if (activeTimeRange === "today") {
        const today = new Date(now).toDateString();
        if (articleDate !== today) return false;
      } else {
        const age = now - articleTime;
        if (age > RANGE_MS[activeTimeRange]) return false;
      }

      // 顶层板块筛选
      if (activeSection === "aiib") {
        if (!article.entityIds.includes("aiib")) return false;
      } else if (activeSection === "macro") {
        if (article.category !== "global-affairs" && article.category !== "trade-policy") return false;
      } else if (activeSection === "asia") {
        if (article.category !== "asia-pacific") return false;
      } else if (activeSection === "finance") {
        if (article.category !== "markets") return false;
      } else if (activeSection === "peers") {
        if (article.category !== "multilateral") return false;
      }
      if (activeCategory !== "all" && article.category !== activeCategory) return false;
      if (activeSource !== "all" && article.sourceId !== activeSource) return false;
      if (activeCountry !== "all" && !(article.countryIds || []).includes(activeCountry)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${article.title} ${article.summary} ${article.region}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [articles, activeCategory, activeSection, activeSource, activeTimeRange, activeCountry, customStart, customEnd, searchQuery, now]);

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
    (activeCountry !== "all" ? 1 : 0) +
    (activeSection !== "all" ? 1 : 0);

  const timeLabel = activeTimeRange === "custom"
    ? `${customStart ? customStart.replace("T", " ") : "不限"} ~ ${customEnd ? customEnd.replace("T", " ") : "不限"}`
    : TIME_RANGE_OPTIONS.find((t) => t.id === activeTimeRange)?.label ?? "全部";

  const resetAll = () => {
    setActiveCategory("all");
    setActiveSection("all");
    setActiveSource("all");
    setActiveCountry("all");
    setActiveTimeRange("72h");
    setCustomStart("");
    setCustomEnd("");
    setSearchQuery("");
  };

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      window.location.reload();
    } catch {
      setRefreshing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8 lg:max-w-screen-xl">
      {/* 顶部：搜索 + 视图切换 */}
      <div className="mb-3 flex items-center gap-2">
        {view === "news" && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索新闻标题、摘要或地区…"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
          />
        )}
        {/* 视图切换 */}
        <div className="flex shrink-0 rounded-lg border border-neutral-300 p-0.5 dark:border-neutral-700">
          <button
            onClick={() => setView("news")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === "news"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            }`}
          >
            新闻
          </button>
          <button
            onClick={() => setView("newsletter")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === "newsletter"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400"
            }`}
          >
            Newsletter
          </button>
        </div>
        {/* 手动刷新按钮：强制 ISR 缓存失效，重新抓取 RSS */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-500 transition hover:text-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-100"
          title="刷新新闻"
        >
          <svg className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">{refreshing ? "刷新中" : "刷新"}</span>
        </button>

        {/* 房间同步 */}
        {roomCode ? (
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm dark:border-green-800 dark:bg-green-900/30">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="font-mono font-medium text-green-700 dark:text-green-300">{roomCode}</span>
            <button onClick={handleLeaveRoom} className="ml-1 text-green-400 hover:text-red-500" title="断开同步">✕</button>
          </div>
        ) : showRoomPanel ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="输入房间码"
              maxLength={6}
              className="w-24 rounded-lg border border-neutral-300 px-2.5 py-2 text-sm font-mono uppercase outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <button onClick={handleJoinRoom} disabled={roomStatus === "connecting"} className="rounded-lg bg-neutral-900 px-2.5 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900">
              加入
            </button>
            <button onClick={handleCreateRoom} disabled={roomStatus === "connecting"} className="rounded-lg border border-neutral-300 px-2.5 py-2 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
              新建
            </button>
            <button onClick={() => setShowRoomPanel(false)} className="px-1 text-neutral-400 hover:text-neutral-600">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowRoomPanel(true)}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-500 transition hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-100"
            title="多端同步"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="hidden sm:inline">同步</span>
          </button>
        )}
      </div>

      {view === "newsletter" ? (
        <NewsletterView
          articles={articles}
          taggedSections={taggedSections}
          onSectionChange={(id, section) => { isLocalChange.current = true; setTaggedSections((prev) => ({ ...prev, [id]: section })); }}
          onRemove={(id) => { isLocalChange.current = true; setTaggedSections((prev) => { const n = { ...prev }; delete n[id]; return n; }); }}
          onClear={() => { isLocalChange.current = true; setTaggedSections({}); }}
        />
      ) : (
      <>
        {/* 筛选条 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* 时间 */}
          <FilterChip label="时间" value={activeTimeRange === "custom" ? "自定义" : (TIME_RANGE_OPTIONS.find((t) => t.id === activeTimeRange)?.label ?? "全部")} active={true}>
            {(close) => (
              <div className="space-y-0.5">
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <DropdownItem key={opt.id} active={activeTimeRange === opt.id} onClick={() => { setActiveTimeRange(opt.id); close(); }}>
                    {opt.label}
                  </DropdownItem>
                ))}
                {activeTimeRange === "custom" && (
                  <div className="mt-2 space-y-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">
                    <div>
                      <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">起始时间</label>
                      <input type="datetime-local" step={60} value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-neutral-500 dark:text-neutral-400">结束时间</label>
                      <input type="datetime-local" step={60} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </FilterChip>

          {/* 板块 toggle chips（AIIB + 4 大板块，同级平铺） */}
          <SectionChip active={activeSection === "all"} onClick={() => setActiveSection("all")}>全部</SectionChip>
          <SectionChip active={activeSection === "aiib"} onClick={() => setActiveSection("aiib")} variant="aiib">
            AIIB
          </SectionChip>
          <SectionChip active={activeSection === "macro"} onClick={() => setActiveSection("macro")}>宏观&政治</SectionChip>
          <SectionChip active={activeSection === "asia"} onClick={() => setActiveSection("asia")}>亚太新闻</SectionChip>
          <SectionChip active={activeSection === "finance"} onClick={() => setActiveSection("finance")}>财经&经济</SectionChip>
          <SectionChip active={activeSection === "peers"} onClick={() => setActiveSection("peers")}>Peers</SectionChip>

          {/* 国家专题 */}
          <FilterChip label="国家" value={activeCountry === "all" ? "全部" : getCountryName(activeCountry)} active={activeCountry !== "all"}>
            {(close) => (
              <div className="space-y-0.5">
                <DropdownItem active={activeCountry === "all"} onClick={() => { setActiveCountry("all"); close(); }}>全部</DropdownItem>
                {COUNTRY_TOPICS.map((c) => (
                  <DropdownItem key={c.id} active={activeCountry === c.id} onClick={() => { setActiveCountry(c.id); close(); }}>
                    {c.name}
                  </DropdownItem>
                ))}
              </div>
            )}
          </FilterChip>

          {/* 媒体来源 */}
          <FilterChip label="媒体" value={activeSource === "all" ? "全部" : (articles.find((a) => a.sourceId === activeSource)?.sourceName ?? activeSource)} active={activeSource !== "all"}>
            {(close) => (
              <div className="max-h-[50vh] space-y-0.5 overflow-y-auto">
                <DropdownItem active={activeSource === "all"} onClick={() => { setActiveSource("all"); close(); }}>全部媒体</DropdownItem>
                {sourceIdsInUse.map((sid) => {
                  const sample = articles.find((a) => a.sourceId === sid);
                  return (
                    <DropdownItem key={sid} active={activeSource === sid} onClick={() => { setActiveSource(sid); close(); }}>
                      {sample?.sourceName ?? sid}
                    </DropdownItem>
                  );
                })}
              </div>
            )}
          </FilterChip>

          {/* 清除筛选 */}
          {activeFilterCount > 0 && (
            <button onClick={resetAll} className="shrink-0 text-xs text-neutral-400 transition hover:text-neutral-600 dark:hover:text-neutral-300">
              ✕ 清除
            </button>
          )}
        </div>

        {/* 主内容区 */}
        <main className="min-w-0">
          <div className="mb-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              共 {filtered.length} 篇 · {timeLabel}
              {activeCategory !== "all" && ` · ${getCategoryLabel(activeCategory)}`}
              {activeSection === "aiib" && ` · AIIB 专题`}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="w-full rounded-xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700">
              <p className="text-neutral-500 dark:text-neutral-400">没有找到匹配的新闻</p>
              <button onClick={() => setActiveTimeRange("72h")} className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400">
                试试更长的时间范围
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((article) => (
                <NewsCard key={article.id} article={article} tagged={!!taggedSections[article.id]} onToggleTag={() => toggleTag(article)} />
              ))}
            </div>
          )}
        </main>
      </>
      )}
    </div>
  );
}

function FilterChip({ label, value, active, children }: {
  label: string;
  value: string;
  active: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
          active && open
            ? "border-neutral-900 dark:border-neutral-100"
            : active
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
              : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        }`}
      >
        <span className="text-xs opacity-50">{label}</span>
        <span className="max-w-[100px] truncate font-medium">{value}</span>
        <svg className={`h-3 w-3 shrink-0 opacity-50 transition ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] max-w-[280px] rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            {children(close)}
          </div>
        </>
      )}
    </div>
  );
}

function DropdownItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-neutral-900 font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function SectionChip({ active, onClick, children, variant }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "aiib";
}) {
  const aiib = variant === "aiib";
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? aiib
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
          : aiib
            ? "border-blue-300 bg-white text-blue-600 hover:border-blue-500 dark:border-blue-800 dark:bg-neutral-900 dark:text-blue-400"
            : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
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
      className={`group rounded-xl border bg-white p-5 transition hover:shadow-sm dark:bg-neutral-900 sm:p-6 ${
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

      <h2 className="mb-3 text-sm font-semibold leading-snug sm:text-base">
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-neutral-900 transition group-hover:text-neutral-600 dark:text-neutral-100 dark:group-hover:text-neutral-300">
          {article.title}
        </a>
      </h2>

      {(article.countryIds || []).length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(article.countryIds || []).map((cid) => (
            <span key={cid} className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              {getCountryName(cid)}
            </span>
          ))}
        </div>
      )}

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

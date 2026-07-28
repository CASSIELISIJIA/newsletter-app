"use client";

import { useState } from "react";

export default function AccessPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || status === "loading") return;
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setStatus("success");
        window.location.replace("/");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "密码错误");
        setStatus("error");
      }
    } catch {
      setError("网络错误，请检查网络后重试");
      setStatus("error");
    }
  };

  const buttonLabel =
    status === "loading" ? "验证中…" :
    status === "success" ? "验证成功，跳转中…" :
    "进入";

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">全球政经要闻 Newsletter</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">请输入访问密码</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); setStatus("idle"); }}
            placeholder="访问密码"
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            enterKeyHint="go"
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
          />
          {error && (
            <p className="flex items-center gap-1 text-sm text-red-500">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "loading" || status === "success" || !password}
            className={`w-full rounded-lg py-3 text-base font-medium transition active:scale-[0.98] disabled:opacity-50 ${
              status === "success"
                ? "bg-green-500 text-white"
                : status === "error"
                ? "bg-red-500 text-white"
                : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            }`}
          >
            {buttonLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

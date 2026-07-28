export default function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <AccessContent searchParams={searchParams} />;
}

async function AccessContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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

        {/* 纯 HTML 表单，不依赖 JavaScript */}
        <form method="POST" action="/api/access">
          <input
            type="password"
            name="password"
            placeholder="访问密码"
            autoCapitalize="off"
            autoCorrect="off"
            enterKeyHint="go"
            required
            className="mb-3 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          {error && (
            <p className="mb-3 flex items-center gap-1 text-sm text-red-500">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              密码错误，请重试
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-900 py-3 text-base font-medium text-white transition active:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
          >
            进入
          </button>
        </form>
      </div>
    </div>
  );
}

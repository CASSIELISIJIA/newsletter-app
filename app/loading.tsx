export default function Loading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:px-6">
      <aside className="md:w-64 md:shrink-0">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="mb-2 h-3 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex flex-col gap-1">
                {[1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    className="h-8 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/50"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mb-6 h-11 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800/50" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800/50"
            />
          ))}
        </div>
      </main>
    </div>
  );
}

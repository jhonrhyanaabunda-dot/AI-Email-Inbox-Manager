/**
 * Streaming fallback shown while a dashboard route's data is loading.
 * Matches the inbox shell (sidebar + main area) so navigation feels instant
 * even when the server work for the next route hasn't finished.
 */
export default function DashboardLoading() {
  return (
    <div className="h-full animate-pulse bg-background">
      <div className="grid h-full md:grid-cols-[380px_1fr] lg:grid-cols-[400px_1fr]">
        {/* Thread list skeleton */}
        <aside className="flex h-full flex-col border-r border-border">
          <div className="flex h-12 items-center gap-2 border-b border-border px-3">
            <div className="h-6 w-16 rounded bg-muted" />
            <div className="h-6 w-16 rounded bg-muted/60" />
            <div className="h-6 w-16 rounded bg-muted/60" />
          </div>
          <ul className="flex-1 space-y-px overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="border-b border-border px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-12 rounded bg-muted/80" />
                  <div className="h-3 w-10 rounded bg-muted/50" />
                  <div className="ml-auto h-3 w-14 rounded bg-muted/50" />
                </div>
                <div className="mb-1.5 h-3.5 w-[80%] rounded bg-muted" />
                <div className="h-3 w-[60%] rounded bg-muted/60" />
              </li>
            ))}
          </ul>
        </aside>

        {/* Main pane skeleton */}
        <section className="hidden h-full flex-col items-center justify-center gap-4 p-10 md:flex">
          <div className="h-5 w-48 rounded bg-muted/80" />
          <div className="h-3 w-72 rounded bg-muted/60" />
          <div className="h-3 w-64 rounded bg-muted/60" />
        </section>
      </div>
    </div>
  );
}

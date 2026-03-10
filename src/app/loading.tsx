export default function Loading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <main className="max-w-2xl mx-auto pb-8">
        {/* Header skeleton */}
        <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-border px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="h-7 w-40 bg-bg-card rounded animate-pulse" />
              <div className="h-3 w-52 bg-bg-card rounded animate-pulse mt-2" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-bg-card rounded-full animate-pulse" />
            </div>
          </div>
        </header>

        {/* Filter tabs skeleton */}
        <div className="px-4 pt-3 flex gap-2 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-16 bg-bg-card rounded-full animate-pulse shrink-0" />
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="px-4 pt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-card rounded-xl border border-border overflow-hidden">
              <div className="w-full h-40 bg-border/30 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-border/30 rounded animate-pulse" />
                <div className="h-3 w-full bg-border/30 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-border/30 rounded-full animate-pulse" />
                  <div className="h-5 w-20 bg-border/30 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

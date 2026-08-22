function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-graphite ${className}`} />
}

export default function IndicadoresLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen xl:grid-cols-[280px_1fr]">
        <aside className="border-r border-border bg-graphite xl:sticky xl:top-0 xl:h-screen">
          <div className="flex h-full flex-col gap-6 p-5">
            <SkeletonBox className="h-20 bg-background" />
            <SkeletonBox className="h-10 rounded-full bg-background" />
            <div className="grid gap-2">
              {Array.from({ length: 9 }).map((_, index) => (
                <SkeletonBox key={index} className="h-12 bg-background" />
              ))}
            </div>
            <SkeletonBox className="mt-auto h-28 bg-background" />
          </div>
        </aside>

        <section className="min-w-0 px-4 py-6 md:px-7">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <SkeletonBox className="h-4 w-32" />
              <SkeletonBox className="mt-3 h-10 w-72" />
              <SkeletonBox className="mt-3 h-4 w-96 max-w-full" />
            </div>
            <div className="flex gap-2">
              <SkeletonBox className="h-12 w-32" />
              <SkeletonBox className="h-12 w-36 bg-lime/20" />
            </div>
          </header>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBox key={index} className="h-32" />
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
            <SkeletonBox className="h-[360px]" />
            <SkeletonBox className="h-[360px]" />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBox key={index} className="h-64" />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

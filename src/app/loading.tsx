export default function DashboardLoading() {
  return (
    <div className="safe-top safe-bottom mx-auto flex w-full max-w-lg flex-1 flex-col px-5">
      <header className="flex items-start justify-between pt-6">
        <div className="flex flex-col gap-2">
          <Shimmer className="h-3 w-24 rounded-full" />
          <Shimmer className="h-6 w-40 rounded-lg" />
          <Shimmer className="h-3 w-32 rounded-full" />
        </div>
        <Shimmer className="h-11 w-11 rounded-full" />
      </header>

      <div className="mt-5">
        <Shimmer className="h-16 w-full rounded-2xl" />
      </div>

      <section className="mt-7 flex-1 pb-10">
        <div className="mb-3 flex items-center justify-between">
          <Shimmer className="h-4 w-20 rounded-full" />
          <Shimmer className="h-8 w-24 rounded-full" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-[22px] border border-[#f0dde4] bg-white/60 p-3 shadow-[var(--shadow-card)]">
            <div className="-mx-1 flex gap-1.5 overflow-hidden px-1 pb-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Shimmer key={i} className="h-7 w-20 rounded-full" />
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[#f0dde4] bg-white/95 p-1.5 pl-3">
              <Shimmer className="h-4 flex-1 rounded-full" />
              <Shimmer className="h-9 w-9 rounded-full" />
            </div>
          </div>

          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[22px] border border-[#f0dde4] bg-white shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <Shimmer className="h-11 w-11 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Shimmer className="h-4 w-20 rounded-full" />
                  <Shimmer className="h-3 w-16 rounded-full" />
                </div>
                <Shimmer className="h-4 w-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[#fbe9ef] ${className ?? ""}`}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

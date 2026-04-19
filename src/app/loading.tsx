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
        <ul className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <div className="aspect-[5/6] rounded-[22px] border border-[#f0dde4] bg-white p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between">
                  <Shimmer className="h-11 w-11 rounded-2xl" />
                </div>
                <div className="mt-auto flex h-full flex-col justify-end gap-1.5">
                  <Shimmer className="h-4 w-16 rounded-full" />
                  <Shimmer className="h-3 w-20 rounded-full" />
                </div>
              </div>
            </li>
          ))}
        </ul>
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

export default function StoreLoading() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <header
        className="safe-top relative overflow-hidden px-5 pt-6 pb-8"
        style={{
          background:
            "linear-gradient(180deg, rgba(232,90,154,0.12) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <Shimmer className="h-9 w-20 rounded-full" />
          <Shimmer className="h-11 w-11 rounded-full" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Shimmer className="h-14 w-14 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <Shimmer className="h-3 w-24 rounded-full" />
            <Shimmer className="h-6 w-32 rounded-lg" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-32">
        <div className="sticky top-2 z-10">
          <Shimmer className="h-14 w-full rounded-2xl" />
        </div>

        <div className="mt-5">
          <Shimmer className="mb-2 h-4 w-24 rounded-full" />
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-1 rounded-2xl border border-[#f0dde4] bg-white pl-1 pr-1 py-1 shadow-[var(--shadow-card)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <Shimmer className="h-6 w-6 rounded-full" />
                </div>
                <div className="flex-1 py-2">
                  <Shimmer
                    className="h-4 rounded-full"
                    style={{ width: `${60 + (i % 3) * 15}%` }}
                  />
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <Shimmer className="h-5 w-5 rounded-full" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

function Shimmer({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#fbe9ef] ${className ?? ""}`}
      style={style}
      aria-hidden
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

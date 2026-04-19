"use client";

import { useLinkStatus } from "next/link";

export function StoreTilePending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[22px] bg-white/50 backdrop-blur-[1px]"
    >
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#e85a9a] border-t-transparent" />
    </span>
  );
}

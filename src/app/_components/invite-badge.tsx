"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function InviteBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copyCode}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#f0dde4] bg-white/70 px-4 py-3 text-left shadow-[var(--shadow-card)] backdrop-blur transition hover:bg-white"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-[0.12em] text-[#a8949c] uppercase">
          함께 쓸 짝꿍에게 공유
        </p>
        <p className="mt-0.5 font-mono text-[18px] font-bold tracking-[0.25em] text-[#2a1a24]">
          {code}
        </p>
      </div>
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ffd5e3] text-[#8a1b52]"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </span>
      <span className="sr-only">
        {copied ? "복사했어요" : "초대 코드 복사"}
      </span>
    </button>
  );
}

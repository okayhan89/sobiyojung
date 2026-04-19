"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { addStoreAction } from "../actions";

const EMOJI_CHOICES = [
  "🛒",
  "🛍️",
  "🧺",
  "🍎",
  "🥕",
  "🥬",
  "🍞",
  "🫐",
  "🎁",
  "🌸",
  "🧴",
  "👕",
];

const COLOR_CHOICES = [
  "#e85a9a",
  "#ff7a00",
  "#e5484d",
  "#46a758",
  "#30a46c",
  "#8e4ec6",
  "#03c75a",
  "#f53d5b",
  "#0091ff",
];

export function AddStoreButton({ householdId }: { householdId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(EMOJI_CHOICES[0]);
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setName("");
    setIcon(EMOJI_CHOICES[0]);
    setColor(COLOR_CHOICES[0]);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError("이름을 적어주세요.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addStoreAction({
        householdId,
        name: name.trim(),
        icon,
        color,
      });
      if (!result.success) {
        setError(result.error ?? "추가하지 못했어요.");
        return;
      }
      close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-full border border-[#f0dde4] bg-white/80 px-3 py-1.5 text-xs font-medium text-[#8a1b52] transition hover:bg-white"
      >
        <Plus size={13} />
        스토어 추가
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#2a1a24]/30 px-4 pb-0 backdrop-blur-sm sm:items-center sm:pb-6"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-store-title"
            onClick={(e) => e.stopPropagation()}
            className="safe-bottom w-full max-w-sm rounded-t-[24px] border border-[#f0dde4] bg-white p-5 shadow-2xl sm:rounded-[24px]"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3
                id="add-store-title"
                className="text-[15px] font-bold text-[#2a1a24]"
              >
                새 스토어
              </h3>
              <button
                type="button"
                onClick={close}
                aria-label="닫기"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#a8949c] hover:bg-[#fef7f9]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-[#6a5560]">
                  이름
                </span>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  placeholder="예: 이마트"
                  className="h-11 rounded-xl border border-[#f0dde4] bg-[#fef7f9] px-3 text-[15px] outline-none focus:border-[#e85a9a]"
                />
              </label>

              <div>
                <p className="mb-1.5 text-xs font-medium text-[#6a5560]">
                  아이콘
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {EMOJI_CHOICES.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`flex h-10 items-center justify-center rounded-xl border text-xl transition ${
                        icon === emoji
                          ? "border-[#e85a9a] bg-[#ffd5e3]"
                          : "border-transparent bg-[#fef7f9] hover:bg-[#fbe9ef]"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-[#6a5560]">
                  색상
                </p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_CHOICES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`색상 ${c}`}
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full transition ${
                        color === c
                          ? "ring-2 ring-offset-2 ring-[#2a1a24]"
                          : ""
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              {error ? (
                <p role="alert" className="text-xs text-[#e5484d]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 flex h-12 items-center justify-center rounded-full bg-[#e85a9a] text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(232,90,154,0.55)] transition active:translate-y-[1px] disabled:opacity-50"
              >
                {isPending ? "추가하는 중..." : "추가하기"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

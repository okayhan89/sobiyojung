"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreVertical, Trash2, X } from "lucide-react";
import { deleteStoreAction } from "./actions";

interface StoreMenuProps {
  storeId: string;
  storeName: string;
  itemCount: number;
}

export function StoreMenu({ storeId, storeName, itemCount }: StoreMenuProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteStoreAction({ storeId });
      if (!result.success) {
        setError(result.error ?? "삭제하지 못했어요.");
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="스토어 메뉴"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/60 text-[#2a1a24] backdrop-blur transition hover:bg-white"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen ? (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div
              role="menu"
              className="absolute right-0 top-11 z-40 w-44 overflow-hidden rounded-2xl border border-[#f0dde4] bg-white shadow-[0_20px_40px_-16px_rgba(138,27,82,0.25)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-[#e5484d] transition hover:bg-[#fef7f9]"
              >
                <Trash2 size={14} />
                스토어 삭제
              </button>
            </div>
          </>
        ) : null}
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#2a1a24]/40 px-4 backdrop-blur-sm sm:items-center sm:pb-6"
          onClick={() => (isPending ? null : setConfirmOpen(false))}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            onClick={(e) => e.stopPropagation()}
            className="safe-bottom w-full max-w-sm rounded-t-[24px] border border-[#f0dde4] bg-white p-5 shadow-2xl sm:rounded-[24px]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3
                  id="confirm-delete-title"
                  className="text-[15px] font-bold text-[#2a1a24]"
                >
                  {storeName} 스토어를 삭제할까요?
                </h3>
                <p className="mt-1 text-[13px] leading-5 text-[#6a5560]">
                  {itemCount > 0
                    ? `안에 있는 ${itemCount}개 항목과 기록도 모두 함께 지워져요. 복구할 수 없어요.`
                    : "되돌릴 수 없어요."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                aria-label="닫기"
                disabled={isPending}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#a8949c] hover:bg-[#fef7f9] disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            {error ? (
              <p role="alert" className="mb-3 text-xs text-[#e5484d]">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex h-12 items-center justify-center rounded-full bg-[#e5484d] text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(229,72,77,0.55)] transition active:translate-y-[1px] disabled:opacity-50"
              >
                {isPending ? "삭제하는 중..." : "삭제하기"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="flex h-11 items-center justify-center rounded-full text-[14px] font-medium text-[#6a5560] transition hover:bg-[#fef7f9] disabled:opacity-40"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

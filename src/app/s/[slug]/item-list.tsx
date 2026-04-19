"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_SCHEMA } from "@/lib/supabase/schema";
import type { Item } from "@/lib/types";
import {
  addItemAction,
  deleteItemAction,
  toggleItemAction,
} from "./actions";

interface ItemListProps {
  storeId: string;
  accent: string;
  initialItems: Item[];
  initialSuggestions: string[];
}

export function ItemList({
  storeId,
  accent,
  initialItems,
  initialSuggestions,
}: ItemListProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`items:${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: SUPABASE_SCHEMA,
          table: "items",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          setItems((prev) =>
            applyRealtimeChange(prev, payload as unknown as RealtimePayload),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const { open, done } = useMemo(() => split(items), [items]);

  // Merge server-fetched household history with current session's items,
  // dedupe, and cap. Session items come first (most relevant).
  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of items) {
      const t = item.text.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    for (const t of initialSuggestions) {
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out.slice(0, 80);
  }, [items, initialSuggestions]);

  const datalistId = `suggestions-${storeId}`;

  function submitAdd() {
    const value = text.trim();
    if (!value) return;

    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Item = {
      id: tempId,
      store_id: storeId,
      text: value,
      checked: false,
      created_by: null,
      created_at: new Date().toISOString(),
      checked_at: null,
    };
    setItems((prev) => [optimistic, ...prev]);
    setText("");
    setError(null);
    inputRef.current?.focus();

    const finalText = value;
    startTransition(async () => {
      const result = await addItemAction({ storeId, text: finalText });
      if (!result.success) {
        setItems((prev) => prev.filter((i) => i.id !== tempId));
        setError(result.error ?? "추가 실패");
        return;
      }
      // Replace optimistic temp row with the server-confirmed row so later
      // toggles hit the real UUID (not a non-existent temp id).
      if (result.item) {
        const real = result.item;
        setItems((prev) => {
          if (prev.some((i) => i.id === real.id)) {
            return prev.filter((i) => i.id !== tempId);
          }
          return prev.map((i) => (i.id === tempId ? real : i));
        });
      }
    });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitAdd();
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Don't fire submit while Korean IME is mid-composition, and guard against
    // buggy platforms where Enter doesn't trigger native form submit (some
    // iOS builds with datalist).
    if (e.key !== "Enter") return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    submitAdd();
  }

  function handleToggle(item: Item) {
    // Don't toggle an optimistic row whose server write hasn't completed yet —
    // the update would target a non-existent uuid and silently no-op.
    if (item.id.startsWith("temp-")) return;

    const nextChecked = !item.checked;
    const checkedAt = nextChecked ? new Date().toISOString() : null;

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, checked: nextChecked, checked_at: checkedAt }
          : i,
      ),
    );

    startTransition(async () => {
      const result = await toggleItemAction({
        itemId: item.id,
        checked: nextChecked,
      });
      if (!result.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  checked: item.checked,
                  checked_at: item.checked_at,
                }
              : i,
          ),
        );
      }
    });
  }

  function handleDelete(item: Item) {
    if (item.id.startsWith("temp-")) return;

    setItems((prev) => prev.filter((i) => i.id !== item.id));

    startTransition(async () => {
      const result = await deleteItemAction({ itemId: item.id });
      if (!result.success) {
        setItems((prev) => [item, ...prev]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-32">
      <form onSubmit={handleAdd} className="sticky top-2 z-10">
        <div
          className="flex items-center gap-2 rounded-2xl border border-[#f0dde4] bg-white/90 p-2 pl-4 shadow-[var(--shadow-card)] backdrop-blur"
          style={{ boxShadow: `0 12px 32px -18px ${accent}55` }}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="예: 딸기 2팩"
            maxLength={80}
            list={datalistId}
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-[#2a1a24] outline-none placeholder:text-[#c4b5bc]"
          />
          <datalist id={datalistId}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button
            type="submit"
            aria-label="추가"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-[0_8px_18px_-6px_rgba(232,90,154,0.55)] transition active:translate-y-[1px] active:scale-95 disabled:opacity-50"
            style={{ background: accent }}
            disabled={text.trim().length === 0}
          >
            <Plus size={20} />
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-[#e5484d]">
            {error}
          </p>
        ) : null}
      </form>

      <section>
        <SectionHeading label="사고싶은 것" count={open.length} />
        {open.length === 0 ? (
          <EmptyState label="아직 적어둔 게 없어요" />
        ) : (
          <ul className="flex flex-col gap-2">
            {open.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                accent={accent}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section>
          <SectionHeading label="이미 샀거나 보류" count={done.length} dim />
          <ul className="flex flex-col gap-2">
            {done.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                accent={accent}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SectionHeading({
  label,
  count,
  dim,
}: {
  label: string;
  count: number;
  dim?: boolean;
}) {
  return (
    <div className="mb-2 flex items-baseline gap-2 px-1">
      <h2
        className={`text-[13px] font-semibold ${
          dim ? "text-[#a8949c]" : "text-[#2a1a24]"
        }`}
      >
        {label}
      </h2>
      <span className="text-[11px] font-medium text-[#c4b5bc]">{count}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#f0dde4] bg-white/60 p-5 text-center text-sm text-[#a8949c]">
      {label}
    </p>
  );
}

function ItemRow({
  item,
  accent,
  onToggle,
  onDelete,
}: {
  item: Item;
  accent: string;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
}) {
  return (
    <li
      className={`flex items-center gap-1 rounded-2xl border border-[#f0dde4] bg-white pl-1 pr-1 py-1 transition ${
        item.checked ? "opacity-60" : "shadow-[var(--shadow-card)]"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        aria-pressed={item.checked}
        aria-label={item.checked ? "되돌리기" : "완료"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 active:bg-[#fef7f9]"
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 transition"
          style={{
            borderColor: item.checked ? accent : "#d9c7cf",
            background: item.checked ? accent : "transparent",
          }}
        >
          {item.checked ? (
            <svg
              aria-hidden
              viewBox="0 0 12 12"
              className="h-3 w-3 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6.2 L5 9 L10 3.4" />
            </svg>
          ) : null}
        </span>
      </button>

      <span
        className={`flex-1 py-2 text-[15px] ${
          item.checked
            ? "text-[#a8949c] line-through decoration-[#d9c7cf]"
            : "text-[#2a1a24]"
        }`}
      >
        {item.text}
      </span>

      <button
        type="button"
        onClick={() => onDelete(item)}
        aria-label="삭제"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#c4b5bc] transition hover:bg-[#fef7f9] hover:text-[#e5484d] active:scale-95 active:bg-[#fdeaef] active:text-[#e5484d]"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}

function split(items: Item[]): { open: Item[]; done: Item[] } {
  const open: Item[] = [];
  const done: Item[] = [];
  for (const item of items) {
    if (item.checked) {
      done.push(item);
    } else {
      open.push(item);
    }
  }
  return { open, done };
}

interface RealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Item | Record<string, never>;
  old: Item | Record<string, never>;
}

function applyRealtimeChange(prev: Item[], payload: RealtimePayload): Item[] {
  if (payload.eventType === "INSERT") {
    const next = payload.new as Item;
    if (prev.some((i) => i.id === next.id)) return prev;
    // Replace any optimistic temp row with the server-confirmed one
    // (matched by same text + store, within temp id prefix) to prevent
    // duplicates and to let subsequent toggles hit the real row.
    const deduped = prev.filter(
      (i) =>
        !(
          i.id.startsWith("temp-") &&
          i.text === next.text &&
          i.store_id === next.store_id
        ),
    );
    return [next, ...deduped];
  }
  if (payload.eventType === "UPDATE") {
    const next = payload.new as Item;
    return prev.map((i) => (i.id === next.id ? next : i));
  }
  if (payload.eventType === "DELETE") {
    const old = payload.old as Item;
    return prev.filter((i) => i.id !== old.id);
  }
  return prev;
}

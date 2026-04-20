"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_SCHEMA } from "@/lib/supabase/schema";
import type { Item, Store } from "@/lib/types";
import {
  addItemAction,
  deleteItemAction,
  toggleItemAction,
} from "@/app/s/[slug]/actions";

interface DashboardStoresProps {
  stores: Store[];
  initialItems: Item[];
  householdId: string;
  suggestions: string[];
}

export function DashboardStores({
  stores,
  initialItems,
  householdId,
  suggestions,
}: DashboardStoresProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    stores[0]?.id ?? null,
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`household-${householdId}-items`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: SUPABASE_SCHEMA,
          table: "items",
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
  }, [householdId]);

  const itemsByStore = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const list = map.get(item.store_id);
      if (list) list.push(item);
      else map.set(item.store_id, [item]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      });
    }
    return map;
  }, [items]);

  if (stores.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#f0dde4] bg-white/60 p-6 text-center text-sm text-[#a8949c]">
        아직 스토어가 없어요. 새로 추가해 볼까요?
      </p>
    );
  }

  const selectedStore =
    stores.find((s) => s.id === selectedStoreId) ?? stores[0];

  return (
    <div className="flex flex-col gap-3">
      <UnifiedAddBar
        stores={stores}
        selectedStore={selectedStore}
        onSelectStore={setSelectedStoreId}
        suggestions={suggestions}
        onAddLocal={setItems}
      />
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          allItems={itemsByStore.get(store.id) ?? []}
          onLocalChange={setItems}
        />
      ))}
    </div>
  );
}

interface UnifiedAddBarProps {
  stores: Store[];
  selectedStore: Store;
  onSelectStore: (id: string) => void;
  suggestions: string[];
  onAddLocal: React.Dispatch<React.SetStateAction<Item[]>>;
}

function UnifiedAddBar({
  stores,
  selectedStore,
  onSelectStore,
  suggestions,
  onAddLocal,
}: UnifiedAddBarProps) {
  const accent = selectedStore.color ?? "#e85a9a";
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [, startTransition] = useTransition();

  function submitAdd() {
    const value = text.trim();
    if (!value) return;

    const storeId = selectedStore.id;
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
    onAddLocal((prev) => [optimistic, ...prev]);
    setText("");
    setError(null);
    inputRef.current?.focus();

    const finalText = value;
    startTransition(async () => {
      const result = await addItemAction({ storeId, text: finalText });
      if (!result.success) {
        onAddLocal((prev) => prev.filter((i) => i.id !== tempId));
        setError(result.error ?? "추가 실패");
        return;
      }
      if (result.item) {
        const real = result.item;
        onAddLocal((prev) => {
          if (prev.some((i) => i.id === real.id)) {
            return prev.filter((i) => i.id !== tempId);
          }
          return prev.map((i) => (i.id === tempId ? real : i));
        });
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitAdd();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    submitAdd();
  }

  return (
    <section
      className="rounded-[22px] border border-[#f0dde4] p-3 shadow-[var(--shadow-card)]"
      style={{
        background: `linear-gradient(180deg, ${accent}14 0%, #ffffff 70%)`,
      }}
    >
      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2.5"
        role="tablist"
        aria-label="스토어 선택"
      >
        {stores.map((store) => {
          const isSelected = store.id === selectedStore.id;
          const storeAccent = store.color ?? "#e85a9a";
          return (
            <button
              key={store.id}
              type="button"
              role="tab"
              onClick={() => onSelectStore(store.id)}
              aria-pressed={isSelected}
              aria-selected={isSelected}
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition active:scale-95"
              style={{
                borderColor: isSelected ? storeAccent : "#f0dde4",
                background: isSelected ? `${storeAccent}22` : "#ffffff",
                color: "#2a1a24",
              }}
            >
              <span className="text-[15px]" aria-hidden>
                {store.icon ?? "🛒"}
              </span>
              <span>{store.name}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 rounded-2xl border border-[#f0dde4] bg-white/95 p-1.5 pl-3 shadow-sm">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${selectedStore.name}에 추가...`}
            maxLength={80}
            list="dash-unified-suggestions"
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-[#2a1a24] outline-none placeholder:text-[#c4b5bc]"
          />
          <datalist id="dash-unified-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <button
            type="submit"
            aria-label={`${selectedStore.name}에 추가`}
            disabled={text.trim().length === 0}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition active:translate-y-[1px] active:scale-95 disabled:opacity-50"
            style={{ background: accent }}
          >
            <Plus size={18} />
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-1.5 px-2 text-[11px] text-[#e5484d]">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}

interface StoreCardProps {
  store: Store;
  allItems: Item[];
  onLocalChange: React.Dispatch<React.SetStateAction<Item[]>>;
}

function StoreCard({ store, allItems, onLocalChange }: StoreCardProps) {
  const accent = store.color ?? "#e85a9a";
  const openItems = allItems.filter((i) => !i.checked);
  const openCount = openItems.length;
  const [, startTransition] = useTransition();

  function handleToggle(item: Item) {
    if (item.id.startsWith("temp-")) return;
    const nextChecked = !item.checked;
    const checkedAt = nextChecked ? new Date().toISOString() : null;

    onLocalChange((prev) =>
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
        onLocalChange((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, checked: item.checked, checked_at: item.checked_at }
              : i,
          ),
        );
      }
    });
  }

  function handleDelete(item: Item) {
    if (item.id.startsWith("temp-")) return;
    onLocalChange((prev) => prev.filter((i) => i.id !== item.id));
    startTransition(async () => {
      const result = await deleteItemAction({ itemId: item.id });
      if (!result.success) {
        onLocalChange((prev) => [item, ...prev]);
      }
    });
  }

  return (
    <section
      className="relative overflow-hidden rounded-[22px] border border-[#f0dde4] bg-white shadow-[var(--shadow-card)]"
      style={{
        background: `linear-gradient(180deg, ${accent}0f 0%, #ffffff 60%)`,
      }}
    >
      <Link
        href={`/s/${store.slug}`}
        className="group flex items-center gap-3 px-4 py-3 transition active:scale-[0.99] active:bg-[#fef7f9]"
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl"
          style={{ background: `${accent}24` }}
        >
          {store.icon ?? "🛒"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-[#2a1a24]">
            {store.name}
          </p>
          <p className="mt-0.5 text-[11.5px] text-[#a8949c]">
            {openCount > 0 ? `${openCount}개 고민중` : "비어있음"}
          </p>
        </div>
        {openCount > 0 ? (
          <span
            className="rounded-full px-2 py-[2px] text-[11px] font-semibold text-white"
            style={{ background: accent }}
          >
            {openCount}
          </span>
        ) : null}
        <ChevronRight
          size={16}
          className="shrink-0 text-[#c4b5bc] transition group-hover:text-[#8a1b52]"
        />
      </Link>

      {allItems.length > 0 ? (
        <ul className="flex flex-col border-t border-[#f0dde4]/60 bg-white/70">
          {allItems.map((item) => (
            <InlineItemRow
              key={item.id}
              item={item}
              accent={accent}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function InlineItemRow({
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
      className={`flex items-center gap-1 border-b border-[#f0dde4]/60 px-2 last:border-0 ${
        item.checked ? "opacity-55" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        aria-pressed={item.checked}
        aria-label={item.checked ? "되돌리기" : "완료"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:bg-[#fef7f9] active:scale-95"
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition"
          style={{
            borderColor: item.checked ? accent : "#d9c7cf",
            background: item.checked ? accent : "transparent",
          }}
        >
          {item.checked ? (
            <svg
              aria-hidden
              viewBox="0 0 12 12"
              className="h-2.5 w-2.5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 6.2 L5 9 L10 3.4" />
            </svg>
          ) : null}
        </span>
      </button>
      <span
        className={`flex-1 py-2 text-[14px] ${
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#c4b5bc] transition hover:bg-[#fef7f9] hover:text-[#e5484d] active:bg-[#fdeaef] active:text-[#e5484d] active:scale-95"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
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

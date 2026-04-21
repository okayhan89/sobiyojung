import type { Item, Store } from "@/lib/types";

// Widget taps open the PWA cold. Blocking the first paint on Supabase round-trips
// (auth + household + stores + items) feels like "loading…" — we'd rather paint
// last-known data instantly and revalidate in the background.
//
// localStorage is sync and shared across tabs, which matches this use case:
// one user on one device, small payload, no cross-origin needs. IndexedDB would
// force an async boundary that defeats the "paint on first render" goal.

const ITEMS_PREFIX = "gglist:items:v1:";
const STORE_PREFIX = "gglist:store:v1:";
const SUGG_KEY = "gglist:suggestions:v1";

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readCachedItems(storeId: string): Item[] | null {
  if (!hasStorage()) return null;
  return safeParse<Item[]>(window.localStorage.getItem(ITEMS_PREFIX + storeId));
}

export function writeCachedItems(storeId: string, items: Item[]): void {
  if (!hasStorage()) return;
  try {
    // Drop optimistic temp rows before persisting — they won't exist on next load
    // and would re-appear as ghosts if we rehydrated them.
    const clean = items.filter((i) => !i.id.startsWith("temp-"));
    window.localStorage.setItem(ITEMS_PREFIX + storeId, JSON.stringify(clean));
  } catch {
    // Quota exceeded or private mode — silently skip, cache is best-effort.
  }
}

export function readCachedStore(slug: string): Store | null {
  if (!hasStorage()) return null;
  return safeParse<Store>(window.localStorage.getItem(STORE_PREFIX + slug));
}

export function writeCachedStore(slug: string, store: Store): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORE_PREFIX + slug, JSON.stringify(store));
  } catch {
    // noop
  }
}

export function readCachedSuggestions(): string[] | null {
  if (!hasStorage()) return null;
  return safeParse<string[]>(window.localStorage.getItem(SUGG_KEY));
}

export function writeCachedSuggestions(suggestions: string[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(SUGG_KEY, JSON.stringify(suggestions));
  } catch {
    // noop
  }
}

export function clearCachedItems(storeId: string): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(ITEMS_PREFIX + storeId);
}

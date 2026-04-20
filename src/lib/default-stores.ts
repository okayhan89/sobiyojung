export interface DefaultStoreConfig {
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export const DEFAULT_STORES: readonly DefaultStoreConfig[] = [
  { name: "쿠팡", slug: "coupang", icon: "📦", color: "#F53D5B" },
  { name: "식료품", slug: "food", icon: "🥬", color: "#F5A524" },
  { name: "네이버", slug: "naver", icon: "🟢", color: "#03C75A" },
] as const;

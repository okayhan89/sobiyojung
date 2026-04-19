export interface DefaultStoreConfig {
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export const DEFAULT_STORES: readonly DefaultStoreConfig[] = [
  { name: "당근", slug: "danggeun", icon: "🥕", color: "#FF7A00" },
  { name: "아웃렛", slug: "outlet", icon: "🛍️", color: "#E5484D" },
  { name: "시장", slug: "market", icon: "🍎", color: "#46A758" },
  { name: "오아시스", slug: "oasis", icon: "🥬", color: "#30A46C" },
  { name: "마켓컬리", slug: "kurly", icon: "💜", color: "#8E4EC6" },
  { name: "네이버", slug: "naver", icon: "🟢", color: "#03C75A" },
  { name: "쿠팡", slug: "coupang", icon: "📦", color: "#F53D5B" },
] as const;

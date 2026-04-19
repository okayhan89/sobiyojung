import type { MetadataRoute } from "next";
import { DEFAULT_STORES } from "@/lib/default-stores";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "소비요정의 쇼핑구매희망리스트",
    short_name: "소비요정",
    description: "이번 주에 어디서 뭘 살지 적어두는 공유 메모장",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fef7f9",
    theme_color: "#e85a9a",
    lang: "ko-KR",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: DEFAULT_STORES.map((store) => ({
      name: `${store.name} 리스트`,
      short_name: store.name,
      description: `${store.name}에서 살 것`,
      url: `/s/${store.slug}`,
      icons: [
        {
          src: `/icons/shortcut-${store.slug}.svg`,
          sizes: "96x96",
          type: "image/svg+xml",
        },
      ],
    })),
  };
}

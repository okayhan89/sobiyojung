import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_REGULAR =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Regular.ttf";
const FONT_BOLD =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Bold.ttf";

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load font ${url}: ${res.status}`);
  }
  return res.arrayBuffer();
}

const EMOJIS = ["🥕", "🛍️", "🍎", "🥬", "💜", "🟢", "📦"];

export default async function Image() {
  const [regular, bold] = await Promise.all([
    loadFont(FONT_REGULAR),
    loadFont(FONT_BOLD),
  ]);

  const prettyUrl = SITE_URL.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #ffd5e3 0%, #e85a9a 55%, #8a1b52 100%)",
          color: "white",
          fontFamily: "NanumGothic",
        }}
      >
        {/* top brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.22)",
              fontSize: "44px",
            }}
          >
            🧚‍♀️
          </div>
          <div
            style={{
              fontSize: "26px",
              letterSpacing: "6px",
              opacity: 0.92,
              fontWeight: 700,
            }}
          >
            SOBIYOJUNG
          </div>
        </div>

        {/* title + description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "92px",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-2px",
            }}
          >
            <div style={{ display: "flex" }}>소비요정의</div>
            <div style={{ display: "flex" }}>쇼핑구매희망리스트</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "26px",
              lineHeight: 1.55,
              maxWidth: "960px",
              opacity: 0.92,
              fontWeight: 400,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        {/* bottom row: emoji + url */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "14px",
              fontSize: "52px",
            }}
          >
            {EMOJIS.map((e) => (
              <div key={e} style={{ display: "flex" }}>
                {e}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              opacity: 0.9,
            }}
          >
            {prettyUrl}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "NanumGothic", data: regular, style: "normal", weight: 400 },
        { name: "NanumGothic", data: bold, style: "normal", weight: 700 },
      ],
    },
  );
}

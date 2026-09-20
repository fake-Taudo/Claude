import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = site.seo.title;

/** Social-Media-Vorschaubild – wird beim Build automatisch erzeugt. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(900px 500px at 15% 0%, #8b5cf655, transparent), radial-gradient(800px 500px at 100% 100%, #3b82f655, transparent), #07070c",
          color: "#f6f6f9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            K
          </div>
          <span style={{ fontWeight: 600 }}>{site.brand.name}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>
            Websites, die aus Besuchern zahlende Kunden machen.
          </div>
          <div style={{ fontSize: 30, color: "#a3a7bd" }}>
            {site.hero.trustLine.join("  ·  ")}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

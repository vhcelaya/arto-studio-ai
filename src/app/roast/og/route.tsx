import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const brand = searchParams.get("brand") || "Your Brand";
  const score = searchParams.get("score") || "?";
  const s = searchParams.get("s") || "–";
  const c = searchParams.get("c") || "–";
  const n = searchParams.get("n") || "–";
  const d = searchParams.get("d") || "–";

  const scoreNum = Number(score);
  const scoreColor =
    scoreNum >= 7 ? "#10b981" : scoreNum >= 5 ? "#f59e0b" : "#ef4444";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#18181b",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#a1a1aa",
            }}
          >
            ARTO STUDIO AI
          </span>
          <span style={{ fontSize: "20px", color: "#52525b" }}>×</span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#a1a1aa",
            }}
          >
            BRAND ROAST
          </span>
        </div>

        {/* Brand name + score */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: "40px",
            flex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "56px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                maxWidth: "600px",
              }}
            >
              {brand}
            </span>
            <span
              style={{
                fontSize: "18px",
                color: "#71717a",
                marginTop: "12px",
              }}
            >
              got roasted.
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "120px",
                fontWeight: 800,
                color: scoreColor,
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#52525b",
              }}
            >
              / 10
            </span>
          </div>
        </div>

        {/* Pillar scores */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "40px",
            paddingTop: "32px",
            borderTop: "1px solid #27272a",
          }}
        >
          {[
            { label: "Strategy", value: s },
            { label: "Creativity", value: c },
            { label: "Narrative", value: n },
            { label: "Digital", value: d },
          ].map((pillar) => (
            <div
              key={pillar.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "#71717a",
                  textTransform: "uppercase",
                }}
              >
                {pillar.label}
              </span>
              <span style={{ fontSize: "32px", fontWeight: 800 }}>
                {pillar.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const brand = searchParams.get("brand") || "Your Brand";
  const score = searchParams.get("score") || "0";
  const strategy = searchParams.get("s") || "0";
  const creativity = searchParams.get("c") || "0";
  const narrative = searchParams.get("n") || "0";
  const digital = searchParams.get("d") || "0";

  const scoreNum = parseFloat(score);
  const scoreColor =
    scoreNum >= 7 ? "#10b981" : scoreNum >= 5 ? "#f59e0b" : "#ef4444";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
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
              letterSpacing: "0.05em",
            }}
          >
            ARTO STUDIO AI
          </span>
          <span
            style={{
              fontSize: "16px",
              color: "#71717a",
              marginLeft: "8px",
            }}
          >
            Brand Roast
          </span>
        </div>

        {/* Brand + Score */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#71717a",
              }}
            >
              ARTO Score for
            </span>
            <span
              style={{
                fontSize: "64px",
                fontWeight: 800,
                lineHeight: 1.1,
                marginTop: "8px",
              }}
            >
              {brand}
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
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: "24px", color: "#71717a" }}>/10</span>
          </div>
        </div>

        {/* Pillar scores */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            borderTop: "1px solid #27272a",
            paddingTop: "30px",
          }}
        >
          {[
            { label: "Strategy", value: strategy },
            { label: "Creativity", value: creativity },
            { label: "Narrative", value: narrative },
            { label: "Digital", value: digital },
          ].map((pillar) => (
            <div
              key={pillar.label}
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <span
                style={{
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "#71717a",
                }}
              >
                {pillar.label}
              </span>
              <span style={{ fontSize: "32px", fontWeight: 700 }}>
                {pillar.value}/10
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "30px",
            borderTop: "1px solid #27272a",
            paddingTop: "20px",
          }}
        >
          <span style={{ fontSize: "14px", color: "#52525b" }}>
            Get your free Brand Roast at artostudio.ai/roast
          </span>
          <span style={{ fontSize: "14px", color: "#52525b" }}>
            Powered by 15+ years of real methodology
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

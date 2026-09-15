import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME, SafeArea } from "../primitives";

export interface RankingStackProps {
  title: string;
  ranked: { label: string; sublabel?: string }[];
}

/** Ranked list (e.g. "top 5 tools") sliding in from rank N to rank 1. */
export const RankingStack: React.FC<RankingStackProps> = ({ title, ranked }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SafeArea>
      <h2 style={{ fontSize: 44, marginBottom: 32 }}>{title}</h2>
      {ranked.map((r, i) => {
        const progress = spring({ frame: frame - i * 6, fps, config: { damping: 200 } });
        return (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 14,
              opacity: progress,
              transform: `translateX(${(1 - progress) * -60}px)`,
              background: THEME.panel,
              border: `1px solid ${THEME.border}`,
              borderRadius: 12,
              padding: "14px 20px",
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 900, color: THEME.purple, width: 50 }}>#{i + 1}</div>
            <div>
              <div style={{ fontSize: 28 }}>{r.label}</div>
              {r.sublabel ? <div style={{ fontSize: 18, color: THEME.textDim }}>{r.sublabel}</div> : null}
            </div>
          </div>
        );
      })}
    </SafeArea>
  );
};

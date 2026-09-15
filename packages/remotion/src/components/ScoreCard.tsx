import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { THEME, SafeArea } from "../primitives";

export interface ScoreCardProps {
  title: string;
  rows: { label: string; score: number; maxScore?: number }[];
}

/** A scored breakdown table (e.g. methodology results) with bars filling in on entrance. */
export const ScoreCard: React.FC<ScoreCardProps> = ({ title, rows }) => {
  const frame = useCurrentFrame();
  return (
    <SafeArea>
      <h2 style={{ fontSize: 44, marginBottom: 32 }}>{title}</h2>
      {rows.map((row, i) => {
        const max = row.maxScore ?? 100;
        const fillPct = interpolate(frame, [10 + i * 6, 40 + i * 6], [0, (row.score / max) * 100], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={row.label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, marginBottom: 6 }}>
              <span>{row.label}</span>
              <span style={{ color: THEME.cyan }}>{row.score}/{max}</span>
            </div>
            <div style={{ height: 14, borderRadius: 8, background: THEME.panel, border: `1px solid ${THEME.border}` }}>
              <div style={{ height: "100%", width: `${fillPct}%`, borderRadius: 8, background: `linear-gradient(90deg, ${THEME.cyan}, ${THEME.purple})` }} />
            </div>
          </div>
        );
      })}
    </SafeArea>
  );
};

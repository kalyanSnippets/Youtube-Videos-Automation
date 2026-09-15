import React from "react";
import { THEME, SafeArea, useEnter, fadeSlideStyle } from "../primitives";

export interface ComparisonProps {
  leftLabel: string;
  rightLabel: string;
  rows: { criterion: string; left: string; right: string }[];
}

/** Side-by-side comparison table, e.g. Tool A vs Tool B across the methodology's scoring criteria. */
export const Comparison: React.FC<ComparisonProps> = ({ leftLabel, rightLabel, rows }) => {
  const enter = useEnter(0);
  return (
    <SafeArea>
      <div style={fadeSlideStyle(enter)}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div />
          <div style={{ fontSize: 28, fontWeight: 800, color: THEME.cyan, textAlign: "center" }}>{leftLabel}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: THEME.purple, textAlign: "center" }}>{rightLabel}</div>
        </div>
        {rows.map((row) => (
          <div
            key={row.criterion}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: 12,
              padding: "12px 0",
              borderTop: `1px solid ${THEME.border}`,
              fontSize: 22,
            }}
          >
            <div style={{ color: THEME.textDim }}>{row.criterion}</div>
            <div style={{ textAlign: "center" }}>{row.left}</div>
            <div style={{ textAlign: "center" }}>{row.right}</div>
          </div>
        ))}
      </div>
    </SafeArea>
  );
};

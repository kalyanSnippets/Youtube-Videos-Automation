import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME, SafeArea } from "../primitives";

export interface ChecklistProps {
  title: string;
  items: string[];
}

/** Items check in one at a time - for requirements, criteria, or step summaries. */
export const Checklist: React.FC<ChecklistProps> = ({ title, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SafeArea>
      <h2 style={{ fontSize: 44, marginBottom: 32 }}>{title}</h2>
      {items.map((item, i) => {
        const progress = spring({ frame: frame - i * 8, fps, config: { damping: 200 } });
        return (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, opacity: progress }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: progress > 0.5 ? THEME.cyan : THEME.panel,
                border: `1px solid ${THEME.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: THEME.bg,
                fontWeight: 900,
              }}
            >
              {progress > 0.5 ? "✓" : ""}
            </div>
            <span style={{ fontSize: 30 }}>{item}</span>
          </div>
        );
      })}
    </SafeArea>
  );
};

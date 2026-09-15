import React from "react";
import { AbsoluteFill } from "remotion";
import { THEME, useEnter } from "../primitives";

export interface BrowserFrameProps {
  url: string;
  children?: React.ReactNode;
}

/** Wraps a screen recording/screenshot in a browser chrome frame so raw footage reads as "real product", per asset priority rules. */
export const BrowserFrame: React.FC<BrowserFrameProps> = ({ url, children }) => {
  const enter = useEnter(0);
  return (
    <AbsoluteFill style={{ padding: 60, opacity: enter }}>
      <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${THEME.border}`, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ background: THEME.panel, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#f0605a" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#f0b23b" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: "#3ec95f" }} />
          <div style={{ marginLeft: 16, background: THEME.bg, borderRadius: 8, padding: "4px 14px", fontSize: 16, color: THEME.textDim }}>
            {url}
          </div>
        </div>
        <div style={{ flex: 1, background: "#000" }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

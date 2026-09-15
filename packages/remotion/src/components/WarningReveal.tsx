import React from "react";
import { THEME, SafeArea, useEnter, fadeSlideStyle } from "../primitives";

export interface WarningRevealProps {
  headline: string;
  detail: string;
}

/** Amber warning card - reserved for a caveat, limitation, or contrary evidence that must not be smoothed over. */
export const WarningReveal: React.FC<WarningRevealProps> = ({ headline, detail }) => {
  const enter = useEnter(0, { damping: 14 });
  const amber = "#f0b23b";
  return (
    <SafeArea>
      <div style={{ ...fadeSlideStyle(enter), border: `2px solid ${amber}`, borderRadius: 16, padding: 32, background: "rgba(240,178,59,0.08)" }}>
        <div style={{ fontSize: 22, color: amber, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
          Worth knowing
        </div>
        <h2 style={{ fontSize: 40, margin: 0, color: THEME.text }}>{headline}</h2>
        <p style={{ fontSize: 24, color: THEME.textDim, marginTop: 16 }}>{detail}</p>
      </div>
    </SafeArea>
  );
};

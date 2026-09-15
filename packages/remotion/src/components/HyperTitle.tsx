import React from "react";
import { THEME, SafeArea, useEnter, fadeSlideStyle } from "../primitives";

export interface HyperTitleProps {
  title: string;
  subtitle?: string;
  accent?: "cyan" | "purple";
}

/** Large kinetic title card. Used for section headers and mid-video reveals. */
export const HyperTitle: React.FC<HyperTitleProps> = ({ title, subtitle, accent = "cyan" }) => {
  const enter = useEnter(0);
  const subtitleEnter = useEnter(8);
  return (
    <SafeArea>
      <div style={fadeSlideStyle(enter)}>
        <h1 style={{ fontSize: 88, fontWeight: 800, margin: 0, lineHeight: 1.05, color: THEME.text }}>
          {title}
        </h1>
      </div>
      {subtitle ? (
        <div style={{ ...fadeSlideStyle(subtitleEnter), marginTop: 24 }}>
          <p style={{ fontSize: 36, color: accent === "cyan" ? THEME.cyan : THEME.purple, margin: 0 }}>{subtitle}</p>
        </div>
      ) : null}
    </SafeArea>
  );
};

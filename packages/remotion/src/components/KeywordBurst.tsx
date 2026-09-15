import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME, SafeArea } from "../primitives";

export interface KeywordBurstProps {
  keywords: string[];
}

/** Rapid-fire single keyword per beat - one word visible at a time, cut on the frame boundary. High intensity only. */
export const KeywordBurst: React.FC<KeywordBurstProps> = ({ keywords }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const perWord = durationInFrames / keywords.length;
  const index = Math.min(keywords.length - 1, Math.floor(frame / perWord));
  const localFrame = frame - index * perWord;
  const scale = interpolate(localFrame, [0, 4, perWord - 4, perWord], [0.85, 1, 1, 0.9], { extrapolateRight: "clamp" });
  const opacity = interpolate(localFrame, [0, 3, perWord - 3, perWord], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  return (
    <SafeArea>
      <div style={{ textAlign: "center", transform: `scale(${scale})`, opacity }}>
        <h1 style={{ fontSize: 140, fontWeight: 900, margin: 0, color: THEME.text, textTransform: "uppercase" }}>
          {keywords[index]}
        </h1>
      </div>
    </SafeArea>
  );
};

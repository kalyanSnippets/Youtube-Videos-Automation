import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Colour tokens shared across all motion templates so the render always matches the dark/cyan/purple brand. */
export const THEME = {
  bg: "#0b0e14",
  panel: "#12161f",
  border: "#232937",
  cyan: "#39e6d0",
  purple: "#8b7bf0",
  text: "#e7ecf4",
  textDim: "#8993a6",
};

/** 1920x1080 safe zone padding (title/action safe) so overlays never clip on playback devices. */
export const SAFE_ZONE_PX = 80;

export function SafeArea({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        padding: SAFE_ZONE_PX,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "Inter, Helvetica, Arial, sans-serif",
        color: THEME.text,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/** Deterministic spring-based entrance: given the current frame, returns 0-1 progress. */
export function useEnter(delayFrames = 0, config?: Parameters<typeof spring>[0]["config"]) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delayFrames, fps, config: { damping: 200, ...config } });
}

export function fadeSlideStyle(progress: number, distancePx = 40) {
  return {
    opacity: interpolate(progress, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(progress, [0, 1], [distancePx, 0])}px)`,
  };
}

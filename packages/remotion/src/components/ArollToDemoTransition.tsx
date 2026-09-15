import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../primitives";
import { PlaceholderFace } from "./TalkingHeadFrame";

export interface ArollToDemoTransitionProps {
  fromContent?: React.ReactNode;
  toContent?: React.ReactNode;
  fromLabel?: string;
  toLabel?: string;
}

/** Short bumper bridging an on-camera beat into a screen demo (or back) - a directional wipe rather than a hard cut, so the switch reads as intentional. */
export const ArollToDemoTransition: React.FC<ArollToDemoTransitionProps> = ({ fromContent, toContent, fromLabel = "CREATOR", toLabel = "DEMO" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill>{fromContent ?? <PlaceholderFace label={fromLabel} />}</AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${progress}%)` }}>{toContent ?? <PlaceholderFace label={toLabel} />}</AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${progress}%`,
          width: 6,
          background: THEME.cyan,
          boxShadow: `0 0 24px ${THEME.cyan}`,
        }}
      />
    </AbsoluteFill>
  );
};

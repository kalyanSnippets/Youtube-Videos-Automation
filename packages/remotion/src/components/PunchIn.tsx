import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PlaceholderFace } from "./TalkingHeadFrame";

export interface PunchInProps {
  children?: React.ReactNode;
  fromScale?: number;
  toScale?: number;
  /** Frame the punch-in begins on - lets the Edit Director time it to a specific word/beat. */
  startFrame?: number;
  durationFrames?: number;
}

/** Applies a slow, deliberate zoom on an otherwise-static on-camera shot - the Edit Director's alternative to cutting away when a moment deserves emphasis rather than an interruption. */
export const PunchIn: React.FC<PunchInProps> = ({ children, fromScale = 1, toScale = 1.15, startFrame = 0, durationFrames = 20 }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [startFrame, startFrame + durationFrames], [fromScale, toScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ width: "100%", height: "100%", transform: `scale(${scale})`, transformOrigin: "center" }}>
        {children ?? <PlaceholderFace label="CREATOR ON CAMERA" />}
      </div>
    </AbsoluteFill>
  );
};

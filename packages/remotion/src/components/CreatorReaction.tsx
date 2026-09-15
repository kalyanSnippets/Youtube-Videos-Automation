import React from "react";
import { AbsoluteFill } from "remotion";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../primitives";
import { PlaceholderFace } from "./TalkingHeadFrame";

export interface CreatorReactionProps {
  mainContent?: React.ReactNode;
  reactionContent?: React.ReactNode;
  position?: "bottom-right" | "bottom-left";
}

/** A small circular reaction bubble popping in over a screen recording - lighter-weight than full PiP, for a quick genuine reaction beat. */
export const CreatorReaction: React.FC<CreatorReactionProps> = ({ mainContent, reactionContent, position = "bottom-right" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 10, stiffness: 180 } });
  const side = position === "bottom-right" ? { right: 64 } : { left: 64 };
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill>{mainContent ?? <PlaceholderFace label="SCREEN RECORDING" />}</AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 64,
          ...side,
          width: 220,
          height: 220,
          borderRadius: "50%",
          overflow: "hidden",
          border: `3px solid ${THEME.purple}`,
          boxShadow: "0 10px 28px -6px rgba(0,0,0,0.6)",
          transform: `scale(${pop})`,
        }}
      >
        {reactionContent ?? <PlaceholderFace label="REACTION" />}
      </div>
    </AbsoluteFill>
  );
};

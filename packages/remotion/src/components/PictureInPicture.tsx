import React from "react";
import { AbsoluteFill } from "remotion";
import { THEME, useEnter } from "../primitives";
import { PlaceholderFace } from "./TalkingHeadFrame";

export type PipPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface PictureInPictureProps {
  /** The full-bleed background - typically a screen recording or product result. */
  mainContent?: React.ReactNode;
  /** The creator's camera feed, shown in the inset window. */
  pipContent?: React.ReactNode;
  position?: PipPosition;
  /** Inset width as a percentage of the full frame width. */
  sizePercent?: number;
}

const POSITION_STYLE: Record<PipPosition, React.CSSProperties> = {
  "bottom-right": { right: 48, bottom: 48 },
  "bottom-left": { left: 48, bottom: 48 },
  "top-right": { right: 48, top: 48 },
  "top-left": { left: 48, top: 48 },
};

/** Creator face over a screen recording - the standard HYBRID treatment for narrating over a demo without losing the face entirely. */
export const PictureInPicture: React.FC<PictureInPictureProps> = ({ mainContent, pipContent, position = "bottom-right", sizePercent = 22 }) => {
  const enter = useEnter(0);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill>{mainContent ?? <PlaceholderFace label="SCREEN RECORDING" />}</AbsoluteFill>
      <div
        style={{
          position: "absolute",
          width: `${sizePercent}%`,
          aspectRatio: "16 / 9",
          borderRadius: 14,
          overflow: "hidden",
          border: `2px solid ${THEME.cyan}`,
          boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)",
          opacity: enter,
          transform: `scale(${0.92 + enter * 0.08})`,
          ...POSITION_STYLE[position],
        }}
      >
        {pipContent ?? <PlaceholderFace label="CREATOR" />}
      </div>
    </AbsoluteFill>
  );
};

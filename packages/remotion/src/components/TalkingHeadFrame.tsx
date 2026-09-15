import React from "react";
import { AbsoluteFill } from "remotion";
import { THEME, useEnter } from "../primitives";

export interface TalkingHeadFrameProps {
  /** The actual on-camera footage, rendered by the caller (e.g. an OffthreadVideo) - never fabricated here. */
  children?: React.ReactNode;
  captionText?: string;
  /** Reserves space so captions never sit over the creator's mouth/chin. */
  captionSafeBottomPx?: number;
}

/** Full-bleed on-camera shot with a caption-safe bottom band. The default treatment for FACE_LED/HYBRID A-roll. */
export const TalkingHeadFrame: React.FC<TalkingHeadFrameProps> = ({ children, captionText, captionSafeBottomPx = 220 }) => {
  const enter = useEnter(0);
  return (
    <AbsoluteFill style={{ opacity: enter, background: "#000" }}>
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children ?? <PlaceholderFace label="CREATOR ON CAMERA" />}
      </AbsoluteFill>
      {captionText ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: captionSafeBottomPx,
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "rgba(11,14,20,0.75)",
              color: THEME.text,
              fontSize: 34,
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: 10,
            }}
          >
            {captionText}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export function PlaceholderFace({ label }: { label: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(160deg, ${THEME.panel}, ${THEME.bg})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: THEME.textDim,
        fontSize: 24,
        letterSpacing: 2,
        fontWeight: 700,
      }}
    >
      {label}
    </div>
  );
}

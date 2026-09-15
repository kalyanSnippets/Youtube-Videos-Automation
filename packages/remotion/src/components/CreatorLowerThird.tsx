import React from "react";
import { AbsoluteFill } from "remotion";
import { THEME, useEnter, fadeSlideStyle } from "../primitives";
import { PlaceholderFace } from "./TalkingHeadFrame";

export interface CreatorLowerThirdProps {
  mainContent?: React.ReactNode;
  name: string;
  context?: string;
}

/** A name/context strip over a screen recording, reminding the viewer who's narrating without a full PiP window. Low intensity. */
export const CreatorLowerThird: React.FC<CreatorLowerThirdProps> = ({ mainContent, name, context }) => {
  const enter = useEnter(6);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill>{mainContent ?? <PlaceholderFace label="SCREEN RECORDING" />}</AbsoluteFill>
      <div style={{ position: "absolute", left: 60, bottom: 60, ...fadeSlideStyle(enter, 20) }}>
        <div
          style={{
            background: THEME.panel,
            border: `1px solid ${THEME.border}`,
            borderLeft: `4px solid ${THEME.cyan}`,
            borderRadius: 8,
            padding: "10px 18px",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: THEME.text }}>{name}</div>
          {context ? <div style={{ fontSize: 15, color: THEME.textDim }}>{context}</div> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

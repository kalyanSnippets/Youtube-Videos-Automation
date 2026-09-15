import React from "react";
import { AbsoluteFill } from "remotion";
import { THEME, useEnter } from "../primitives";
import { PlaceholderFace } from "./TalkingHeadFrame";

export interface ScreenAndFaceSplitProps {
  faceContent?: React.ReactNode;
  screenContent?: React.ReactNode;
  faceLabel?: string;
  screenLabel?: string;
  /** Which side the face sits on - the screen recording always gets the other half. */
  facePosition?: "left" | "right";
}

/** 50/50 split between the creator and a screen recording - for tutorials/explanations where both need to stay visible at once. */
export const ScreenAndFaceSplit: React.FC<ScreenAndFaceSplitProps> = ({ faceContent, screenContent, faceLabel, screenLabel, facePosition = "left" }) => {
  const enter = useEnter(0);
  const face = (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {faceContent ?? <PlaceholderFace label="CREATOR" />}
      {faceLabel ? <SplitLabel text={faceLabel} /> : null}
    </div>
  );
  const screen = (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#000" }}>
      {screenContent ?? <PlaceholderFace label="SCREEN RECORDING" />}
      {screenLabel ? <SplitLabel text={screenLabel} /> : null}
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: enter, flexDirection: "row", display: "flex" }}>
      {facePosition === "left" ? (
        <>
          {face}
          <div style={{ width: 4, background: THEME.cyan }} />
          {screen}
        </>
      ) : (
        <>
          {screen}
          <div style={{ width: 4, background: THEME.cyan }} />
          {face}
        </>
      )}
    </AbsoluteFill>
  );
};

function SplitLabel({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        background: "rgba(11,14,20,0.75)",
        color: THEME.text,
        fontSize: 16,
        fontWeight: 700,
        padding: "6px 12px",
        borderRadius: 6,
      }}
    >
      {text}
    </div>
  );
}

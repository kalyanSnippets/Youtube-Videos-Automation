import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { THEME, SafeArea } from "../primitives";

export interface StatCounterProps {
  label: string;
  fromValue: number;
  toValue: number;
  suffix?: string;
}

/** Counts a number up from `fromValue` to `toValue` over the composition duration - for evidence-backed statistics only. */
export const StatCounter: React.FC<StatCounterProps> = ({ label, fromValue, toValue, suffix = "" }) => {
  const frame = useCurrentFrame();
  const value = Math.round(interpolate(frame, [0, 45], [fromValue, toValue], { extrapolateRight: "clamp" }));
  return (
    <SafeArea>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 160, fontWeight: 900, color: THEME.cyan, lineHeight: 1 }}>
          {value.toLocaleString()}
          {suffix}
        </div>
        <div style={{ fontSize: 32, color: THEME.textDim, marginTop: 16 }}>{label}</div>
      </div>
    </SafeArea>
  );
};

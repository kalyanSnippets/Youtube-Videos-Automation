import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { THEME, SafeArea, useEnter, fadeSlideStyle } from "../primitives";

export interface HyperHookProps {
  line1: string;
  line2: string;
}

/** High-intensity opening hook: two punchy lines with a fast scale-in, reserved for the first seconds of a video. */
export const HyperHook: React.FC<HyperHookProps> = ({ line1, line2 }) => {
  const frame = useCurrentFrame();
  const enter1 = useEnter(0, { damping: 12, stiffness: 200 });
  const enter2 = useEnter(10, { damping: 12, stiffness: 200 });
  const scale = interpolate(frame, [0, 15], [1.08, 1], { extrapolateRight: "clamp" });
  return (
    <SafeArea>
      <div style={{ transform: `scale(${scale})` }}>
        <div style={fadeSlideStyle(enter1, 60)}>
          <h1 style={{ fontSize: 104, fontWeight: 900, margin: 0, color: THEME.text }}>{line1}</h1>
        </div>
        <div style={fadeSlideStyle(enter2, 60)}>
          <h1 style={{ fontSize: 104, fontWeight: 900, margin: 0, color: THEME.cyan }}>{line2}</h1>
        </div>
      </div>
    </SafeArea>
  );
};

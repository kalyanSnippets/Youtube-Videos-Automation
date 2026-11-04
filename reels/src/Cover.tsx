import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { INTER, SERIF } from "./lib";

/* Reel cover: topic visual on top, Kalyan below, big title inside the 4:5 grid-safe band (y 285-1635). */
export type CoverProps = { top: string; topPos?: string; topZoom?: number; face: string; faceY?: number; tag: string; line1: string; line2: string; accent: string };
export const Cover: React.FC<CoverProps> = ({ top, topPos = "50% 50%", topZoom = 1, face, faceY = 0, tag, line1, line2, accent }) => (
  <AbsoluteFill style={{ background: "#0b0e14" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 900, overflow: "hidden" }}>
      <Img src={staticFile(top)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: topPos, transform: `scale(${topZoom})` }} />
    </div>
    <div style={{ position: "absolute", left: 0, top: 860, width: 1080, height: 1060, overflow: "hidden" }}>
      <Img src={staticFile(face)} style={{ width: 1080, position: "absolute", top: -faceY }} />
    </div>
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.55) 58%, rgba(0,0,0,0) 72%)" }} />
    <div style={{ position: "absolute", top: 640, left: 50, right: 50, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ background: accent, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 44, padding: "10px 26px", borderRadius: 999, letterSpacing: 1 }}>{tag}</div>
      <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 112, color: "#fff", textAlign: "center", lineHeight: 1.0, letterSpacing: -2, textShadow: "0 8px 30px rgba(0,0,0,0.8)" }}>{line1}</div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 100, color: accent, textAlign: "center", lineHeight: 1.0, textShadow: "0 8px 30px rgba(0,0,0,0.8)", background: "rgba(0,0,0,0.35)", padding: "0 20px", borderRadius: 16 }}>{line2}</div>
    </div>
  </AbsoluteFill>
);

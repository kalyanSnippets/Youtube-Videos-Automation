import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { INTER } from "./lib";

/* Thumbnail-style reel cover. Title + topic card sit inside the 4:5 grid-safe band (y 285-1635). */
export type Cover2Props = {
  bg: string; bgPos?: string; card: string; cardPos?: string; cardZoom?: number;
  face: string; faceW?: number; faceX?: number; faceY?: number;
  tag: string; line1: string; hl: string; accent: string; hlBg?: string; hlColor?: string; emoji?: string;
};
export const Cover2: React.FC<Cover2Props> = ({ bg, bgPos = "50% 50%", card, cardPos = "50% 50%", cardZoom = 1, face, faceW = 1400, faceX = -330, faceY = 0, tag, line1, hl, accent, hlBg = "#FFD60A", hlColor = "#111", emoji = "" }) => (
  <AbsoluteFill style={{ background: "#0b0e14", overflow: "hidden" }}>
    <AbsoluteFill style={{ filter: "blur(10px) brightness(0.42) saturate(1.2)", transform: "scale(1.1)" }}>
      <Img src={staticFile(bg)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: bgPos }} />
    </AbsoluteFill>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 25% 78%, ${accent}cc 0%, ${accent}55 28%, transparent 55%)` }} />
    {/* title */}
    <div style={{ position: "absolute", top: 300, left: 50, right: 50, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ background: accent, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 42, padding: "10px 28px", borderRadius: 999, letterSpacing: 1.5, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>{tag}</div>
      <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 116, color: "#fff", textAlign: "center", lineHeight: 1.0, letterSpacing: -3, textShadow: "0 8px 30px rgba(0,0,0,0.75)" }}>{line1}</div>
      <div style={{ background: hlBg, color: hlColor, fontFamily: INTER, fontWeight: 900, fontSize: 112, lineHeight: 1.05, letterSpacing: -3, padding: "4px 30px 10px", borderRadius: 18, transform: "rotate(-2deg)", boxShadow: "0 14px 40px rgba(0,0,0,0.5)" }}>{hl}</div>
    </div>
    {/* topic card */}
    <div style={{ position: "absolute", top: 800, right: 30, width: 520, height: 293, borderRadius: 26, overflow: "hidden", border: "8px solid #fff", transform: "rotate(4deg)", boxShadow: "0 30px 70px rgba(0,0,0,0.6)" }}>
      <Img src={staticFile(card)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: cardPos, transform: `scale(${cardZoom})` }} />
    </div>
    {emoji && <div style={{ position: "absolute", top: 1110, right: 90, fontSize: 140, transform: "rotate(10deg)", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }}>{emoji}</div>}
    {/* Kalyan, cut out with a white outline */}
    <Img src={staticFile(face)} style={{ position: "absolute", left: faceX, top: 214 + faceY, width: faceW, filter: "drop-shadow(0 0 3px #fff) drop-shadow(0 0 3px #fff) drop-shadow(0 0 3px #fff) drop-shadow(0 25px 50px rgba(0,0,0,0.6))" }} />
  </AbsoluteFill>
);

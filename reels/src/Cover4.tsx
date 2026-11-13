import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { INTER } from "./lib";

/* Instagram-grid-proof viral reel cover (1080x1920).
   Everything important sits inside the centre 3:4 area (y 240-1680), which is what the profile grid shows.
   Big two-line hook, the real visual as a tilted "proof" card, presenter cut-out large at the bottom. */
export type ThumbProps = {
  bg: string; bgPos?: string; card?: string; cardPos?: string;
  line1: string; line2: string; accent?: string; emoji: string;
  portrait: string; flip?: boolean; pW?: number; pX?: number; tag?: string;
};

export const ViralThumb: React.FC<ThumbProps> = ({ bg, bgPos = "50% 50%", card, cardPos = "50% 50%", line1, line2, accent = "#FFE11A", emoji, portrait, flip, pW = 980, pX = 50, tag }) => {
  const longest = Math.max(line1.length, line2.length);
  const fs = Math.min(150, Math.floor(1480 / longest));
  return (
    <AbsoluteFill style={{ background: "#0B0B10", overflow: "hidden" }}>
      <Img src={staticFile(bg)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: bgPos, filter: "blur(10px) brightness(0.45) saturate(1.3)", transform: "scale(1.1)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)" }} />
      {/* hook */}
      <div style={{ position: "absolute", top: 290, left: 30, right: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontStyle: "italic", fontSize: fs, lineHeight: 1, color: "#fff", letterSpacing: -4, textTransform: "uppercase", textAlign: "center", textShadow: "0 8px 0 rgba(0,0,0,0.55), 0 0 40px rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}>{line1}</div>
        <div style={{ background: accent, padding: "6px 26px 10px", transform: "rotate(-2deg)", boxShadow: "0 12px 0 rgba(0,0,0,0.45)" }}>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontStyle: "italic", fontSize: fs, lineHeight: 1, color: "#0B0B10", letterSpacing: -4, textTransform: "uppercase", whiteSpace: "nowrap" }}>{line2}</div>
        </div>
      </div>
      {/* proof card */}
      <div style={{ position: "absolute", left: 300, top: 690, width: 720, transform: "rotate(4deg)" }}>
        <div style={{ background: "#fff", padding: 12, borderRadius: 26, boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
          <div style={{ height: 420, borderRadius: 16, overflow: "hidden" }}>
            <Img src={staticFile(card ?? bg)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: cardPos }} />
          </div>
        </div>
        <svg width={260} height={200} viewBox="0 0 260 200" style={{ position: "absolute", left: -200, top: 300 }}>
          <path d="M 20 170 C 70 90, 150 60, 225 70" stroke="#FF2D2D" strokeWidth={20} fill="none" strokeLinecap="round" />
          <path d="M 180 30 L 232 70 L 178 112" stroke="#FF2D2D" strokeWidth={20} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {/* presenter */}
      <Img src={staticFile(portrait)} style={{ position: "absolute", left: pX, bottom: 0, width: pW, transform: flip ? "scaleX(-1)" : undefined, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 30px 60px rgba(0,0,0,0.7))" }} />
      {/* emoji sticker */}
      <div style={{ position: "absolute", right: 50, top: 1090, fontSize: 170, transform: "rotate(12deg)", filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.5))" }}>{emoji}</div>
      {tag && (
        <div style={{ position: "absolute", left: 40, top: 1590, background: "rgba(0,0,0,0.75)", border: "3px solid rgba(255,255,255,0.8)", color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 40, padding: "8px 22px", borderRadius: 999 }}>{tag}</div>
      )}
    </AbsoluteFill>
  );
};

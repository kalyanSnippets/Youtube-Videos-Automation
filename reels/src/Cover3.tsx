import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { INTER, MONO, SERIF } from "./lib";

/* Viral-style reel cover (light lavender, big italic title, yellow brush highlight,
   before/after screens with labels, presenter cut-out in front). */
type Screen = { img?: string; pos?: string; zoom?: number; node?: "prompt" | "poem" | "report" | "bugs"; prompt?: string; promptLabel?: string; label: string; labelBg: string; labelColor?: string };
export type Cover3Props = {
  portrait: string; pW?: number; pX?: number; pY?: number;
  pill: string; pillIcon: string; line1: string; line2: string;
  a: Screen; b: Screen; arrow?: boolean; cardsTop?: number; layout?: "stack" | "row";
};

const Laptop: React.FC<{ s: Screen; w: number; top: number; left: number; rot?: number }> = ({ s, w, top, left, rot = 0 }) => {
  const h = Math.round(w * 0.58);
  return (
    <div style={{ position: "absolute", top, left, width: w, transform: `rotate(${rot}deg)` }}>
      <div style={{ background: "#1f2230", borderRadius: 22, padding: 12, boxShadow: "0 30px 60px rgba(76,29,149,0.35)" }}>
        <div style={{ width: w - 24, height: h, borderRadius: 12, overflow: "hidden", background: "#fff", position: "relative" }}>
          {s.img ? <Img src={staticFile(s.img)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: s.pos ?? "50% 50%", transform: `scale(${s.zoom ?? 1})` }} /> : s.node === "prompt" ? <PromptScreen text={s.prompt ?? ""} label={s.promptLabel} /> : s.node === "poem" ? <PoemScreen /> : s.node === "bugs" ? <BugsScreen /> : <ReportScreen />}
        </div>
      </div>
      <div style={{ margin: "0 auto", width: w + 40, marginLeft: -20, height: 18, background: "linear-gradient(#d4d4dc,#a1a1aa)", borderRadius: "0 0 18px 18px" }} />
      <div style={{ position: "absolute", top: -42, left: "50%", transform: "translateX(-50%)", background: s.labelBg, color: s.labelColor ?? "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 44, padding: "8px 28px", borderRadius: 18, whiteSpace: "nowrap", boxShadow: "0 10px 24px rgba(0,0,0,0.25)", border: "4px solid #fff" }}>{s.label}</div>
    </div>
  );
};

export const Cover3: React.FC<Cover3Props> = ({ portrait, pW = 860, pX = -70, pY = 0, pill, pillIcon, line1, line2, a, b, arrow = true, cardsTop = 870, layout = "stack" }) => {
  const fs = Math.min(168, Math.floor(1010 / (0.64 * Math.max(line1.length, line2.length))));
  return (
  <AbsoluteFill style={{ background: "linear-gradient(170deg, #FBF8FF 0%, #F1E8FF 45%, #E2D2FF 100%)", overflow: "hidden" }}>
    {/* soft blobs */}
    <div style={{ position: "absolute", right: -120, top: -120, width: 320, height: 320, borderRadius: 160, background: "#A78BFA", opacity: 0.55 }} />
    <div style={{ position: "absolute", left: -110, top: 760, width: 240, height: 240, borderRadius: 120, background: "#A78BFA", opacity: 0.45 }} />
    <div style={{ position: "absolute", right: -200, bottom: -200, width: 560, height: 560, borderRadius: 280, background: "#8B5CF6", opacity: 0.35 }} />
    {/* channel badge */}
    <div style={{ position: "absolute", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
      <div style={{ width: 96, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#7C3AED,#5B21B6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 0, height: 0, borderTop: "16px solid transparent", borderBottom: "16px solid transparent", borderLeft: "26px solid #fff", marginLeft: 6 }} />
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 70, color: "#111", letterSpacing: -2, position: "relative" }}>
        AI with Kalyan
        <div style={{ position: "absolute", left: 90, right: 60, bottom: -14, height: 8, borderRadius: 4, background: "#8B5CF6" }} />
      </div>
    </div>
    {/* tool pill */}
    <div style={{ position: "absolute", top: 205, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, background: "linear-gradient(90deg,#4C1D95,#6D28D9)", border: "5px solid #A78BFA", borderRadius: 999, padding: "18px 46px", boxShadow: "0 16px 40px rgba(76,29,149,0.4)" }}>
        <div style={{ fontSize: 64 }}>{pillIcon}</div>
        <div style={{ width: 4, height: 64, background: "#A78BFA", borderRadius: 2 }} />
        <div style={{ fontFamily: INTER, fontStyle: "italic", fontWeight: 900, fontSize: 64, color: "#fff", letterSpacing: -1 }}>{pill}</div>
      </div>
    </div>
    {/* title */}
    <div style={{ position: "absolute", top: 360, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: INTER, fontStyle: "italic", fontWeight: 900, fontSize: fs, color: "#0b0b0f", letterSpacing: -7, lineHeight: 0.95, whiteSpace: "nowrap", transform: "skewX(-6deg)", textAlign: "center" }}>{line1}</div>
      <div style={{ position: "relative", marginTop: 6 }}>
        <div style={{ position: "absolute", left: -50, right: -50, top: 22, bottom: 6, background: "#FFE11A", transform: "rotate(-2.5deg) skewX(-8deg)", borderRadius: "40px 12px 40px 12px", boxShadow: "0 10px 0 rgba(0,0,0,0.04)" }} />
        <div style={{ position: "relative", fontFamily: INTER, fontStyle: "italic", fontWeight: 900, fontSize: fs, color: "#0b0b0f", letterSpacing: -7, lineHeight: 1.0, whiteSpace: "nowrap", transform: "skewX(-6deg)" }}>{line2}</div>
      </div>
    </div>
    {/* screens */}
    {layout === "row" ? (
      <>
        <Laptop s={a} w={450} top={cardsTop} left={40} rot={-2} />
        <Laptop s={b} w={450} top={cardsTop} left={590} rot={2} />
        <svg width={120} height={90} style={{ position: "absolute", left: 480, top: cardsTop + 90 }} viewBox="0 0 120 90"><path d="M 10 45 L 95 45 M 65 15 L 100 45 L 65 75" stroke="#7C3AED" strokeWidth={18} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </>
    ) : (
      <>
        <Laptop s={a} w={500} top={cardsTop} left={545} rot={2} />
        <Laptop s={b} w={500} top={cardsTop + 420} left={520} rot={-2} />
      </>
    )}
    {arrow && layout === "stack" && (
      <svg width={180} height={200} style={{ position: "absolute", left: 870, top: cardsTop + 270 }} viewBox="0 0 180 200">
        <path d="M 40 10 C 150 30, 160 110, 110 170" stroke="#7C3AED" strokeWidth={22} fill="none" strokeLinecap="round" />
        <path d="M 70 150 L 112 182 L 140 132" stroke="#7C3AED" strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
    {/* presenter */}
    <Img src={staticFile(portrait)} style={{ position: "absolute", left: pX, bottom: -6 + pY, width: pW, filter: "drop-shadow(0 0 4px #fff) drop-shadow(0 0 4px #fff) drop-shadow(0 30px 50px rgba(76,29,149,0.35))" }} />
  </AbsoluteFill>
  );
};

/* small HTML screens used inside the laptops */
export const PromptScreen: React.FC<{ text: string; label?: string }> = ({ text, label = "Genie 4 · prompt" }) => (
  <div style={{ width: "100%", height: "100%", background: "#111827", display: "flex", flexDirection: "column", justifyContent: "center", padding: 26, gap: 14 }}>
    <div style={{ fontFamily: MONO, fontSize: 22, color: "#9CA3AF" }}>{label}</div>
    <div style={{ background: "#1f2937", border: "3px solid #3B82F6", borderRadius: 18, padding: "16px 18px", fontFamily: INTER, fontWeight: 800, fontSize: 30, color: "#fff", lineHeight: 1.2 }}>✨ {text}<span style={{ color: "#3B82F6" }}>▍</span></div>
  </div>
);
export const PoemScreen: React.FC = () => (
  <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#0b1430,#1e3a8a)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px", gap: 6 }}>
    <div style={{ fontFamily: MONO, fontSize: 20, color: "#F2B84B", fontWeight: 800 }}>▼ RECEIVED FROM ORBIT</div>
    {["Blue marble below", "Data streams in silent grace", "Starlight feeds my core."].map((l) => (
      <div key={l} style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 32, color: "#fff", lineHeight: 1.15 }}>{l}</div>
    ))}
  </div>
);
export const ReportScreen: React.FC = () => (
  <div style={{ width: "100%", height: "100%", background: "#fff", display: "flex", flexDirection: "column" }}>
    <div style={{ background: "#7C3AED", color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 22, padding: "8px 16px" }}>AI review report</div>
    {[["00:04", "lighting jump"], ["00:11", "continuity"], ["00:19", "frame hitch"], ["00:27", "colour mismatch"]].map(([t, n]) => (
      <div key={t} style={{ display: "flex", gap: 14, padding: "9px 16px", borderTop: "1px solid #eee", fontFamily: MONO, fontSize: 24 }}>
        <span style={{ color: "#EF4444", fontWeight: 800 }}>⚠ {t}</span><span style={{ color: "#111" }}>{n}</span>
      </div>
    ))}
  </div>
);
export const BugsScreen: React.FC = () => (
  <div style={{ width: "100%", height: "100%", background: "#fff", display: "flex", flexDirection: "column" }}>
    <div style={{ background: "#111827", color: "#22C55E", fontFamily: MONO, fontWeight: 800, fontSize: 22, padding: "8px 16px" }}>Mo · bug report</div>
    {[["🐞", "Checkout button not responding"], ["🐞", "Payment error 500"], ["🎥", "Recording + repro steps"]].map(([i, n]) => (
      <div key={n} style={{ display: "flex", gap: 12, padding: "12px 16px", borderTop: "1px solid #eee", fontFamily: INTER, fontWeight: 800, fontSize: 25, color: "#111" }}>
        <span>{i}</span><span>{n}</span>
      </div>
    ))}
  </div>
);

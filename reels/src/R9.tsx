import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo, Img, Easing } from "remotion";
import data from "../public/r/r9f_words.json";
import face from "../public/r/r9f_face.json";
import tmap from "../public/r/r9_timemap.json";
import { f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, Flash, chunkWords, activeChunk } from "./lib";

/* Reel 9: "Claude Code without the $20 subscription". SIM-card concept:
   Claude Code = the phone, the AI model = the SIM card. Graphics live in split screens (graphic on top,
   face-tracked Kalyan below). Full-face moments carry the effects-skill pass (uninstall glitch, follow tap, comment box). */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R9_FRAMES = Math.ceil(END * FPS);
const C = { bg: "#0E1116", panel: "#151A22", line: "#232B36", gold: "#E8C77A", goldD: "#B8913D", orange: "#FF7A45", green: "#34D399", red: "#FF453A", blue: "#60A5FA", ink: "#0A0A0A", mute: "#8B95A5", yellow: "#FFE600" };
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SEAM = 960;
/* graphics were timed on the previous cut; T() maps those times onto the new natural-speed cut */
const TM = tmap as { old: number[]; new: number[] };
const T = (x: number) => {
  const o = TM.old, n = TM.new;
  if (x <= o[0]) return n[0] + (x - o[0]);
  for (let i = 1; i < o.length; i++) if (x <= o[i]) return n[i - 1] + ((x - o[i - 1]) / (o[i] - o[i - 1])) * (n[i] - n[i - 1]);
  return n[n.length - 1] + (x - o[o.length - 1]);
};
const L = (abs: number, a: number) => f(T(abs) - T(a));

/* ---------- face-tracked bottom half ---------- */
const FT = face as { t: number[]; cy: number[]; h: number[] };
const faceAt = (t: number) => {
  const i = Math.max(0, FT.t.findIndex((x) => x > t) - 1);
  const j = Math.min(FT.t.length - 1, i + 1);
  const k = FT.t[j] === FT.t[i] ? 0 : Math.min(1, Math.max(0, (t - FT.t[i]) / (FT.t[j] - FT.t[i])));
  return FT.cy[i] + (FT.cy[j] - FT.cy[i]) * k;
};
const FaceBox: React.FC<{ offset: number; y: number; h: number }> = ({ offset, y, h }) => {
  const frame = useCurrentFrame();
  const s = 0.86;
  let top = h * 0.55 - faceAt((frame + offset) / FPS) * s;
  top = Math.min(0, Math.max(h - 1920 * s, top));
  const v = (st: React.CSSProperties) => <OffthreadVideo src={staticFile("r/r9f_aroll.mp4")} muted startFrom={offset} style={st} />;
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, height: h, overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, filter: "blur(30px) brightness(0.55)", transform: "scale(1.15)" }}>{v({ width: "100%", height: "100%", objectFit: "cover" })}</div>
      {v({ position: "absolute", left: (1080 - 1080 * s) / 2, top, width: 1080 * s, height: 1920 * s })}
    </div>
  );
};
const Split: React.FC<{ offset: number; children: React.ReactNode }> = ({ offset, children }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, overflow: "hidden", background: `radial-gradient(ellipse at 50% 40%, #1B2330, ${C.bg} 70%)` }}>
      <Stage3D />
      {children}
    </div>
    <FaceBox offset={offset} y={SEAM} h={1920 - SEAM} />
    <div style={{ position: "absolute", left: 0, right: 0, top: SEAM - 4, height: 8, background: `linear-gradient(90deg, ${C.gold}, ${C.orange})` }} />
  </AbsoluteFill>
);
const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 100, color = "#fff", style }) => (
  <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: size, color, letterSpacing: -3, lineHeight: 0.95, ...style }}>{children}</div>
);

/* moving 3D floor grid, drifting particles and a light sweep */
const Stage3D: React.FC = () => {
  const frame = useCurrentFrame();
  const sweep = ((frame % 150) / 150) * 2600 - 800;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: -600, right: -600, top: 520, height: 900, transform: "perspective(500px) rotateX(72deg)", transformOrigin: "50% 0%", backgroundImage: `linear-gradient(${C.gold}33 2px, transparent 2px), linear-gradient(90deg, ${C.gold}33 2px, transparent 2px)`, backgroundSize: "90px 90px", backgroundPosition: `0px ${(frame * 3) % 90}px`, maskImage: "linear-gradient(transparent, #000 25%, #000 70%, transparent)" }} />
      {Array.from({ length: 26 }).map((_, i) => {
        const x = (i * 211) % 1080, sp = 0.4 + (i % 5) * 0.25, y = (((i * 137 - frame * sp * 3) % 960) + 960) % 960;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 4 + (i % 3) * 3, height: 4 + (i % 3) * 3, borderRadius: 9, background: i % 4 ? C.gold : C.orange, opacity: 0.25 + (i % 4) * 0.12, boxShadow: `0 0 12px ${C.gold}` }} />;
      })}
      <div style={{ position: "absolute", top: -300, left: sweep, width: 180, height: 1600, transform: "rotate(25deg)", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }} />
    </AbsoluteFill>
  );
};

/* 3D entrance: flips in from depth, then floats */
const Pop3D: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties; spin?: number; float?: number }> = ({ delay = 0, children, style, spin = 90, float = 6 }) => {
  const frame = useCurrentFrame();
  if (frame < delay) return null;
  const p = interpolate(frame - delay, [0, 16], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const ry = (1 - p) * spin + Math.sin((frame - delay) / 26) * float;
  const rx = Math.cos((frame - delay) / 34) * (float * 0.6);
  return (
    <div style={{ ...style, transform: `perspective(1300px) translateZ(${(1 - p) * -700}px) rotateY(${ry}deg) rotateX(${rx}deg)`, opacity: Math.min(1, p * 2), transformStyle: "preserve-3d" }}>{children}</div>
  );
};

/* ---------- the SIM card + the phone ---------- */
const Sim: React.FC<{ label: string; sub?: string; w?: number; color?: string; icon?: string }> = ({ label, sub, w = 300, color = C.gold, icon }) => {
  const frame = useCurrentFrame();
  const h = w * 0.66;
  const sheen = ((frame % 70) / 70) * (w * 2.2) - w * 0.6;
  return (
    <div style={{ position: "relative", width: w, height: h, background: `linear-gradient(135deg, #fff 0%, #F3F4F6 100%)`, clipPath: `polygon(${w * 0.18}px 0, 100% 0, 100% 100%, 0 100%, 0 ${h * 0.27}px)`, borderRadius: 10, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
      <div style={{ position: "absolute", left: w * 0.1, top: h * 0.3, width: w * 0.3, height: h * 0.42, borderRadius: 8, background: `linear-gradient(135deg, ${color}, ${C.goldD})`, boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.15)" }}>
        <div style={{ position: "absolute", left: "33%", top: 0, bottom: 0, width: 2, background: "rgba(0,0,0,0.25)" }} />
        <div style={{ position: "absolute", left: "66%", top: 0, bottom: 0, width: 2, background: "rgba(0,0,0,0.25)" }} />
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "rgba(0,0,0,0.25)" }} />
      </div>
      <div style={{ position: "absolute", left: w * 0.46, right: w * 0.05, top: h * 0.18, bottom: h * 0.1, display: "flex", flexDirection: "column", justifyContent: "center", gap: h * 0.04 }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: Math.min(w * 0.1, (w * 0.49) / Math.max(4, label.length + (icon ? 2 : 0)) * 1.7), color: C.ink, lineHeight: 1.0 }}>{icon ? `${icon} ` : ""}{label}</div>
        {sub && <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: w * 0.055, color: "#4B5563", lineHeight: 1.12 }}>{sub}</div>}
      </div>
      <div style={{ position: "absolute", top: -h * 0.3, left: sheen, width: w * 0.22, height: h * 1.6, transform: "rotate(20deg)", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)", pointerEvents: "none" }} />
    </div>
  );
};
const Phone: React.FC<{ w?: number; tray?: number; children?: React.ReactNode; tilt?: number }> = ({ w = 300, tray = 0, children, tilt = 0 }) => {
  const frame = useCurrentFrame();
  const h = w * 2.05;
  return (
    <div style={{ position: "relative", width: w, height: h, transformStyle: "preserve-3d", transform: `perspective(1400px) rotateX(${7 + Math.sin(frame / 45) * 3}deg) rotateY(${tilt + Math.sin(frame / 34) * 16}deg)` }}>
      <div style={{ position: "absolute", inset: 0, background: "#0B0D10", borderRadius: w * 0.16, transform: `translateZ(${-w * 0.09}px)`, boxShadow: "0 50px 90px rgba(0,0,0,0.7)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#3A414B,#1F2329 12%,#1F2329 88%,#3A414B)", borderRadius: w * 0.16, transform: `translateZ(${-w * 0.045}px)` }} />
      <div style={{ position: "absolute", inset: 0, background: "#1F2329", borderRadius: w * 0.16, boxShadow: "inset 0 0 0 3px #4A525D" }} />
      <div style={{ position: "absolute", left: w * 0.05, right: w * 0.05, top: w * 0.05, bottom: w * 0.05, background: "#0B0D10", borderRadius: w * 0.12, overflow: "hidden", padding: w * 0.08 }}>
        <div style={{ height: w * 0.06, width: w * 0.3, margin: "0 auto", borderRadius: 99, background: "#000" }} />
        <div style={{ marginTop: w * 0.08, fontFamily: MONO, fontWeight: 800, fontSize: w * 0.075, color: C.orange }}>✻ Claude Code</div>
        <div style={{ marginTop: w * 0.05, fontFamily: MONO, fontSize: w * 0.055, color: C.mute, lineHeight: 1.6 }}>
          &gt; fix the login bug<br />&gt; write tests<br /><span style={{ color: C.green }}>✓ done</span>
        </div>
        {children}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${115 + Math.sin(frame / 40) * 20}deg, rgba(255,255,255,0.16), transparent 40%)`, pointerEvents: "none" }} />
      </div>
      {/* SIM tray on the right edge */}
      <div style={{ position: "absolute", right: -tray * w * 0.55, top: h * 0.42, width: w * 0.5, height: w * 0.36, background: "linear-gradient(90deg,#8E959F,#C7CCD3)", borderRadius: 8, boxShadow: "0 8px 16px rgba(0,0,0,0.4)" }} />
    </div>
  );
};

/* ---------- panels ---------- */
const BillPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const stamp = L(4.82, 0);
  const sc = interpolate(frame, [stamp, stamp + 5], [3, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const months = Math.min(12, Math.floor(interpolate(frame, [L(1.1, 0), L(3.0, 0)], [1, 12], clamp)));
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 90, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 640, background: "#FFFEFA", borderRadius: 18, padding: "30px 34px", fontFamily: MONO, color: C.ink, boxShadow: "0 30px 60px rgba(0,0,0,0.55)", transform: `perspective(1200px) rotateX(${interpolate(frame, [0, 18], [70, 12], { ...clamp, easing: ease }) + Math.sin(frame / 30) * 3}deg) rotateY(${Math.sin(frame / 40) * 8}deg) rotate(-2deg) translateY(${interpolate(frame, [0, 18], [-300, 0], { ...clamp, easing: ease })}px)`, transformOrigin: "50% 0%" }}>
          <div style={{ fontWeight: 800, fontSize: 34, textAlign: "center" }}>MONTHLY SUBSCRIPTION</div>
          <div style={{ borderTop: "3px dashed #999", margin: "16px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 40, fontWeight: 800 }}><span>Claude plan</span><span>$20</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#6B7280", marginTop: 10 }}><span>× {months} month{months > 1 ? "s" : ""}</span><span>${20 * months}</span></div>
          <div style={{ borderTop: "3px dashed #999", margin: "16px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 48, fontWeight: 900 }}><span>TOTAL</span><span style={{ color: C.red }}>${20 * months}{months === 12 ? "/yr" : ""}</span></div>
        </div>
      </div>
      {frame >= stamp && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center" }}>
          <div style={{ transform: `rotate(-12deg) scale(${sc})`, border: `12px solid ${C.red}`, color: C.red, background: "rgba(255,255,255,0.85)", fontFamily: INTER, fontWeight: 900, fontSize: 104, padding: "0 34px", borderRadius: 20 }}>NOT NEEDED?</div>
        </div>
      )}
    </>
  );
};

const PhoneSimPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 8.1;
  const phoneIn = frame >= L(8.44, a);
  const tray = interpolate(frame, [L(9.9, a), L(9.9, a) + 10], [0, 1], { ...clamp, easing: ease });
  const simX = interpolate(frame, [L(11.0, a), L(11.0, a) + 12], [380, 0], { ...clamp, easing: ease });
  return (
    <>
      {phoneIn && <Pop3D style={{ position: "absolute", left: 170, top: 110 }} spin={-120}><Phone w={330} tray={tray} /></Pop3D>}
      {phoneIn && <PopIn delay={4} style={{ position: "absolute", left: 120, top: 830 }}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 40, color: "#fff" }}>📱 Claude Code = the phone</div></PopIn>}
      {frame >= L(10.0, a) && (
        <div style={{ position: "absolute", left: 600 + simX, top: 300 }}>
          <Sim label="AI MODEL" sub="the SIM card" w={360} />
        </div>
      )}
    </>
  );
};

const SwapPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 11.6;
  const sims: [string, string, string][] = [["Claude", "Anthropic", C.gold], ["Model B", "another AI", "#9CC3FF"], ["Model C", "another AI", "#A7F3D0"]];
  const swapStart = L(12.84, a), per = 22;
  const idx = frame < swapStart ? 0 : Math.min(sims.length - 1 + 3, Math.floor((frame - swapStart) / per) + 1) % sims.length;
  const local = frame < swapStart ? 99 : (frame - swapStart) % per;
  const y = interpolate(local, [0, 8], [-260, 0], { ...clamp, easing: ease });
  return (
    <>
      <Pop3D style={{ position: "absolute", left: 90, top: 110 }} spin={60} float={0}><Phone w={300} tray={1} /></Pop3D>
      <div style={{ position: "absolute", left: 520, top: 330 + y, transform: `perspective(1200px) rotateY(${interpolate(local, [0, 10], [180, 0], clamp) + Math.sin(frame / 20) * 8}deg)` }}><Sim label={sims[idx][0]} sub={sims[idx][1]} w={420} color={sims[idx][2]} /></div>
      <PopIn delay={L(15.22, a)} style={{ position: "absolute", left: 470, top: 680 }}><div style={{ background: C.yellow, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 46, padding: "10px 24px", borderRadius: 14 }}>🔁 swap the AI model</div></PopIn>
    </>
  );
};

const MethodPanel: React.FC<{ n: string; label: string; sub: string; icon: string; color: string; extra?: React.ReactNode }> = ({ n, label, sub, icon, color, extra }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [2, 14], [600, 0], { ...clamp, easing: ease });
  return (
    <>
      <PopIn style={{ position: "absolute", left: 60, top: 80 }}><div style={{ display: "flex", gap: 0 }}><div style={{ background: color, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 64, padding: "4px 22px" }}>{n}</div><div style={{ background: "#fff", color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 64, padding: "4px 24px" }}>METHOD</div></div></PopIn>
      <Pop3D delay={2} spin={110} float={9} style={{ position: "absolute", left: 160, top: 230 }}><Sim label={label} sub={sub} w={760} color={color} icon={icon} /></Pop3D>
      {[0, 1, 2, 3, 4].map((i) => {
        const a2 = frame / 18 + (i * Math.PI * 2) / 5;
        return <div key={i} style={{ position: "absolute", left: 520 + Math.cos(a2) * 470 - 30, top: 420 + Math.sin(a2) * 300 - 30, fontSize: 54, opacity: 0.5 + 0.5 * Math.sin(a2), transform: `scale(${0.7 + 0.35 * Math.sin(a2)})`, zIndex: Math.sin(a2) > 0 ? 5 : 0 }}>{icon}</div>;
      })}
      {extra}
    </>
  );
};

const InterfacePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 28.9;
  const notNec = frame >= L(32.42, a);
  const swap = frame >= L(33.7, a);
  return (
    <>
      <Pop3D style={{ position: "absolute", left: 90, top: 100 }} spin={60} float={0}><Phone w={300} tray={1} /></Pop3D>
      <PopIn delay={L(30.6, a)} style={{ position: "absolute", left: 470, top: 150 }}>
        <div style={{ background: C.green, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 44, padding: "12px 22px", borderRadius: 16 }}>✓ same Claude Code interface</div>
      </PopIn>
      <div style={{ position: "absolute", left: 500, top: 360, transform: `perspective(1200px) rotateY(${interpolate(frame, [L(33.7, a) - 6, L(33.7, a) + 6], [0, 360], clamp) + Math.sin(frame / 22) * 8}deg)` }}>
        <Sim label={swap ? "Any model" : "Claude"} sub={swap ? "local / free / other" : "Anthropic"} w={420} color={swap ? "#A7F3D0" : C.gold} />
      </div>
      {notNec && <PopIn style={{ position: "absolute", left: 470, top: 680 }}><div style={{ background: C.orange, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 40, padding: "12px 22px", borderRadius: 16 }}>↔ not necessarily Anthropic's model</div></PopIn>}
    </>
  );
};

const SavePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const v = Math.round(interpolate(frame, [6, 40], [20, 0], { ...clamp, easing: ease }));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <Big size={70} color={C.mute}>MONTHLY COST</Big>
      <div style={{ display: "flex", alignItems: "baseline", gap: 30 }}>
        <Big size={150} color={C.red} style={{ textDecoration: "line-through", textDecorationThickness: 10 }}>$20</Big>
        <Big size={110} color="#fff">→</Big>
        <Big size={190} color={C.green}>${v}*</Big>
      </div>
      <PopIn delay={20}><div style={{ fontSize: 90 }}>💰💰💰</div></PopIn>
      {Array.from({ length: 14 }).map((_, i) => {
        const y = ((frame * (6 + (i % 4)) + i * 90) % 1100) - 140;
        return <div key={i} style={{ position: "absolute", left: (i * 79) % 1040, top: y, width: 54, height: 54, borderRadius: 27, background: `radial-gradient(circle at 35% 35%, #FFF3B0, ${C.gold} 45%, ${C.goldD})`, boxShadow: "0 6px 14px rgba(0,0,0,0.4)", transform: `perspective(400px) rotateY(${frame * 12 + i * 40}deg)`, opacity: 0.85, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 900, fontSize: 28, color: C.goldD }}>$</div>;
      })}
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 28, color: C.mute }}>*can be free, depends on your setup & usage</div>
    </div>
  );
};

const TutorialPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 46.3;
  const play = frame >= L(51.6, a);
  return (
    <>
      <Pop3D spin={-70} float={5} style={{ position: "absolute", left: 70, right: 70, top: 80 }}>
        <div style={{ background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
          <div style={{ height: 420, position: "relative", background: `linear-gradient(135deg, #1B2330, #0E1116)`, display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
            <Phone w={150} tray={1} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["1", "Offline"], ["2", "Free cloud"], ["3", "Multi-provider"]].map(([n, t], i) => (
                <PopIn key={n} delay={L(50.5, a) + i * 4}><div style={{ background: [C.blue, C.green, C.orange][i], color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 40, padding: "6px 18px", borderRadius: 10 }}>{n} · {t}</div></PopIn>
              ))}
            </div>
            <div style={{ position: "absolute", right: 16, bottom: 14, background: "rgba(0,0,0,0.8)", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 24, padding: "2px 10px", borderRadius: 6 }}>FULL TUTORIAL</div>
            {play && <div style={{ position: "absolute", left: "24%", top: "50%", width: 130, height: 92, marginLeft: -65, marginTop: -46, borderRadius: 26, background: "#FF0000", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${interpolate(frame - L(51.6, a), [0, 6], [1.6, 1], clamp)})` }}><div style={{ width: 0, height: 0, borderTop: "22px solid transparent", borderBottom: "22px solid transparent", borderLeft: "36px solid #fff", marginLeft: 8 }} /></div>}
          </div>
          <div style={{ display: "flex", gap: 18, padding: "20px 22px", alignItems: "center" }}>
            <Img src={staticFile("img/ch_BEp74aewRSA.jpg")} style={{ width: 70, height: 70, borderRadius: 35, objectFit: "cover" }} />
            <div>
              <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 36, color: C.ink, lineHeight: 1.15 }}>Full tutorial: all 3 methods, step by step</div>
              <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 26, color: "#6B7280", marginTop: 4 }}>AI with Kalyan · YouTube</div>
            </div>
          </div>
        </div>
      </Pop3D>
      {frame >= L(52.46, a) && <PopIn style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center" }}><div style={{ background: C.yellow, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 50, padding: "10px 28px", borderRadius: 14 }}>▶ on my channel · link in bio</div></PopIn>}
    </>
  );
};

/* lower-third banner on full-face shots */
const Banner: React.FC<{ text: string; color?: string }> = ({ text, color = C.gold }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 8], [-1100, 0], { ...clamp, easing: ease });
  return <div style={{ position: "absolute", top: 1330, left: 40, transform: `translateX(${x}px)`, background: color, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 72, padding: "6px 28px", letterSpacing: -2, boxShadow: "0 14px 40px rgba(0,0,0,0.45)" }}>{text}</div>;
};

type Seg = { a: number; b: number; split?: React.FC; banner?: React.ReactNode };
const SEGS: Seg[] = [
  { a: 0, b: 5.6, split: BillPanel },
  { a: 8.1, b: 11.6, split: PhoneSimPanel },
  { a: 11.6, b: 15.9, split: SwapPanel },
  { a: 17.9, b: 19.9, banner: <Banner text="🧪 I TESTED 3 WAYS" /> },
  { a: 19.9, b: 23.0, split: () => <MethodPanel n="1" label="OFFLINE" sub="runs on your own computer · no internet" icon="💻" color={C.blue} /> },
  { a: 23.0, b: 25.4, split: () => <MethodPanel n="2" label="FREE CLOUD" sub="use free AI models online" icon="☁️" color={C.green} /> },
  { a: 25.4, b: 28.9, split: () => <MethodPanel n="3" label="MULTI-PROVIDER" sub="many AI providers · one setup" icon="🔀" color={C.orange} /> },
  { a: 28.9, b: 34.95, split: InterfacePanel },
  { a: 34.95, b: 37.6, split: SavePanel },
  { a: 46.3, b: END, split: TutorialPanel },
];
const SEGS_T = SEGS.map((s) => ({ ...s, a: T(s.a), b: s.b === END ? END : T(s.b) }));
const splitAt = (t: number) => SEGS_T.find((s) => s.split && t >= s.a && t < s.b);

/* captions: seam in split screens, chest in full-face shots */
const chunks = chunkWords(D.words, 3, 16);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const top = splitAt(t) ? SEAM - 52 : 1170;
  return (
    <div style={{ position: "absolute", top, left: 30, right: 30, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
        const p = now ? interpolate(t - w.s, [0, 0.1], [1.15, 1], clamp) : 1;
        return (
          <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 78, letterSpacing: -2, textTransform: "uppercase", color: now ? C.gold : on ? "#fff" : "rgba(255,255,255,0.6)", transform: `scale(${p})`, display: "inline-block", WebkitTextStroke: "3px #000", paintOrder: "stroke", textShadow: "0 6px 18px rgba(0,0,0,0.8)" }}>
            {w.w.replace(/[,.?]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

export const Reel9: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "impact", 0.45], [0.05, "whoosh", 0.3], [1.1, "typing", 0.3], [4.82, "impact", 0.55], [5.6, "swish", 0.3], [5.8, "pop", 0.35],
    [8.1, "whoosh", 0.35], [8.44, "pop", 0.4], [9.9, "click", 0.5], [11.0, "swish", 0.35], [11.2, "click", 0.5],
    [11.6, "whoosh", 0.3], [12.84, "click", 0.45], [13.57, "click", 0.45], [14.3, "click", 0.45], [15.22, "ding", 0.3],
    [15.9, "swish", 0.3], [17.9, "whoosh", 0.35], [19.9, "whoosh", 0.35], [20.1, "click", 0.45], [23.0, "whoosh", 0.35], [23.2, "click", 0.45], [25.4, "whoosh", 0.35], [25.6, "click", 0.45],
    [28.9, "swish", 0.3], [30.6, "ding", 0.3], [32.42, "glitch", 0.3], [33.7, "click", 0.45], [34.95, "whoosh", 0.35], [35.3, "riser", 0.25], [36.6, "ding", 0.35],
    [37.6, "swish", 0.3], [39.6, "click", 0.6], [39.65, "notify", 0.35], [43.8, "typing", 0.4], [45.2, "ding", 0.3], [46.3, "whoosh", 0.35], [50.5, "pop", 0.35], [51.6, "impact", 0.4], [52.46, "pop", 0.4],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile("r/r9fx_aroll.mp4")} muted style={{ width: "100%", height: "100%" }} />
      {SEGS_T.map((s, i) => (
        <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}>
          {s.split ? <Split offset={f(s.a)}><Flash dur={4} /><s.split /></Split> : s.banner}
        </Sequence>
      ))}
      <Captions />
      <Audio src={staticFile("r/r9f_aroll.mp4")} />
      <Music src="r/r9_music.wav" total={END} base={0.1} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={T(t)} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo, Img, Easing } from "remotion";
import data from "../public/r/r8f_words.json";
import { Aroll, f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, Flash, chunkWords, activeChunk } from "./lib";

/* Reel 8: Claude Fable 5.2. Varun-Mayya-style news edit.
   Base layer = A-roll with face-tracked effects already burned in (effects skill, r8fx_aroll.mp4).
   On top: hook card, launch-video cutaway, split-screen proof shots, section banners, captions, music, SFX. */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R8_FRAMES = Math.ceil(END * FPS);
const C = { yellow: "#FFE600", red: "#FF3B30", ink: "#0A0A0A", orange: "#D97757" };
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* hook: big two-line headline that slams in */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 6], [1.6, 1], { ...clamp, easing: ease });
  const out = interpolate(frame, [f(3.2), f(3.55)], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transform: `scale(${s})`, opacity: out }}>
      <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 112, color: "#fff", letterSpacing: -4, textShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>AI BUILT AN</div>
      <div style={{ background: C.red, padding: "4px 28px 10px", transform: "rotate(-2deg)" }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 132, color: "#fff", letterSpacing: -5 }}>ENTIRE OS 🤯</div>
      </div>
    </div>
  );
};

/* full-screen launch footage cutaway */
const Launch: React.FC<{ startAt: number }> = ({ startAt }) => {
  const frame = useCurrentFrame();
  const z = 1 + interpolate(frame, [0, 130], [0, 0.08], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        <OffthreadVideo src={staticFile("b/fable_launch.mp4")} muted startFrom={Math.round(startAt * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <Flash dur={5} />
      <PopIn delay={4} style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "rgba(0,0,0,0.65)", color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 40, letterSpacing: 6, padding: "10px 26px", borderRadius: 12 }}>INTRODUCING</div>
      </PopIn>
      <div style={{ position: "absolute", right: 30, bottom: 60, fontFamily: INTER, fontWeight: 600, fontSize: 24, color: "rgba(255,255,255,0.8)" }}>Video: Anthropic (@claudeai)</div>
    </AbsoluteFill>
  );
};

/* split screen: proof screenshot on top, face below (lip sync stays visible) */
const Proof: React.FC<{ img: string; credit: string; offset: number; focus: string; zoomTo?: number; underline?: [number, number, number]; children?: React.ReactNode }> = ({ img, credit, offset, focus, zoomTo = 1.25, underline, children }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [4, 70], [1, zoomTo], { ...clamp, easing: ease });
  const ul = underline ? interpolate(frame, [underline[2], underline[2] + 10], [0, 1], clamp) : 0;
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 980, overflow: "hidden", background: "#fff" }}>
        <div style={{ width: "100%", height: "100%", transform: `scale(${z})`, transformOrigin: focus }}>
          <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%" }} />
          {underline && <div style={{ position: "absolute", left: `${underline[0]}%`, top: `${underline[1]}%`, width: `${60 * ul}%`, height: 10, background: C.red, borderRadius: 5 }} />}
        </div>
        <div style={{ position: "absolute", right: 16, bottom: 12, background: "rgba(0,0,0,0.7)", color: "#fff", fontFamily: INTER, fontWeight: 600, fontSize: 22, padding: "4px 12px", borderRadius: 8 }}>{credit}</div>
        {children}
      </div>
      <Aroll data={D} src="r/r8f_aroll.mp4" box={{ x: 0, y: 980, w: 1080, h: 940 }} focusY={760} zoom={1} alternate={false} offset={offset} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 976, height: 8, background: C.yellow }} />
    </AbsoluteFill>
  );
};

/* section banner (01 CODING etc.) */
const Banner: React.FC<{ num: string; label: string; color?: string }> = ({ num, label, color = C.yellow }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 8], [-1100, 0], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", top: 230, left: 40, transform: `translateX(${x}px)`, display: "flex", alignItems: "stretch", boxShadow: "0 14px 40px rgba(0,0,0,0.45)" }}>
      <div style={{ background: C.ink, color, fontFamily: INTER, fontWeight: 900, fontSize: 84, padding: "6px 24px" }}>{num}</div>
      <div style={{ background: color, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 84, padding: "6px 30px", letterSpacing: -2 }}>{label}</div>
    </div>
  );
};

type Cut = { a: number; b: number; el: (offset: number) => React.ReactNode; caps?: "top" | "none" | "low" };
const CUTS: Cut[] = [
  { a: 0, b: 3.6, el: () => <Hook /> },
  { a: 7.8, b: 11.95, el: () => <Launch startAt={10.1} />, caps: "low" },
  { a: 13.8, b: 16.9, el: (o) => <Proof img="img/fable_anth.png" credit="Source: anthropic.com" offset={o} focus="30% 85%" zoomTo={1.35} underline={[4, 80, 30]} />, caps: "low" },
  {
    a: 19.4, b: 23.4, caps: "low",
    el: (o) => (
      <Proof img="img/fable_ie.png" credit="Source: Interesting Engineering" offset={o} focus="50% 12%" zoomTo={1.3}>
        <Sequence from={f(22.75 - 19.4)} layout="none">
          <PopIn style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
            <div style={{ transform: "rotate(-8deg)", border: `12px solid ${C.red}`, color: C.red, background: "rgba(255,255,255,0.9)", fontFamily: INTER, fontWeight: 900, fontSize: 130, padding: "0 40px", borderRadius: 22 }}>8 DAYS</div>
          </PopIn>
        </Sequence>
      </Proof>
    ),
  },
  { a: 28.82, b: 30.9, el: () => <Banner num="01" label="CODING" /> },
  { a: 40.54, b: 42.6, el: () => <Banner num="02" label="DATA ANALYSIS" color="#7CFFB2" /> },
  { a: 49.94, b: 52.0, el: () => <Banner num="03" label="AI AGENTS" color="#7DD3FC" /> },
  { a: 67.9, b: 69.3, el: () => <Banner num="⚠" label="THE CATCH" color="#FF9F0A" /> },
];

/* Varun-style captions: chunky white, active word yellow, sits on the chest */
const chunks = chunkWords(D.words, 3, 16);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cut = CUTS.find((c) => t >= c.a && t < c.b);
  const msgs = t >= 30.8 && t < 36.4; // message pop-ups own the lower half
  const c = activeChunk(chunks, t);
  if (!c || cut?.caps === "none") return null;
  const top = cut?.caps === "low" ? 1560 : msgs ? 150 : 1170;
  return (
    <div style={{ position: "absolute", top, left: 40, right: 40, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
        const p = now ? interpolate(t - w.s, [0, 0.1], [1.15, 1], clamp) : 1;
        return (
          <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 80, letterSpacing: -2, textTransform: "uppercase", color: now ? C.yellow : on ? "#fff" : "rgba(255,255,255,0.55)", transform: `scale(${p})`, display: "inline-block", WebkitTextStroke: "3px #000", paintOrder: "stroke", textShadow: "0 6px 18px rgba(0,0,0,0.7)" }}>
            {w.w.replace(/[,.?]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

export const Reel8: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "impact", 0.5], [0.05, "whoosh", 0.35], [3.6, "swish", 0.35], [4.6, "glitch", 0.3],
    [7.8, "whoosh", 0.4], [10.9, "impact", 0.45], [11.95, "swish", 0.3], [12.0, "riser", 0.25],
    [13.8, "whoosh", 0.35], [16.9, "swish", 0.3], [17.1, "blip", 0.3], [17.6, "blip", 0.3], [18.1, "blip", 0.3], [18.6, "ding", 0.3],
    [19.4, "whoosh", 0.35], [22.75, "impact", 0.5], [23.4, "swish", 0.3], [23.8, "pop", 0.4],
    [28.82, "whoosh", 0.4], [31.0, "notify", 0.35], [32.2, "notify", 0.35], [33.4, "notify", 0.35],
    [40.54, "whoosh", 0.4], [45.6, "swish", 0.3], [49.94, "whoosh", 0.4], [53.3, "pop", 0.35], [53.6, "pop", 0.35], [53.9, "pop", 0.35], [54.2, "pop", 0.35],
    [62.7, "click", 0.5], [63.66, "pop", 0.45], [65.0, "glitch", 0.35], [65.3, "typing", 0.35],
    [67.9, "impact", 0.45], [72.0, "riser", 0.25], [74.4, "swish", 0.3], [76.3, "typing", 0.4], [77.6, "ding", 0.3], [79.5, "click", 0.6], [79.55, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile("r/r8fx_aroll.mp4")} muted style={{ width: "100%", height: "100%" }} />
      {CUTS.map((c, i) => (
        <Sequence key={i} from={f(c.a)} durationInFrames={Math.max(1, f(c.b) - f(c.a))}>{c.el(f(c.a))}</Sequence>
      ))}
      <Captions />
      <Audio src={staticFile("r/r8f_aroll.mp4")} />
      <Music src="r/r8_music.wav" total={END} base={0.1} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

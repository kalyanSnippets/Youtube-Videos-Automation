import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender } from "remotion";
import data from "../public/r/r16_words.json";
import { f, FPS, INTER, MONO, Music, ReelData, Sfx, chunkWords, activeChunk } from "./lib";
import { clamp } from "./split";

/* Reel 16 v3: Paperclip AI, GitHub Goldmine. Lemo-Opuscar styles, full-screen graphics:
   - Isometric People Scene (the story: office, team, AI agents, tasks, two agents), rendered in the library's own engine
     (scratchpad films/paperclip, 1080x1920) and played here as clips.
   - Dark Tech Keynote (the proof: real GitHub page, 117K, real dashboard, README steps, end card): near-black stage,
     hairline 48 px grid, one accent (electric violet), UI windows that expand/collapse, light reveal, toast captions.
   Face shots for the reaction, the honest catch and the CTA. Times = seconds on the 55.87 s cut + 3 s end card. */
const D = data as unknown as ReelData;
const BASE = "r/r16fx_aroll.mp4";
const OUTRO = 3.0;
const END = D.duration + OUTRO;
export const R16B_FRAMES = Math.ceil(END * FPS);
const AC = "#8B7CFF"; // the one keynote accent
const L = (abs: number, a: number) => f(abs) - f(a);
const backE = Easing.out(Easing.back(1.3));
const eio = Easing.bezier(0.65, 0, 0.35, 1);

/* Newsreader (OFL) for the isometric pale caption bar */
const useSerif = () => {
  const [h] = useState(() => delayRender("serif"));
  useEffect(() => {
    if ((window as any).__serif) { continueRender(h); return; }
    (window as any).__serif = true;
    const ff = new FontFace("Newsreader", `url(${staticFile("fonts/Newsreader.woff2")})`, { weight: "200 800" });
    ff.load().then((x) => { (document.fonts as any).add(x); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

/* ---------- keynote stage ---------- */
const Stage: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 55% at 50% 0%, #1A1D26 0%, #0A0B0F 60%, #06070A 100%)" }}>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 78% 62%, rgba(139,124,255,0.07), transparent 45%)" }} />
    <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "48px 48px, 48px 48px, 192px 192px, 192px 192px", backgroundPosition: "12px 0, 12px 0, 12px 0, 12px 0" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
    {children}
  </AbsoluteFill>
);
/* a window: rounded, title bar with a small glyph and title (no traffic lights), 1 px border, inner top highlight.
   Opens by expanding from a point (keynote transition); optional light reveal across its content. */
const Win: React.FC<{ x: number; y: number; w: number; h: number; title: string; at?: number; src?: string; startFrom?: number; rate?: number; reveal?: boolean; rotY?: number; children?: React.ReactNode; close?: number }> = ({ x, y, w, h, title, at = 0, src, startFrom = 0, rate = 1, reveal = true, rotY = 0, children, close }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - at, [-1, 8], [0, 1], { ...clamp, easing: backE });
  const c = close === undefined ? 1 : interpolate(frame, [close, close + 6], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  if (frame < at - 1) return null;
  const sweep = interpolate(frame - at, [4, 4 + 36], [0, 1.3], clamp);
  const bar = 54;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, perspective: 1800, transform: `scale(${(0.2 + 0.8 * o) * (0.3 + 0.7 * c)}, ${(0.05 + 0.95 * o) * c})`, opacity: Math.min(1, o * 2) * c }}>
      <div style={{ position: "absolute", inset: 0, transform: `rotateY(${rotY}deg)`, borderRadius: 22, overflow: "hidden", background: "#12141A", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 40px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)" }}>
        <div style={{ height: bar, display: "flex", alignItems: "center", gap: 14, padding: "0 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#171A21" }}>
          <div style={{ width: 16, height: 16, borderRadius: 5, background: AC, boxShadow: `0 0 12px ${AC}` }} />
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, color: "#9AA0AE", letterSpacing: 0.5 }}>{title}</div>
        </div>
        <div style={{ position: "absolute", left: 0, top: bar, right: 0, bottom: 0, overflow: "hidden" }}>
          {src && <Sequence from={at} layout="none"><OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 0%" }} /></Sequence>}
          {children}
          {reveal && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, rgba(6,7,10,0.0) ${sweep * 100 - 30}%, rgba(255,255,255,0.10) ${sweep * 100 - 8}%, rgba(6,7,10,0.92) ${sweep * 100}%)` }} />}
        </div>
      </div>
    </div>
  );
};
/* mono label in small caps with wide tracking */
const Label: React.FC<{ at: number; y: number; children: React.ReactNode; color?: string; size?: number }> = ({ at, y, children, color = "#9AA0AE", size = 30 }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame - at, [0, 7], [0, 1], { ...clamp, easing: backE });
  if (frame < at) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: size, letterSpacing: 6, color, textTransform: "uppercase", opacity: k, transform: `translateY(${(1 - k) * 16}px)` }}>{children}</div>;
};
/* the lone giant number, scrambled from glyph noise, digits lock one by one */
const BigNumber: React.FC<{ at: number; text: string; sub: string }> = ({ at, text, sub }) => {
  const frame = useCurrentFrame();
  const glyphs = "0123456789#%&@$*";
  const shown = text.split("").map((ch, i) => {
    const lock = at + 6 + i * 4;
    if (frame >= lock || !/[0-9]/.test(ch)) return ch;
    return glyphs[(frame * 7 + i * 13) % glyphs.length];
  }).join("");
  const k = interpolate(frame - at, [0, 8], [0, 1], { ...clamp, easing: backE });
  const glow = interpolate(frame - at, [14, 22, 40], [0, 1, 0.6], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 330, letterSpacing: -15, color: "#fff", opacity: k, transform: `scale(${0.9 + 0.1 * k})`, textShadow: `0 0 ${60 * glow}px ${AC}99` }}>
        {shown}<span style={{ color: AC }}>★</span>
      </div>
      <Label at={at + 14} y={1100}>{sub}</Label>
    </>
  );
};
const Pill: React.FC<{ at: number; children: React.ReactNode; accent?: boolean }> = ({ at, children, accent }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame - at, [0, 7], [0, 1], { ...clamp, easing: backE });
  if (frame < at) return null;
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 26px", borderRadius: 999, background: accent ? AC : "rgba(255,255,255,0.06)", border: `1px solid ${accent ? AC : "rgba(255,255,255,0.12)"}`, color: accent ? "#0A0B0F" : "#E8EAF0", fontFamily: INTER, fontWeight: 700, fontSize: 36, opacity: k, transform: `translateY(${(1 - k) * 20}px) scale(${0.9 + 0.1 * k})`, boxShadow: accent ? `0 0 30px ${AC}88` : undefined }}>{children}</div>;
};
const Row: React.FC<{ y: number; children: React.ReactNode }> = ({ y, children }) => <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", gap: 18 }}>{children}</div>;

/* ---------- keynote shots ---------- */
const KRepo: React.FC = () => { // 14.54–19.69: 117K, then the real repo page
  const a = 14.54, frame = useCurrentFrame();
  const numOut = L(16.25, a);
  return (
    <Stage>
      {frame < numOut + 6 && <div style={{ position: "absolute", inset: 0, opacity: interpolate(frame, [numOut, numOut + 6], [1, 0], clamp), transform: `scale(${interpolate(frame, [numOut, numOut + 6], [1, 0.92], clamp)})` }}><BigNumber at={2} text="117K" sub="GitHub stars · open source" /></div>}
      <Label at={numOut} y={400} color="#E8EAF0" size={34}>Paperclip AI</Label>
      <Win x={40} y={500} w={1000} h={680} title="github.com/paperclipai/paperclip" at={numOut} src="b/r16/gh_topf.mp4" rotY={-4} />
      <Row y={1250}><Pill at={numOut + 10}>MIT licence</Pill><Pill at={numOut + 16}>self-hosted</Pill></Row>
    </Stage>
  );
};
const KDash: React.FC = () => { // 33.69–36.34: real dashboard, progress + budget
  const a = 33.69;
  return (
    <Stage>
      <Label at={2} y={410}>official demo · README</Label>
      <Win x={30} y={500} w={1020} h={680} title="paperclip · dashboard" at={0} src="b/r16/gh_dashc.mp4" rotY={3} />
      <Row y={1250}><Pill at={L(34.39, a)}>📊 progress</Pill><Pill at={L(35.34, a)} accent>budget limits</Pill></Row>
    </Stage>
  );
};
const KPlan: React.FC = () => { // 45.28–48.03: README steps
  const a = 45.28;
  return (
    <Stage>
      <Label at={2} y={410} size={26}>goal · team · approve and run</Label>
      <Win x={40} y={500} w={1000} h={680} title="README · how it works" at={0} src="b/r16/gh_goal.mp4" rotY={-3} />
      <Row y={1250}><Pill at={L(45.93, a)}>🔗 project link</Pill><Pill at={L(46.93, a)} accent>beginner setup plan</Pill></Row>
    </Stage>
  );
};
const KEnd: React.FC = () => { // end card: a shipped state
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [f(OUTRO) - 16, f(OUTRO)], [1, 0], clamp);
  return (
    <Stage>
      <div style={{ position: "absolute", inset: 0, opacity: fadeOut }}>
        <Label at={2} y={560} color={AC} size={34}>⛏ GitHub Goldmine</Label>
        <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 130, letterSpacing: -5, color: "#fff", opacity: interpolate(frame, [4, 12], [0, 1], clamp) }}>Paperclip AI</div>
        <Row y={860}><Pill at={12} accent>💬 Comment COMPANY</Pill></Row>
        <Label at={20} y={990} color="#9AA0AE">follow AI with Kalyan</Label>
      </div>
    </Stage>
  );
};

/* ---------- isometric clips (rendered in the library) ---------- */
const Iso: React.FC<{ src: string }> = ({ src }) => <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%" }} />;

type Kind = "iso" | "key" | "face";
type Seg = { a: number; b: number; kind: Kind; C?: React.FC; src?: string };
const SEGS: Seg[] = [
  { a: 0, b: 3.3, kind: "iso", src: "b/r16/iso_hook.mp4" },
  { a: 3.3, b: 6.44, kind: "face" },
  { a: 6.44, b: 14.54, kind: "iso", src: "b/r16/iso_team.mp4" },
  { a: 14.54, b: 19.69, kind: "key", C: KRepo },
  { a: 19.69, b: 27.24, kind: "iso", src: "b/r16/iso_org.mp4" },
  { a: 27.24, b: 33.69, kind: "iso", src: "b/r16/iso_tasks.mp4" },
  { a: 33.69, b: 36.34, kind: "key", C: KDash },
  { a: 36.34, b: 40.74, kind: "face" },
  { a: 40.74, b: 45.28, kind: "iso", src: "b/r16/iso_starter.mp4" },
  { a: 45.28, b: 48.03, kind: "key", C: KPlan },
  { a: 48.03, b: D.duration, kind: "face" },
  { a: D.duration, b: END, kind: "key", C: KEnd },
];
const segAt = (t: number) => SEGS.find((s) => t >= s.a && t < s.b) ?? SEGS[SEGS.length - 1];

/* captions: pale serif bar over the isometric shots, keynote toast elsewhere */
const chunks = chunkWords(D.words, 4, 22);
const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if ((t >= 48.08 && t < 50.83) || t >= D.duration) return null; // comment box shows the keyword
  if (t >= 14.6 && t < 16.25) return null; // the giant number has its own screen
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const s = segAt(t);
  const text = c.words.map((w) => w.w).join(" ").replace(/[,.?]/g, "");
  const into = interpolate(t - c.words[0].s, [0, 0.16], [0, 1], clamp);
  if (s.kind === "iso") {
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: 1760, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "rgba(250,245,236,0.92)", borderRadius: 6, padding: "12px 30px 16px", fontFamily: "Newsreader, serif", fontWeight: 500, fontSize: 54, color: "#2A2E29", boxShadow: "0 6px 20px rgba(42,46,41,0.12)" }}>{text}</div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: s.kind === "face" ? 1460 : 1640, display: "flex", justifyContent: "center", opacity: into, transform: `translateY(${(1 - into) * 10}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(14,16,22,0.82)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999, padding: "16px 34px", boxShadow: "0 12px 30px rgba(0,0,0,0.45)", maxWidth: 980 }}>
        <div style={{ width: 14, height: 14, borderRadius: 99, background: AC, boxShadow: `0 0 10px ${AC}` }} />
        <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 50, color: "#fff", letterSpacing: -0.5 }}>{text}</div>
      </div>
    </div>
  );
};

/* transitions: into a keynote shot = UI expand (handled by Win); face <-> iso = short push dissolve */
const Shot: React.FC<{ s: Seg; prev?: Seg }> = ({ s, prev }) => {
  const frame = useCurrentFrame();
  const { durationInFrames: dur } = useVideoConfig();
  const fromFace = prev?.kind === "face" || prev?.kind !== s.kind;
  const inK = fromFace && s.kind !== "face" ? interpolate(frame, [0, 7], [0, 1], { ...clamp, easing: eio }) : 1;
  const z = s.kind === "iso" ? interpolate(frame, [0, 9], [1.05, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  void dur;
  return (
    <AbsoluteFill style={{ opacity: inK, transform: `scale(${z})` }}>
      {s.kind === "iso" && s.src ? <Iso src={s.src} /> : s.C ? <s.C /> : null}
    </AbsoluteFill>
  );
};

export const Reel16b: React.FC = () => {
  useSerif();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const faceBack = SEGS.filter((s) => s.kind === "face").map((s) => f(s.a));
  const since = Math.min(...faceBack.map((b) => (frame >= b ? frame - b : 999)));
  const zf = since < 12 ? interpolate(since, [0, 11], [1.05, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  const sfx: [number, string, number][] = [
    [0.1, "blip", 0.12], [1.1, "click", 0.08], [2.0, "ding", 0.12], [8.89, "click", 0.1], [10.07, "click", 0.08], [10.61, "click", 0.08], [10.87, "click", 0.08],
    [13.69, "glitch", 0.08], [14.6, "uplink", 0.1], [16.25, "swish", 0.08], [20.3, "blip", 0.1], [27.9, "pop", 0.1], [31.3, "swish", 0.08], [33.0, "ding", 0.12],
    [33.69, "swish", 0.08], [43.4, "pop", 0.1], [44.3, "pop", 0.1], [45.28, "swish", 0.08], [D.duration + 0.05, "ding", 0.12],
  ];
  void t;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zf})`, transformOrigin: "50% 35%" }}>
        <OffthreadVideo src={staticFile(BASE)} muted style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      {SEGS.map((s, i) => s.kind === "face" ? null : (
        <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}>
          <Shot s={s} prev={SEGS[i - 1]} />
        </Sequence>
      ))}
      <Captions />
      <Audio src={staticFile(BASE)} />
      <Music src="r/r16_music.wav" total={END} base={0.07} boosts={[[D.duration, END, 0.12]]} />
      {sfx.map(([tt, n, v], i) => <Sfx key={i} at={tt} name={n} vol={v} />)}
    </AbsoluteFill>
  );
};

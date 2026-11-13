import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo, Img, Easing } from "remotion";
import data from "../public/r/r8f_words.json";
import { Aroll, f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, Flash, chunkWords, activeChunk } from "./lib";

/* Reel 8 v2: Claude Fable 5.2, Varun-Mayya-style news edit.
   Full-face moments use the effects-skill pass (r8fx2_aroll.mp4: scribble, glass counter, toggles, messages, comment box, follow).
   Every graphic sits in a split screen (graphic on top, Kalyan below), so nothing hides behind his head.
   Captions: on the seam in split screens, on the chest in full-face shots, never on the face. */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R8_FRAMES = Math.ceil(END * FPS);
const C = { yellow: "#FFE600", red: "#FF3B30", green: "#30D158", ink: "#0A0A0A", panel: "#111214", line: "#2A2B30", orange: "#D97757", mute: "#8E8E93" };
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SEAM = 960;
const L = (abs: number, a: number) => f(abs - a); // absolute word time -> local frame

/* ---------- split-screen frame ---------- */
const Split: React.FC<{ offset: number; children: React.ReactNode }> = ({ offset, children }) => (
  <AbsoluteFill style={{ background: C.ink }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, overflow: "hidden", background: C.panel }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.35 }} />
      {children}
    </div>
    <Aroll data={D} src="r/r8f_aroll.mp4" box={{ x: 0, y: SEAM, w: 1080, h: 1920 - SEAM }} focusY={600} zoom={1} alternate={false} offset={offset} />
    <div style={{ position: "absolute", left: 0, right: 0, top: SEAM - 4, height: 8, background: C.yellow }} />
  </AbsoluteFill>
);
const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 18, bottom: 26, background: "rgba(0,0,0,0.7)", color: "#fff", fontFamily: INTER, fontWeight: 600, fontSize: 22, padding: "4px 12px", borderRadius: 8 }}>{text}</div>
);
const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 110, color = "#fff", style }) => (
  <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: size, color, letterSpacing: -4, lineHeight: 0.95, ...style }}>{children}</div>
);

/* ---------- panels (local frames; a = panel start in seconds) ---------- */
const HookPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 6], [1.5, 1], { ...clamp, easing: ease });
  const boot = interpolate(frame, [10, f(3.2)], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26 }}>
      <div style={{ transform: `scale(${s})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Big size={120}>AI BUILT AN</Big>
        <div style={{ background: C.red, padding: "6px 30px 12px", transform: "rotate(-2deg)" }}><Big size={140}>ENTIRE OS</Big></div>
      </div>
      <div style={{ width: 640, background: "#1C1D21", border: `2px solid ${C.line}`, borderRadius: 18, padding: "18px 22px" }}>
        <div style={{ fontFamily: MONO, fontSize: 26, color: C.mute }}>{boot < 1 ? "booting fable-os…" : "fable-os ready ✓"}</div>
        <div style={{ marginTop: 12, height: 18, borderRadius: 9, background: "#2C2D33", overflow: "hidden" }}><div style={{ width: `${boot * 100}%`, height: "100%", background: boot < 1 ? C.yellow : C.green }} /></div>
      </div>
    </div>
  );
};

const NotPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 3.6;
  const rows: [string, string, number, boolean][] = [["🌐", "A WEBSITE", 4.06, false], ["📱", "A SIMPLE APP", 5.16, false], ["💻", "AN ENTIRE OS", 6.08, true]];
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 150, display: "flex", flexDirection: "column", gap: 34 }}>
      {rows.map(([icon, label, t, good]) => {
        const at = L(t, a);
        if (frame < at) return null;
        const strike = good ? 0 : interpolate(frame, [at + 8, at + 14], [0, 1], clamp);
        return (
          <PopIn key={label} from="left">
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 26, background: good ? C.green : "#1C1D21", border: `3px solid ${good ? C.green : C.line}`, borderRadius: 24, padding: "22px 30px", boxShadow: good ? `0 0 60px ${C.green}66` : undefined }}>
              <div style={{ fontSize: 80 }}>{icon}</div>
              <Big size={78} color={good ? C.ink : "#fff"}>{label}</Big>
              <div style={{ marginLeft: "auto", fontFamily: INTER, fontWeight: 900, fontSize: 80, color: good ? C.ink : C.red }}>{good ? "✓" : frame >= at + 14 ? "✕" : ""}</div>
              {!good && <div style={{ position: "absolute", left: 20, right: 20, top: "50%", height: 10, borderRadius: 5, background: C.red, transform: `scaleX(${strike})`, transformOrigin: "0 50%" }} />}
            </div>
          </PopIn>
        );
      })}
    </div>
  );
};

const IntroPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 7.75;
  const title = frame >= L(10.34, a);
  return (
    <>
      <div style={{ position: "absolute", left: 60, right: 60, top: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <PopIn><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 34, letterSpacing: 8, color: C.orange }}>✳ ANTHROPIC · NEW MODEL</div></PopIn>
        {title && <PopIn><Big size={120} style={{ textAlign: "center" }}>Claude <span style={{ color: C.orange }}>Fable 5.2</span></Big></PopIn>}
      </div>
      <PopIn delay={L(9.0, a)} from="up" style={{ position: "absolute", left: 70, right: 70, top: title ? 400 : 300 }}>
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", transform: "rotate(-1.5deg)" }}>
          <Img src={staticFile("img/fable_notes.png")} style={{ width: "100%", display: "block", height: 420, objectFit: "cover", objectPosition: "0% 0%" }} />
        </div>
      </PopIn>
      {frame >= L(11.26, a) && <PopIn style={{ position: "absolute", right: 70, top: 790 }}><div style={{ background: C.yellow, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 36, padding: "8px 20px", borderRadius: 12 }}>Released Nov 9, 2026</div></PopIn>}
      <Credit text="Source: Claude release notes" />
    </>
  );
};

const ProofPanel: React.FC<{ img: string; credit: string; children?: React.ReactNode }> = ({ img, credit, children }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [4, 90], [1, 1.06], clamp);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "#fff", transform: `scale(${z})` }}>
        <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "50% 30%" }} />
      </div>
      {children}
      <Credit text={credit} />
    </>
  );
};

const DataPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 42.2;
  const vals = [42, 48, 45, 55, 58, 54, 92, 61, 66, 70];
  const grow = interpolate(frame, [4, 40], [0, 1], { ...clamp, easing: ease });
  const odd = frame >= L(47.6, a);
  const trend = frame >= L(46.5, a);
  const report = frame >= L(49.0, a);
  const W = 860, H = 460, bw = W / vals.length;
  return (
    <>
      <div style={{ position: "absolute", left: 60, top: 70, fontFamily: MONO, fontWeight: 800, fontSize: 32, color: C.mute }}>📊 SALES · LAST 10 MONTHS</div>
      <div style={{ position: "absolute", left: 110, top: 170, width: W, height: H }}>
        {vals.map((v, i) => {
          const h = (v / 100) * H * grow;
          const isOdd = i === 6;
          return <div key={i} style={{ position: "absolute", left: i * bw + 10, bottom: 0, width: bw - 20, height: h, borderRadius: "10px 10px 0 0", background: odd && isOdd ? C.red : "#3A86FF", boxShadow: odd && isOdd ? `0 0 40px ${C.red}` : undefined }} />;
        })}
        {trend && <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}><path d={`M 30 ${H * 0.55} L ${W - 30} ${H * 0.28}`} stroke={C.yellow} strokeWidth={8} strokeDasharray="20 14" pathLength={1} /></svg>}
        {trend && <PopIn style={{ position: "absolute", left: 0, top: -40 }}><div style={{ background: C.yellow, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 34, padding: "6px 16px", borderRadius: 10 }}>📈 trend: up</div></PopIn>}
        {odd && <PopIn style={{ position: "absolute", left: 6 * bw - 60, top: -10 }}><div style={{ background: C.red, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 34, padding: "6px 16px", borderRadius: 10 }}>⚠ unusual spike</div></PopIn>}
      </div>
      {report && <PopIn style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center" }}><div style={{ background: "#fff", color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 46, padding: "12px 30px", borderRadius: 16 }}>📄 Report ready</div></PopIn>}
      <div style={{ position: "absolute", left: 60, bottom: 26, fontFamily: INTER, fontWeight: 600, fontSize: 22, color: C.mute }}>Example data (illustration)</div>
    </>
  );
};

const AgentsPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 53.2;
  const link = interpolate(frame, [L(55.7, a), L(55.7, a) + 14], [0, 1], clamp);
  const subs: [string, number][] = [["🎨 UI", 140], ["⚙️ Backend", 410], ["🧪 Tests", 680], ["📝 Docs", 950]];
  return (
    <>
      <PopIn delay={L(54.6, a)} style={{ position: "absolute", left: 0, right: 0, top: 110, display: "flex", justifyContent: "center" }}>
        <div style={{ background: C.orange, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 56, padding: "18px 40px", borderRadius: 24, boxShadow: `0 0 60px ${C.orange}88` }}>✳ FABLE · lead agent</div>
      </PopIn>
      <svg width={1080} height={SEAM} style={{ position: "absolute", left: 0, top: 0 }}>
        {subs.map(([, x], i) => <line key={i} x1={540} y1={250} x2={540 + (x - 540) * link} y2={250 + 330 * link} stroke={C.yellow} strokeWidth={6} strokeDasharray="14 10" strokeDashoffset={-frame * 3} />)}
      </svg>
      {subs.map(([n, x], i) => (
        <PopIn key={n} delay={L(56.2, a) + i * 4} style={{ position: "absolute", left: x - 120, top: 590, width: 240 }}>
          <div style={{ background: "#1C1D21", border: `3px solid ${C.line}`, borderRadius: 18, padding: "16px 10px", textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 34, color: "#fff" }}>{n}<div style={{ fontFamily: MONO, fontSize: 20, color: C.green, marginTop: 6 }}>{frame > L(58.0, a) + i * 3 ? "✓ done" : "working…"}</div></div>
        </PopIn>
      ))}
    </>
  );
};

const SpeedPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [6, 40], [0, 1], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 120, display: "flex", flexDirection: "column", gap: 40 }}>
      <Big size={110}>UP TO <span style={{ color: C.yellow }}>30%</span> FASTER</Big>
      {[["Fable 5.1", 1, C.mute], ["Fable 5.2", 0.7, C.green]].map(([n, w, col]) => (
        <div key={n as string}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, color: "#fff", marginBottom: 10 }}>{n as string} <span style={{ color: C.mute, fontSize: 28 }}>· response time</span></div>
          <div style={{ height: 56, borderRadius: 28, background: "#1C1D21", overflow: "hidden" }}><div style={{ width: `${(w as number) * 100 * p}%`, height: "100%", background: col as string, borderRadius: 28 }} /></div>
        </div>
      ))}
      <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 28, color: C.mute }}>Anthropic's own figure</div>
    </div>
  );
};

const TokensPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(interpolate(frame, [4, 50], [0, 1000000], { ...clamp, easing: ease }));
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 150, color: C.yellow, letterSpacing: -4 }}>{n.toLocaleString("en-US")}</div>
      <Big size={80}>TOKEN CONTEXT WINDOW</Big>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ fontSize: 56, opacity: frame > 6 + i * 3 ? 1 : 0.15 }}>📄</div>)}
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 32, color: C.mute }}>whole codebases & huge reports in one go</div>
    </div>
  );
};

const FitPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 68.9;
  const right = frame >= L(72.08, a);
  const card = (title: string, sub: string, on: boolean, col: string) => (
    <div style={{ flex: 1, background: on ? col : "#1C1D21", border: `3px solid ${on ? col : C.line}`, borderRadius: 26, padding: "34px 26px", minHeight: 420, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, boxShadow: on ? `0 0 60px ${col}66` : undefined }}>
      <Big size={58} color={on ? C.ink : "#fff"}>{title}</Big>
      <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 34, color: on ? C.ink : C.mute }}>{sub}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 150, display: "flex", gap: 30 }}>
      <PopIn>{card("Everyday tasks", "Emails, quick answers → you don't need this much power", false, C.green)}</PopIn>
      {right && <PopIn>{card("Really complicated stuff", "Big codebases, deep analysis, agents → Fable 5.2 ✓", true, C.green)}</PopIn>}
    </div>
  );
};

/* lower-third section banner on full-face shots */
const Banner: React.FC<{ num: string; label: string; color?: string }> = ({ num, label, color = C.yellow }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 8], [-1100, 0], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", top: 1330, left: 40, transform: `translateX(${x}px)`, display: "flex", boxShadow: "0 14px 40px rgba(0,0,0,0.45)" }}>
      <div style={{ background: C.ink, color, fontFamily: INTER, fontWeight: 900, fontSize: 76, padding: "6px 22px" }}>{num}</div>
      <div style={{ background: color, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 76, padding: "6px 28px", letterSpacing: -2 }}>{label}</div>
    </div>
  );
};

type Seg = { a: number; b: number; split?: React.FC; banner?: React.ReactNode };
const SEGS: Seg[] = [
  { a: 0, b: 3.6, split: HookPanel },
  { a: 3.6, b: 7.75, split: NotPanel },
  { a: 7.75, b: 11.95, split: IntroPanel },
  { a: 13.8, b: 16.9, split: () => <ProofPanel img="img/fable_anth.png" credit="Source: anthropic.com" /> },
  {
    a: 19.4, b: 23.5,
    split: () => (
      <ProofPanel img="img/fable_ie.png" credit="Source: Interesting Engineering">
        <Sequence from={L(22.75, 19.4)} layout="none">
          <PopIn style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", justifyContent: "center" }}>
            <div style={{ transform: "rotate(-8deg)", border: `12px solid ${C.red}`, color: C.red, background: "rgba(255,255,255,0.92)", fontFamily: INTER, fontWeight: 900, fontSize: 130, padding: "0 40px", borderRadius: 22 }}>8 DAYS</div>
          </PopIn>
        </Sequence>
      </ProofPanel>
    ),
  },
  { a: 28.82, b: 30.9, banner: <Banner num="01" label="CODING" /> },
  { a: 40.54, b: 42.2, banner: <Banner num="02" label="DATA ANALYSIS" color="#7CFFB2" /> },
  { a: 42.2, b: 49.9, split: DataPanel },
  { a: 49.94, b: 52.0, banner: <Banner num="03" label="AI AGENTS" color="#7DD3FC" /> },
  { a: 53.2, b: 59.1, split: AgentsPanel },
  { a: 62.3, b: 64.85, split: SpeedPanel },
  { a: 64.85, b: 67.85, split: TokensPanel },
  { a: 67.9, b: 68.9, banner: <Banner num="⚠" label="THE CATCH" color="#FF9F0A" /> },
  { a: 68.9, b: 74.3, split: FitPanel },
];
const splitAt = (t: number) => SEGS.find((s) => s.split && t >= s.a && t < s.b);

/* captions: seam in split screens, chest in full-face shots, below on-screen cards */
const chunks = chunkWords(D.words, 3, 16);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const split = !!splitAt(t);
  const lowCard = (t >= 16.9 && t < 19.4) || (t >= 24.0 && t < 28.8); // glass counter / toggles under the chin
  const top = split ? SEAM - 52 : lowCard ? 1640 : 1170;
  return (
    <div style={{ position: "absolute", top, left: 30, right: 30, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
        const p = now ? interpolate(t - w.s, [0, 0.1], [1.15, 1], clamp) : 1;
        return (
          <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 80, letterSpacing: -2, textTransform: "uppercase", color: now ? C.yellow : on ? "#fff" : "rgba(255,255,255,0.6)", transform: `scale(${p})`, display: "inline-block", WebkitTextStroke: "3px #000", paintOrder: "stroke", textShadow: "0 6px 18px rgba(0,0,0,0.8)" }}>
            {w.w.replace(/[,.?]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

export const Reel8: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "impact", 0.5], [0.05, "whoosh", 0.35], [3.2, "ding", 0.25], [3.6, "swish", 0.35], [4.3, "swish", 0.3], [5.4, "swish", 0.3], [6.1, "impact", 0.4],
    [7.75, "whoosh", 0.4], [9.0, "pop", 0.35], [10.34, "impact", 0.45], [11.26, "pop", 0.35], [11.95, "swish", 0.3], [12.1, "typing", 0.25],
    [13.8, "whoosh", 0.35], [16.9, "swish", 0.3], [17.1, "blip", 0.3], [17.6, "blip", 0.3], [18.1, "blip", 0.3], [18.6, "ding", 0.3],
    [19.4, "whoosh", 0.35], [22.75, "impact", 0.5], [23.5, "swish", 0.3], [26.7, "click", 0.4], [27.8, "click", 0.4], [28.35, "click", 0.4],
    [28.82, "whoosh", 0.4], [31.0, "notify", 0.35], [32.2, "notify", 0.35], [33.4, "notify", 0.35],
    [40.54, "whoosh", 0.4], [42.2, "swish", 0.3], [46.5, "pop", 0.35], [47.6, "glitch", 0.35], [49.0, "ding", 0.3],
    [49.94, "whoosh", 0.4], [53.2, "swish", 0.3], [54.6, "impact", 0.35], [56.2, "pop", 0.3], [56.33, "pop", 0.3], [56.46, "pop", 0.3], [56.6, "pop", 0.3],
    [62.3, "whoosh", 0.35], [63.66, "ding", 0.3], [64.85, "swish", 0.3], [65.0, "riser", 0.25], [67.9, "impact", 0.45], [68.9, "swish", 0.3], [72.08, "pop", 0.4],
    [74.3, "swish", 0.3], [76.3, "typing", 0.4], [77.6, "ding", 0.3], [79.5, "click", 0.6], [79.55, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile("r/r8fx2_aroll.mp4")} muted style={{ width: "100%", height: "100%" }} />
      {SEGS.map((s, i) => (
        <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}>
          {s.split ? <Split offset={f(s.a)}><Flash dur={4} /><s.split /></Split> : s.banner}
        </Sequence>
      ))}
      <Captions />
      <Audio src={staticFile("r/r8f_aroll.mp4")} />
      <Music src="r/r8_music.wav" total={END} base={0.1} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

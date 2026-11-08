import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo, Img, Easing } from "remotion";
import data from "../public/r/r6f_words.json";
import { Aroll, Cursor, f, FPS, INTER, MONO, SERIF, Music, PopIn, ReelData, Sfx, SubscribeCard, Typewriter, chunkWords, activeChunk } from "./lib";
import { Shop } from "./R6";

/* Reel 6 v2: "whiteboard explainer" style. Paper background, marker circles/arrows, sticky notes, taped photos.
   Kalyan's footage is always shown full-frame (uncropped 9:16) in a card that slides left/right, or full screen. */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R6B_FRAMES = Math.ceil(END * FPS);

const C = { paper: "#FAF7F0", rule: "rgba(59,130,246,0.10)", ink: "#111827", mute: "#6B7280", red: "#E11D48", yellow: "#FDE047", pink: "#FBCFE8", mint: "#BBF7D0", blue: "#BFDBFE", green: "#16A34A" };
const CARD_W = 450, CARD_H = 800, CARD_Y = 1080;
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const MOMENTIC = "Source: momentic.ai";

type Side = "left" | "right" | "full";
const boxFor = (s: Side) => s === "full" ? { x: 0, y: 0, w: 1080, h: 1920, r: 0 } : { x: s === "left" ? 40 : 1080 - 40 - CARD_W, y: CARD_Y, w: CARD_W, h: CARD_H, r: 34 };
/* the free column next to the card */
const colX = (s: Side) => (s === "left" ? 520 : 40);

const Paper: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent 0 58px, ${C.rule} 58px 60px)` }} />
    <div style={{ position: "absolute", left: 90, top: 0, bottom: 0, width: 3, background: "rgba(225,29,72,0.15)" }} />
  </AbsoluteFill>
);

/* hand-drawn marker ellipse that draws itself */
const Circle: React.FC<{ cx: number; cy: number; rx: number; ry: number; at?: number; color?: string; w?: number }> = ({ cx, cy, rx, ry, at = 0, color = C.red, w = 9 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const d = `M ${cx - rx * 0.2} ${cy - ry * 1.05} C ${cx + rx * 1.1} ${cy - ry * 1.3}, ${cx + rx * 1.15} ${cy + ry * 1.1}, ${cx} ${cy + ry} C ${cx - rx * 1.2} ${cy + ry * 0.95}, ${cx - rx * 1.1} ${cy - ry * 1.2}, ${cx + rx * 0.25} ${cy - ry * 1.15}`;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};
/* hand-drawn arrow */
const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; at?: number; color?: string }> = ({ x1, y1, x2, y2, at = 0, color = C.red }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.25, my = (y1 + y2) / 2 - (x2 - x1) * 0.25;
  const ang = Math.atan2(y2 - my, x2 - mx), L = 34;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
      <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      {p >= 1 && <path d={`M ${x2 - L * Math.cos(ang - 0.5)} ${y2 - L * Math.sin(ang - 0.5)} L ${x2} ${y2} L ${x2 - L * Math.cos(ang + 0.5)} ${y2 - L * Math.sin(ang + 0.5)}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
};
const Sticky: React.FC<{ children: React.ReactNode; color?: string; rot?: number; delay?: number; w?: number; size?: number; style?: React.CSSProperties }> = ({ children, color = C.yellow, rot = -3, delay = 0, w = 480, size = 46, style }) => (
  <PopIn delay={delay} style={style}>
    <div style={{ width: w, background: color, padding: "26px 28px", transform: `rotate(${rot}deg)`, boxShadow: "0 18px 30px rgba(0,0,0,0.14)", fontFamily: INTER, fontWeight: 900, fontSize: size, color: C.ink, lineHeight: 1.15, position: "relative" }}>
      <div style={{ position: "absolute", top: -16, left: "50%", width: 120, height: 32, marginLeft: -60, background: "rgba(255,255,255,0.55)", transform: "rotate(-4deg)" }} />
      {children}
    </div>
  </PopIn>
);
const Highlight: React.FC<{ children: React.ReactNode; at?: number; color?: string }> = ({ children, at = 0, color = C.yellow }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ position: "absolute", left: -10, right: -10, top: "38%", bottom: "4%", background: color, transform: `scaleX(${p}) rotate(-1deg)`, transformOrigin: "0 50%", borderRadius: 6 }} />
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
};
const Taped: React.FC<{ children: React.ReactNode; top: number; h: number; rot?: number; credit?: string }> = ({ children, top, h, rot = -1.5, credit }) => (
  <div style={{ position: "absolute", left: 50, right: 50, top, transform: `rotate(${rot}deg)` }}>
    <div style={{ background: "#fff", padding: 14, boxShadow: "0 22px 40px rgba(0,0,0,0.18)" }}>
      <div style={{ height: h, overflow: "hidden", position: "relative" }}>{children}</div>
      {credit && <div style={{ marginTop: 8, fontFamily: INTER, fontWeight: 600, fontSize: 20, color: C.mute, textAlign: "right" }}>{credit}</div>}
    </div>
    {[-1, 1].map((s) => <div key={s} style={{ position: "absolute", top: -18, left: s < 0 ? 40 : undefined, right: s > 0 ? 40 : undefined, width: 140, height: 40, background: "rgba(253,224,71,0.7)", transform: `rotate(${s * 6}deg)` }} />)}
  </div>
);

/* ---------- scenes (local frames) ---------- */
const S = {
  hook: () => (
    <>
      <Shop mode="build" buildDur={f(2.2)} top={290} scale={1} />
      <Sticky delay={f(1.2)} rot={-4} style={{ position: "absolute", left: colX("right"), top: 1180 }}>✨ built<br />with AI</Sticky>
    </>
  ),
  perfect: () => (
    <>
      <Shop mode="ok" top={290} scale={1} />
      <Sticky delay={4} rot={3} color={C.mint} style={{ position: "absolute", left: colX("left"), top: 1180 }}>looks<br />perfect 👌</Sticky>
    </>
  ),
  fail: () => {
    const frame = useCurrentFrame();
    const failAt = f(2.0);
    const shake = frame >= failAt && frame < failAt + 10 ? Math.sin(frame * 3) * 14 : 0;
    return (
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
        <Shop mode="fail" clickAt={f(0.7)} failAt={failAt} top={290} scale={1} />
        <Cursor path={[[0, 900, 1000], [f(0.55), 600, 730], [f(1.5), 605, 735]]} clicks={[f(0.7), f(1.25)]} color="#111" />
        <Circle cx={540} cy={752} rx={470} ry={70} at={failAt} />
        <Sticky delay={failAt + 4} rot={-3} color={C.pink} style={{ position: "absolute", left: colX("right"), top: 1180 }}>😬 checkout<br />broken!</Sticky>
      </div>
    );
  },
  intro: () => (
    <>
      <Taped top={290} h={560} credit={MOMENTIC}>
        <Img src={staticFile("img/mo_home.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%" }} />
      </Taped>
      <Circle cx={540} cy={560} rx={380} ry={80} at={f(2.9)} />
      <Sticky delay={f(0.5)} rot={-3} w={470} style={{ position: "absolute", left: colX("right"), top: 1150 }}><span style={{ fontSize: 34, color: C.mute }}>meet</span><br />🤖 Mo<br /><span style={{ fontSize: 34 }}>by Momentic</span></Sticky>
      <Sticky delay={f(2.8)} rot={4} color={C.pink} w={420} size={40} style={{ position: "absolute", left: colX("right") + 40, top: 1560 }}>🐞 tests apps<br />for bugs</Sticky>
    </>
  ),
  imagine: () => (
    <>
      <Shop mode="plain" top={290} scale={1} />
      <PopIn delay={f(0.6)} style={{ position: "absolute", left: 140, top: 250 }}><div style={{ background: "rgba(253,224,71,0.85)", padding: "6px 22px", transform: "rotate(-4deg)", fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 40, color: C.ink }}>your company's store</div></PopIn>
      <Sticky delay={f(1.4)} rot={-2} color={C.blue} style={{ position: "absolute", left: colX("left"), top: 1180 }}>🛒 online<br />shop</Sticky>
    </>
  ),
  tell: () => (
    <>
      <div style={{ position: "absolute", left: 60, right: 60, top: 300 }}>
        <PopIn from="down">
          <div style={{ background: "#fff", border: `4px solid ${C.ink}`, borderRadius: 30, padding: 34, boxShadow: "10px 12px 0 #111" }}>
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 28, color: C.mute }}>💬 brief for Mo</div>
            <div style={{ marginTop: 14, fontFamily: INTER, fontWeight: 900, fontSize: 52, color: C.ink, lineHeight: 1.2, minHeight: 260 }}>
              "<Typewriter text="Test the checkout process and find anything that doesn't work." delay={f(1.1)} cps={24} caretColor={C.red} />"
            </div>
          </div>
        </PopIn>
      </div>
      <Arrow x1={300} y1={1240} x2={500} y2={900} at={f(0.6)} />
      <Sticky delay={f(3.0)} rot={3} color={C.mint} size={40} w={460} style={{ position: "absolute", left: colX("right"), top: 1240 }}>✓ that's all<br />you type</Sticky>
    </>
  ),
  explore: () => {
    const frame = useCurrentFrame();
    const notes: [string, string, number, number, number][] = [["guest checkout", C.yellow, 0.3, 60, 860], ["coupon code", C.pink, 0.9, 560, 840], ["empty cart", C.blue, 1.5, 120, 980], ["mobile view", C.mint, 2.1, 600, 980]];
    return (
      <>
        <Shop mode="plain" top={290} scale={0.92} />
        {[[260, 480, 0], [700, 560, 7], [420, 700, 14]].map(([x, y, d], i) => (
          <div key={i} style={{ position: "absolute", left: x + Math.sin((frame + d) / 9) * 70, top: y + Math.cos((frame + d) / 11) * 50, fontSize: 56 }}>🖱️</div>
        ))}
        {notes.map(([t, c, s, x, y], i) => (
          <PopIn key={t} delay={f(s)} style={{ position: "absolute", left: x, top: y }}><div style={{ background: c, padding: "10px 20px", transform: `rotate(${i % 2 ? 3 : -3}deg)`, fontFamily: INTER, fontWeight: 800, fontSize: 34, color: C.ink, boxShadow: "0 10px 20px rgba(0,0,0,0.12)" }}>▶ {t}</div></PopIn>
        ))}
        <Sticky delay={f(3.0)} rot={-3} color={C.pink} size={44} w={460} style={{ position: "absolute", left: colX("left"), top: 1220 }}>🐞 2 problems<br />reported</Sticky>
      </>
    );
  },
  report: () => (
    <>
      <Taped top={290} h={560} rot={1.2} credit={`Real Mo bug report · ${MOMENTIC}`}>
        <OffthreadVideo src={staticFile("b/mo_hero.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.45)", transformOrigin: "30% 28%" }} />
      </Taped>
      <div style={{ position: "absolute", left: colX("left"), width: 500, top: 1110, display: "flex", flexDirection: "column", gap: 22 }}>
        {[["📸 screenshots", C.yellow, 0.5, -3], ["🎥 recordings", C.pink, 1.35, 2], ["🪜 steps to reproduce", C.mint, 2.05, -2]].map(([t, c, d, r]) => (
          <PopIn key={t as string} delay={f(d as number)} from="right"><div style={{ background: c as string, padding: "18px 24px", transform: `rotate(${r}deg)`, fontFamily: INTER, fontWeight: 900, fontSize: 42, color: C.ink, boxShadow: "0 12px 24px rgba(0,0,0,0.12)" }}>{t as string}</div></PopIn>
        ))}
      </div>
    </>
  ),
  vote: () => (
    <>
      <PopIn style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center" }}><div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 56, color: C.ink }}>comment one word 👇</div></PopIn>
      <Sticky delay={4} rot={-4} color={C.mint} size={96} w={440} style={{ position: "absolute", left: 70, top: 440 }}>🤖<br />AI</Sticky>
      <Sticky delay={9} rot={4} color={C.pink} size={96} w={440} style={{ position: "absolute", left: 570, top: 440 }}>🧑<br />HUMAN</Sticky>
    </>
  ),
  subscribe: () => (
    <>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn from="up"><SubscribeCard clickAt={f(1.1)} accent={C.red} sub="AI tools tested on real problems" avatarSrc="img/ch_BEp74aewRSA.jpg" /></PopIn>
      </div>
      <Cursor path={[[0, 900, 1000], [f(0.8), 560, 560], [f(1.6), 580, 570]]} clicks={[f(1.1)]} color="#111" />
      <Sticky delay={f(3.6)} rot={-3} size={44} w={480} style={{ position: "absolute", left: colX("right"), top: 1200 }}>what actually<br /><Highlight at={f(4.6)} color={C.mint}>works</Highlight> ✓</Sticky>
    </>
  ),
};

/* full-screen beats: overlays drawn on top of the full-frame footage */
const FullNote: Record<string, React.FC> = {
  interesting: () => (
    <div style={{ position: "absolute", top: 1380, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Sticky delay={f(1.0)} rot={-3} w={620} size={64}>this gets<br /><Highlight at={f(2.0)}>interesting</Highlight> 👀</Sticky>
    </div>
  ),
  broken: () => {
    const frame = useCurrentFrame();
    return (
      <div style={{ position: "absolute", top: 1380, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn delay={f(1.4)}>
          <div style={{ position: "relative", background: "#fff", padding: "24px 34px", transform: "rotate(-2deg)", fontFamily: INTER, fontWeight: 900, fontSize: 54, color: C.ink, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            "Something is broken."
            <div style={{ position: "absolute", left: 16, right: 16, top: "52%", height: 10, background: C.red, borderRadius: 5, transform: `rotate(-4deg) scaleX(${interpolate(frame, [f(2.6), f(2.9)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`, transformOrigin: "0 50%" }} />
          </div>
        </PopIn>
      </div>
    );
  },
  question: () => (
    <div style={{ position: "absolute", top: 1330, left: 60, right: 60 }}>
      <Sticky delay={4} rot={-2} w={960} size={58} color={C.yellow}>Would you trust <Highlight at={f(0.7)} color={C.mint}>AI</Highlight> to test your website before launch? 🤔</Sticky>
    </div>
  ),
};

type Scene = { a: number; b: number; side: Side; body?: React.FC; full?: string };
const SCENES: Scene[] = [
  { a: 0.0, b: 2.9, side: "right", body: S.hook },
  { a: 2.9, b: 4.3, side: "left", body: S.perfect },
  { a: 4.3, b: 7.2, side: "right", body: S.fail },
  { a: 7.2, b: 10.5, side: "full", full: "interesting" },
  { a: 10.5, b: 15.6, side: "right", body: S.intro },
  { a: 15.6, b: 19.6, side: "left", body: S.imagine },
  { a: 19.6, b: 23.5, side: "right", body: S.tell },
  { a: 23.5, b: 27.35, side: "left", body: S.explore },
  { a: 27.35, b: 30.85, side: "full", full: "broken" },
  { a: 30.85, b: 34.85, side: "left", body: S.report },
  { a: 34.85, b: 37.65, side: "full", full: "question" },
  { a: 37.65, b: 38.95, side: "left", body: S.vote },
  { a: 38.95, b: END, side: "right", body: S.subscribe },
];

/* presenter: full uncropped frame, slides between sides / full screen */
const Presenter: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let i = SCENES.findIndex((s) => t >= s.a && t < s.b);
  if (i < 0) i = SCENES.length - 1;
  const cur = boxFor(SCENES[i].side), prev = boxFor(SCENES[Math.max(0, i - 1)].side);
  const p = i === 0 ? 1 : interpolate(frame, [f(SCENES[i].a) - 3, f(SCENES[i].a) + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const L = (k: "x" | "y" | "w" | "h" | "r") => prev[k] + (cur[k] - prev[k]) * p;
  const box = { x: L("x"), y: L("y"), w: L("w"), h: L("h"), r: L("r") };
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.r, overflow: "hidden", boxShadow: "0 24px 50px rgba(0,0,0,0.25)", border: box.r > 0 ? "6px solid #fff" : undefined, transform: box.r > 0 ? `rotate(${SCENES[i].side === "left" ? -1.5 : 1.5}deg)` : undefined }}>
      <Aroll data={D} src="r/r6f_aroll.mp4" box={{ x: 0, y: 0, w: box.w, h: box.h }} focusY={960} zoom={1} alternate={false} />
    </div>
  );
};

const chunks = chunkWords(D.words, 3, 18);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const full = SCENES.some((s) => s.full && t >= s.a && t < s.b);
  return (
    <div style={{ position: "absolute", top: full ? 180 : 120, left: 40, right: 40, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 16px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const hot = /^(Mo|Momentic|bugs|broken|checkout|fails|AI|human|recordings|screenshots|perfect)/i.test(w.w);
        return (
          <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 80, letterSpacing: -2, color: full ? (on ? "#fff" : "rgba(255,255,255,0.45)") : on ? C.ink : "rgba(17,24,39,0.25)", textShadow: full ? "0 4px 18px rgba(0,0,0,0.8)" : undefined, position: "relative" }}>
            {on && hot && <span style={{ position: "absolute", left: -6, right: -6, top: "45%", bottom: "6%", background: /broken|fails|bugs/i.test(w.w) ? "rgba(225,29,72,0.45)" : "rgba(253,224,71,0.9)", zIndex: -1, transform: "rotate(-1deg)" }} />}
            <span style={{ position: "relative" }}>{w.w.replace(/[,.?]$/, "")}</span>
          </span>
        );
      })}
    </div>
  );
};

export const Reel6B: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "swish", 0.3], [0.45, "pop", 0.3], [0.9, "pop", 0.3], [1.3, "pop", 0.3], [1.75, "pop", 0.3], [2.1, "pop", 0.35], [2.9, "swish", 0.3], [3.0, "ding", 0.25],
    [4.3, "swish", 0.3], [5.0, "click", 0.6], [5.55, "click", 0.6], [6.3, "impact", 0.45], [6.3, "glitch", 0.4], [7.2, "whoosh", 0.3], [8.2, "pop"],
    [10.5, "swish", 0.3], [11.0, "pop"], [13.3, "pop"], [13.4, "swish", 0.3], [15.6, "swish", 0.3], [16.2, "pop"], [17.0, "pop"],
    [19.6, "swish", 0.3], [20.2, "swish", 0.3], [20.7, "typing", 0.4], [22.6, "pop"], [23.5, "swish", 0.3], [23.8, "pop", 0.35], [24.4, "pop", 0.35], [25.0, "pop", 0.35], [25.6, "pop", 0.35], [26.5, "pop"],
    [27.35, "whoosh", 0.3], [28.75, "pop"], [29.95, "swish", 0.4], [30.85, "swish", 0.3], [31.35, "pop"], [32.2, "pop"], [32.9, "pop"],
    [34.85, "whoosh", 0.3], [35.0, "pop"], [37.65, "swish", 0.3], [37.8, "pop"], [37.95, "pop"], [38.95, "swish", 0.3], [40.05, "click", 0.6], [40.1, "notify", 0.35], [42.55, "pop"],
  ];
  return (
    <AbsoluteFill>
      <Paper />
      {SCENES.map((s, i) => s.body ? <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}><s.body /></Sequence> : null)}
      <Presenter />
      {SCENES.map((s, i) => s.full ? <Sequence key={`n${i}`} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}>{React.createElement(FullNote[s.full])}</Sequence> : null)}
      <Captions />
      <Audio src={staticFile("r/r6f_aroll.mp4")} />
      <Music src="r/r6_music.wav" total={END} base={0.11} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

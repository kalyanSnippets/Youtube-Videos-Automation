import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo, Easing } from "remotion";
import data from "../public/r/r5f_words.json";
import { Aroll, f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, SubscribeCard, Typewriter, chunkWords, activeChunk } from "./lib";

/* Reel 5 v2: "phone-in-hand" device style. Bright clean product-ad look.
   Vids screen recording plays inside a floating laptop that tilts and zooms into each click;
   the generated robot plays on phones; Kalyan sits in a large rounded card that grows to full screen. */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R5B_FRAMES = Math.ceil(END * FPS);

const C = { bg1: "#F8FAFC", bg2: "#E8F0FE", ink: "#0F172A", mute: "#64748B", blue: "#4285F4", red: "#EA4335", yellow: "#FBBC04", green: "#34A853", line: "#E2E8F0" };
const CARD = { x: 50, y: 1060, w: 980, h: 820, r: 44 };
const MINI = { x: 40, y: 960, w: 450, h: 800 }; // full 9:16 frame, shrunk
const REC = "Screen recording · Google Vids";
const GEN = "Made with Gemini Omni in Google Vids";
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

const Bg: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg1}, ${C.bg2})` }}>
      {[[C.blue, 120, 380], [C.red, 900, 300], [C.yellow, 160, 1000], [C.green, 940, 960]].map(([c, x, y], i) => (
        <div key={i} style={{ position: "absolute", left: (x as number) + Math.sin((frame + i * 40) / 50) * 40, top: (y as number) + Math.cos((frame + i * 30) / 60) * 30, width: 360, height: 360, borderRadius: 180, background: c as string, opacity: 0.13, filter: "blur(70px)" }} />
      ))}
    </AbsoluteFill>
  );
};

/* ---------- devices ---------- */
type Zoom = { at: number; z: number; ox: number; oy: number }; // at = local frame the zoom completes
const LW = 940, SW = 900, SH = Math.round(900 * 922 / 1920); // laptop screen keeps the recording's aspect
const Laptop: React.FC<{ at: number; rate?: number; top?: number; zooms?: Zoom[]; enter?: boolean; ring?: { x: number; y: number; from: number }; children?: React.ReactNode }> = ({ at, rate = 1, top = 380, zooms = [], enter = true, ring, children }) => {
  const frame = useCurrentFrame();
  const inP = enter ? interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp", easing: ease }) : 1;
  const tiltX = interpolate(inP, [0, 1], [28, 8]) - Math.sin(frame / 40) * 2;
  const tiltY = Math.sin(frame / 55) * 4;
  // current zoom: blend between keyframes
  let z = 1, ox = 0.5, oy = 0.5, prev = { z: 1, ox: 0.5, oy: 0.5, at: 0 };
  for (const k of zooms) {
    const start = prev.at, p = interpolate(frame, [start, k.at], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
    if (frame >= start) { z = prev.z + (k.z - prev.z) * p; ox = prev.ox + (k.ox - prev.ox) * p; oy = prev.oy + (k.oy - prev.oy) * p; }
    prev = { ...k, at: k.at + 10 };
  }
  const dx = (ox - 0.5) * SW, dy = (oy - 0.5) * SH;
  const mx = ((z - 1) * SW) / 2, my = ((z - 1) * SH) / 2;
  const tx = Math.max(-mx, Math.min(mx, -dx * z)), ty = Math.max(-my, Math.min(my, -dy * z));
  return (
    <div style={{ position: "absolute", left: (1080 - LW) / 2, top: top + interpolate(inP, [0, 1], [260, 0]), width: LW, opacity: inP, transform: `perspective(1600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`, transformOrigin: "50% 100%" }}>
      <div style={{ background: "#1F2937", borderRadius: 30, padding: 20, boxShadow: "0 50px 90px rgba(15,23,42,0.35)" }}>
        <div style={{ width: SW, height: SH, borderRadius: 12, overflow: "hidden", position: "relative", background: "#fff" }}>
          <div style={{ width: SW, height: SH, transform: `translate(${tx}px, ${ty}px) scale(${z})` }}>
            <OffthreadVideo src={staticFile("b/v_app.mp4")} muted startFrom={Math.round(at * FPS)} playbackRate={rate} style={{ width: "100%", height: "100%" }} />
          </div>
          {ring && frame >= ring.from && (
            <div style={{ position: "absolute", left: ring.x - 90, top: ring.y - 90, width: 180, height: 180, borderRadius: 90, border: `6px solid ${C.blue}`, transform: `scale(${interpolate(frame - ring.from, [0, 12], [0.4, 1.4], { extrapolateRight: "clamp" })})`, opacity: interpolate(frame - ring.from, [0, 14], [1, 0], { extrapolateRight: "clamp" }) }} />
          )}
          {children}
        </div>
      </div>
      <div style={{ width: LW + 80, marginLeft: -40, height: 26, background: "linear-gradient(#E5E7EB,#9CA3AF)", borderRadius: "0 0 26px 26px" }} />
    </div>
  );
};

const Phone: React.FC<{ at: number; w?: number; x: number; y: number; rot?: number; delay?: number; pos?: string; src?: string; tag?: string }> = ({ at, w = 380, x, y, rot = 0, delay = 0, pos = "50% 60%", src = "b/v_robot.mp4", tag }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const h = w * 2.05;
  return (
    <div style={{ position: "absolute", left: x, top: y + (1 - p) * 300, width: w, height: h, opacity: p, transform: `perspective(1400px) rotate(${rot}deg) rotateY(${Math.sin(frame / 35) * 8}deg)`, filter: "drop-shadow(0 40px 50px rgba(15,23,42,0.35))" }}>
      <div style={{ width: "100%", height: "100%", background: "#111827", borderRadius: w * 0.16, padding: w * 0.035 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: w * 0.13, overflow: "hidden", position: "relative", background: "#000" }}>
          {frame >= delay && <Sequence from={delay} layout="none"><OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(at * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: "scale(1.15)" }} /></Sequence>}
          {tag && <div style={{ position: "absolute", bottom: w * 0.07, left: 0, right: 0, textAlign: "center" }}><span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: w * 0.075, padding: "4px 12px", borderRadius: 99 }}>{tag}</span></div>}
          <div style={{ position: "absolute", top: w * 0.04, left: "50%", transform: "translateX(-50%)", width: w * 0.3, height: w * 0.08, borderRadius: 99, background: "#000" }} />
        </div>
      </div>
    </div>
  );
};

const Pill: React.FC<{ children: React.ReactNode; bg?: string; color?: string; delay?: number; top: number; size?: number }> = ({ children, bg = "#fff", color = C.ink, delay = 0, top, size = 44 }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <PopIn delay={delay}><div style={{ background: bg, color, fontFamily: INTER, fontWeight: 900, fontSize: size, padding: "14px 32px", borderRadius: 999, boxShadow: "0 16px 40px rgba(15,23,42,0.15)", border: bg === "#fff" ? `2px solid ${C.line}` : "none" }}>{children}</div></PopIn>
  </div>
);
const Credit: React.FC<{ text: string; top: number }> = ({ text, top }) => (
  <div style={{ position: "absolute", top, right: 60, fontFamily: INTER, fontWeight: 600, fontSize: 22, color: C.mute }}>{text}</div>
);
const GoogleWord: React.FC<{ size: number }> = ({ size }) => (
  <span style={{ fontFamily: INTER, fontWeight: 900, fontSize: size, letterSpacing: -2 }}>{"Google".split("").map((ch, i) => <span key={i} style={{ color: [C.blue, C.red, C.yellow, C.blue, C.green, C.red][i] }}>{ch}</span>)}</span>
);

/* ---------- scenes (local frames) ---------- */
const S = {
  hook: () => {
    const frame = useCurrentFrame();
    const strike = interpolate(frame, [f(2.55), f(2.85)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <>
        <Phone at={6} x={350} y={260} w={380} />
        <PopIn delay={f(1.3)} from="left" style={{ position: "absolute", left: 40, top: 520 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: "16px 24px", boxShadow: "0 16px 40px rgba(15,23,42,0.18)", fontFamily: INTER, fontWeight: 900, fontSize: 40, color: C.ink, transform: "rotate(-5deg)" }}>🎬 AI videos</div>
        </PopIn>
        <PopIn delay={f(2.1)} from="right" style={{ position: "absolute", right: 30, top: 760 }}>
          <div style={{ position: "relative", background: "#fff", borderRadius: 24, padding: "16px 24px", boxShadow: "0 16px 40px rgba(15,23,42,0.18)", fontFamily: INTER, fontWeight: 900, fontSize: 38, color: C.ink, transform: "rotate(4deg)" }}>
            💳 another subscription
            <div style={{ position: "absolute", left: 14, right: 14, top: "50%", height: 8, background: C.red, borderRadius: 4, transform: `scaleX(${strike})`, transformOrigin: "0 50%" }} />
          </div>
        </PopIn>
        <Credit text={GEN} top={1020} />
      </>
    );
  },
  launch: () => (
    <>
      <Laptop at={0.4} rate={0.5} top={420} />
      <div style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <PopIn delay={f(0.5)}><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 28, color: C.blue, letterSpacing: 4 }}>NEW MODEL</div></PopIn>
        <PopIn delay={f(0.55)}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 84, color: C.ink, letterSpacing: -3 }}>Gemini Omni <span style={{ background: `linear-gradient(90deg, ${C.blue}, ${C.red})`, WebkitBackgroundClip: "text", color: "transparent" }}>1.2 Flash</span></div></PopIn>
      </div>
      <Pill top={940} delay={f(2.8)}>inside <GoogleWord size={44} /> Vids</Pill>
    </>
  ),
  free: () => {
    const frame = useCurrentFrame();
    const stamp = interpolate(frame, [f(3.2), f(3.45)], [2.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <>
        <Phone at={6} x={50} y={300} w={300} rot={-8} delay={f(1.5)} tag="#1 robot city" />
        <Phone at={0.5} src="b/omni_fox.mp4" pos="50% 50%" x={390} y={260} w={300} delay={f(1.5) + 4} tag="#2 moon fox" />
        <Phone at={0.5} src="b/omni_island.mp4" pos="50% 50%" x={730} y={300} w={300} rot={8} delay={f(1.5) + 8} tag="#3 sky island" />
        <Credit text="All 3 made with Gemini Omni 1.2 Flash" top={1020} />
        <div style={{ position: "absolute", top: 925, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
          <PopIn delay={f(1.5)}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 70, color: C.ink }}>3 videos <span style={{ color: C.mute, fontWeight: 700 }}>/ month</span></div></PopIn>
          {frame >= f(3.2) && <div style={{ transform: `rotate(-8deg) scale(${stamp})`, background: C.green, color: "#fff", borderRadius: 18, padding: "6px 24px", fontFamily: INTER, fontWeight: 900, fontSize: 64 }}>FREE</div>}
        </div>
      </>
    );
  },
  tryit: () => (
    <>
      <Laptop at={1} rate={0.4} top={400} enter={false} zooms={[{ at: f(0.5), z: 2.2, ox: 0.2, oy: 0.52 }]} ring={{ x: 396, y: 216, from: f(1.0) }} />
      <Pill top={940} delay={f(0.2)} bg={C.blue} color="#fff">🔗 vids.new</Pill>
    </>
  ),
  option: () => (
    <>
      <Laptop at={5} top={400} enter={false} zooms={[{ at: 1, z: 1, ox: 0.5, oy: 0.5 }, { at: f(0.7), z: 1.9, ox: 0.72, oy: 0.45 }]} />
      <Pill top={940} delay={f(1.2)}>🎬 AI video clip</Pill>
    </>
  ),
  prompt: () => (
    <>
      <Laptop at={36} top={480} enter={false} zooms={[{ at: 1, z: 1.9, ox: 0.72, oy: 0.45 }, { at: f(0.8), z: 2.4, ox: 0.73, oy: 0.6 }]} />
      <div style={{ position: "absolute", left: 60, right: 60, top: 270 }}>
        <PopIn from="down">
          <div style={{ background: "#fff", borderRadius: 30, padding: "24px 30px", boxShadow: `0 0 0 4px ${C.blue}, 0 30px 60px rgba(15,23,42,0.2)` }}>
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 24, color: C.blue, marginBottom: 8 }}>✦ PROMPT</div>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, color: C.ink, lineHeight: 1.25, minHeight: 150 }}>
              <Typewriter text="A cinematic shot of a tiny robot walking through a futuristic city at night" delay={f(0.75)} cps={22} caretColor={C.blue} />
            </div>
          </div>
        </PopIn>
      </div>
    </>
  ),
  generate: () => {
    const frame = useCurrentFrame();
    const cut = f(1.0);
    return (
      <>
        {frame < cut ? (
          <Laptop at={54} rate={8} top={400} enter={false} zooms={[{ at: 1, z: 1.9, ox: 0.72, oy: 0.35 }]} />
        ) : (
          <Sequence from={cut} layout="none">
            <Phone at={16} x={340} y={230} w={400} />
          </Sequence>
        )}
        <PopIn delay={f(2.1)} style={{ position: "absolute", left: 30, top: 640 }}>
          <div style={{ background: "#fff", borderRadius: 26, padding: "14px 26px", boxShadow: "0 16px 40px rgba(15,23,42,0.18)", fontFamily: INTER, fontWeight: 900, fontSize: 52, color: C.ink, transform: "rotate(-4deg)" }}>
            ⏱ up to <span style={{ color: C.blue }}>{Math.round(interpolate(frame, [f(2.1), f(2.7)], [1, 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))}s</span>
          </div>
        </PopIn>
        {frame >= cut && <Credit text={GEN} top={1020} />}
      </>
    );
  },
  reference: () => (
    <>
      <Laptop at={9} top={400} zooms={[{ at: f(0.6), z: 2.1, ox: 0.78, oy: 0.8 }]} ring={{ x: 509, y: 251, from: f(1.0) }} />
      <Pill top={940} delay={f(0.9)} bg={C.blue} color="#fff">🖼 reference images</Pill>
    </>
  ),
  question: () => (
    <>
      <Phone at={27} x={50} y={280} w={330} rot={-6} />
      <div style={{ position: "absolute", left: 420, right: 50, top: 400, display: "flex", flexDirection: "column", gap: 20 }}>
        <PopIn delay={f(0.6)}><div style={{ alignSelf: "flex-start", background: C.green, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 40, padding: "10px 24px", borderRadius: 999, display: "inline-block" }}>3 free videos</div></PopIn>
        <PopIn delay={f(2.1)}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 88, color: C.ink, lineHeight: 1.0, letterSpacing: -3 }}>What would <span style={{ color: C.blue }}>you</span> create?</div></PopIn>
      </div>
    </>
  ),
  comment: () => (
    <div style={{ position: "absolute", left: 70, right: 70, top: 380 }}>
      <PopIn from="up">
        <div style={{ background: "#fff", borderRadius: 34, padding: 32, boxShadow: "0 30px 60px rgba(15,23,42,0.18)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${C.blue}, ${C.green})` }} />
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 34, color: C.ink }}>you · just now</div>
          </div>
          <div style={{ marginTop: 18, fontFamily: INTER, fontWeight: 700, fontSize: 46, color: C.ink, minHeight: 120 }}>
            <Typewriter text="A dragon surfing a giant wave at sunset 🌊" delay={6} cps={24} caretColor={C.blue} />
          </div>
        </div>
      </PopIn>
    </div>
  ),
  like: () => {
    const frame = useCurrentFrame();
    const hs = interpolate(frame, [4, 10, 16], [0.6, 1.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        <div style={{ width: 240, height: 240, borderRadius: 120, background: frame >= 4 ? C.red : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 140, color: "#fff", transform: `scale(${hs})`, boxShadow: "0 20px 50px rgba(234,67,53,0.35)" }}>♥</div>
        <PopIn delay={f(1.6)}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, color: C.ink, textAlign: "center", letterSpacing: -2 }}>Love free AI tools?</div></PopIn>
      </div>
    );
  },
  finale: () => {
    const frame = useCurrentFrame();
    const like = f(32.9 - 31.1), sub = f(36.4 - 31.1), click = f(37.3 - 31.1);
    const hs = interpolate(frame, [like + 4, like + 10, like + 16], [0.6, 1.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <>
        <PopIn from="up" style={{ position: "absolute", left: 30, right: 30, top: 250 }}>
          <div style={{ borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 80px rgba(15,23,42,0.35)", border: "6px solid #fff", height: 574, position: "relative", background: "#000" }}>
            <OffthreadVideo src={staticFile("b/v_robot.mp4")} muted startFrom={Math.round(6 * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.12)" }} />
            <div style={{ position: "absolute", left: 18, top: 16, background: "rgba(0,0,0,0.6)", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 26, padding: "6px 14px", borderRadius: 99 }}>▶ The full AI video</div>
          </div>
        </PopIn>
        <div style={{ position: "absolute", top: 846, right: 50, fontFamily: INTER, fontWeight: 600, fontSize: 22, color: C.mute }}>{GEN} · unedited</div>
        <div style={{ position: "absolute", left: 520, right: 36, top: 960, display: "flex", flexDirection: "column", gap: 22 }}>
          <PopIn from="right">
            <div style={{ background: "#fff", borderRadius: 26, padding: "18px 22px", boxShadow: "0 16px 40px rgba(15,23,42,0.15)", opacity: frame >= like ? 0.75 : 1 }}>
              <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 28, color: C.mute }}>💬 drop your idea</div>
              <div style={{ marginTop: 8, fontFamily: INTER, fontWeight: 800, fontSize: 32, color: C.ink, minHeight: 84 }}><Typewriter text="A dragon surfing a giant wave 🌊" delay={6} cps={22} caretColor={C.blue} /></div>
            </div>
          </PopIn>
          {frame >= like && (
            <PopIn from="right">
              <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#fff", borderRadius: 26, padding: "16px 22px", boxShadow: "0 16px 40px rgba(15,23,42,0.15)", opacity: frame >= sub ? 0.75 : 1 }}>
                <div style={{ width: 84, height: 84, borderRadius: 42, background: C.red, color: "#fff", fontSize: 50, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${hs})` }}>♥</div>
                <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 34, color: C.ink, lineHeight: 1.1 }}>Love free<br />AI tools?</div>
              </div>
            </PopIn>
          )}
          {frame >= sub && (
            <PopIn from="right">
              <div style={{ width: 524, height: 160, transform: "scale(0.6)", transformOrigin: "0 0" }}><SubscribeCard clickAt={click} accent={C.red} sub="Useful AI tutorials" avatarSrc="img/ch_BEp74aewRSA.jpg" /></div>
            </PopIn>
          )}
        </div>
      </>
    );
  },
  subscribe: () => (
    <div style={{ position: "absolute", top: 380, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <PopIn from="up"><SubscribeCard clickAt={f(0.9)} accent={C.red} sub="Useful AI tutorials" avatarSrc="img/ch_BEp74aewRSA.jpg" /></PopIn>
    </div>
  ),
};

/* presenter: card at the bottom, or full screen */
type Scene = { a: number; b: number; body?: React.FC; full?: boolean };
const SCENES: Scene[] = [
  { a: 0.0, b: 3.45, body: S.hook },
  { a: 3.45, b: 5.35, full: true },
  { a: 5.35, b: 8.8, body: S.launch },
  { a: 8.8, b: 12.85, body: S.free },
  { a: 12.85, b: 14.4, body: S.tryit },
  { a: 14.4, b: 17.5, body: S.option },
  { a: 17.5, b: 22.0, body: S.prompt },
  { a: 22.0, b: 25.3, body: S.generate },
  { a: 25.3, b: 27.9, body: S.reference },
  { a: 27.9, b: 31.1, body: S.question },
  { a: 31.1, b: END, body: S.finale },
];
const FULL_AT = SCENES.filter((s) => s.full);
const isFull = (t: number) => FULL_AT.some((s) => t >= s.a && t < s.b);

/* presenter card morphs between bottom card and full screen */
const Presenter: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const p = FULL_AT.reduce((acc, s) => Math.max(acc, interpolate(frame, [f(s.a) - 6, f(s.a) + 4, f(s.b) - 4, f(s.b) + 6], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease })), 0);
  const m = interpolate(frame, [f(31.1) - 4, f(31.1) + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const base = { x: CARD.x + (MINI.x - CARD.x) * m, y: CARD.y + (MINI.y - CARD.y) * m, w: CARD.w + (MINI.w - CARD.w) * m, h: CARD.h + (MINI.h - CARD.h) * m, r: CARD.r };
  const box = { x: base.x * (1 - p), y: base.y * (1 - p), w: base.w + (1080 - base.w) * p, h: base.h + (1920 - base.h) * p, r: base.r * (1 - p) };
  const focus = 805 + (860 - 805) * p;
  return (
    <>
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.r, boxShadow: "0 30px 70px rgba(15,23,42,0.3)", overflow: "hidden" }}>
        <Aroll data={D} src="r/r5f_aroll.mp4" box={{ x: 0, y: 0, w: box.w, h: box.h }} focusY={focus} zoom={1 + 0.25 * p} alternate={false} />
      </div>
      {isFull(t) && (
        <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <PopIn delay={f(3.6)}><div style={{ background: "#fff", borderRadius: 999, padding: "16px 40px", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}><GoogleWord size={72} /> <span style={{ fontSize: 64 }}>👀</span></div></PopIn>
        </div>
      )}
    </>
  );
};

const chunks = chunkWords(D.words, 3, 18);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const full = isFull(t);
  return (
    <div style={{ position: "absolute", top: full ? 1480 : 120, left: 40, right: 40, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 10px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
        const hot = /^(Vids|Omni|Flash|free|3|three|15|Gemini|Google)/i.test(w.w);
        return (
          <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 78, letterSpacing: -2, padding: "0 14px", borderRadius: 18, background: now ? (hot ? C.blue : C.ink) : "transparent", color: now ? "#fff" : full ? "#fff" : on ? C.ink : "rgba(15,23,42,0.3)", textShadow: full && !now ? "0 4px 18px rgba(0,0,0,0.8)" : undefined }}>
            {w.w.replace(/[,.?]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

export const Reel5B: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "whoosh", 0.35], [1.3, "pop"], [2.1, "pop"], [2.55, "swish", 0.35], [3.4, "whoosh", 0.3], [5.35, "whoosh", 0.35], [5.9, "pop", 0.4], [8.2, "pop", 0.4],
    [8.8, "swish", 0.3], [10.3, "pop"], [10.43, "pop"], [10.56, "pop"], [12.0, "impact", 0.35], [12.85, "whoosh", 0.3], [13.85, "click", 0.6],
    [14.4, "whoosh", 0.3], [17.5, "swish", 0.3], [18.25, "typing", 0.4], [22.0, "whoosh", 0.3], [23.0, "impact", 0.4], [24.1, "ding", 0.25],
    [25.3, "whoosh", 0.3], [26.3, "click", 0.5], [27.9, "swish", 0.3], [30.0, "pop"], [31.1, "pop"], [31.3, "typing", 0.35], [32.9, "swish", 0.3], [33.05, "pop", 0.6],
    [36.4, "whoosh", 0.3], [37.3, "click", 0.6], [37.36, "notify", 0.35],
  ];
  return (
    <AbsoluteFill>
      <Bg />
      {SCENES.map((s, i) => s.body ? (
        <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}><s.body /></Sequence>
      ) : null)}
      <Presenter />
      <Captions />
      <Audio src={staticFile("r/r5f_aroll.mp4")} />
      <Music src="r/r5b_music.wav" total={END} base={0.12} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

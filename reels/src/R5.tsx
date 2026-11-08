import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo } from "remotion";
import data from "../public/r/r5f_words.json";
import { Aroll, Cursor, f, FPS, GridBg, INTER, MONO, SERIF, Music, PopIn, ReelData, Sfx, SubscribeCard, Typewriter, Flash, chunkWords, activeChunk } from "./lib";

/* Reel 5: Gemini Omni 1.2 Flash in Google Vids. Cinematic neon style, 60% screen / 40% Kalyan. */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R5_FRAMES = Math.ceil(END * FPS);

const C = { dark: "#070B14", line: "rgba(34,211,238,0.06)", cyan: "#22D3EE", pink: "#E879F9", blue: "#4285F4", green: "#34A853", yellow: "#FBBC04", red: "#EA4335", ink: "#111827", mute: "#94A3B8" };
const VY = 300, VH = 608;
const FACE_Y = 1152;
const REC = "Screen recording · Google Vids (Gemini Omni)";
const GEN = "Generated in Google Vids with Gemini Omni";

/* video window on a blurred copy of itself */
const Win: React.FC<{ src: string; at?: number; rate?: number; zoom?: number; origin?: string; pos?: string; h?: number; top?: number; credit?: string; label?: string; dim?: number; push?: number; children?: React.ReactNode }> = ({ src, at = 0, rate = 1, zoom = 1, origin = "50% 50%", pos = "50% 50%", h = VH, top = VY, credit, label, dim = 1, push = 0.05, children }) => {
  const frame = useCurrentFrame();
  const z = zoom * (1 + interpolate(frame, [0, 150], [0, push], { extrapolateRight: "clamp" }));
  const v = (st: React.CSSProperties) => <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(at * FPS)} playbackRate={rate} style={st} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: "blur(40px) brightness(0.35)", transform: "scale(1.2)" }}>{v({ width: "100%", height: "100%", objectFit: "cover" })}</AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top, width: 1080, height: h, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ width: "100%", height: "100%", transform: `scale(${z})`, transformOrigin: origin, filter: `brightness(${dim})` }}>{v({ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos })}</div>
        {children}
      </div>
      {label && <div style={{ position: "absolute", left: 24, top: top + 20, background: "rgba(0,0,0,0.72)", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 30, padding: "8px 16px", borderRadius: 12 }}>{label}</div>}
      {credit && <div style={{ position: "absolute", right: 20, top: top + h + 8, fontFamily: INTER, fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{credit}</div>}
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ children: React.ReactNode; bg?: string; delay?: number; top?: number; color?: string; size?: number }> = ({ children, bg = C.cyan, delay = 0, top = VY + VH + 60, color = "#06121f", size = 46 }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <PopIn delay={delay}><div style={{ background: bg, color, fontFamily: INTER, fontWeight: 900, fontSize: size, padding: "14px 30px", borderRadius: 999, boxShadow: `0 0 40px ${bg}66` }}>{children}</div></PopIn>
  </div>
);

const Neon: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.cyan, size = 120 }) => (
  <div style={{ fontFamily: INTER, fontWeight: 900, fontStyle: "italic", fontSize: size, color: "#fff", letterSpacing: -3, lineHeight: 1, textShadow: `0 0 18px ${color}, 0 0 50px ${color}, 0 6px 0 rgba(0,0,0,0.4)` }}>{children}</div>
);

/* scenes (local frames; times are seconds relative to scene start) */
const S = {
  hook: () => {
    const frame = useCurrentFrame();
    const strike = interpolate(frame, [f(2.55), f(2.85)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <>
        <Win src="b/v_robot.mp4" at={6} zoom={1.25} origin="50% 80%" credit={GEN} push={0.12} />
        <div style={{ position: "absolute", top: VY + VH + 50, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <PopIn delay={f(1.5)}>
            <div style={{ position: "relative", background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 22, padding: "14px 30px", fontFamily: INTER, fontWeight: 900, fontSize: 48, color: "#fff" }}>
              💳 another AI subscription
              <div style={{ position: "absolute", left: 16, top: "50%", height: 10, width: `${strike * 94}%`, background: C.red, borderRadius: 5, transform: "rotate(-3deg)" }} />
            </div>
          </PopIn>
        </div>
      </>
    );
  },
  interesting: () => (
    <AbsoluteFill>
      <Aroll data={D} src="r/r5f_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={860} zoom={1.35} alternate={false} offset={f(3.45)} />
      <Flash dur={5} />
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn delay={4}>
          <div style={{ background: "#fff", borderRadius: 999, padding: "16px 40px", fontFamily: INTER, fontWeight: 900, fontSize: 72, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            {"Google".split("").map((ch, i) => <span key={i} style={{ color: [C.blue, C.red, C.yellow, C.blue, C.green, C.red][i] }}>{ch}</span>)} 👀
          </div>
        </PopIn>
      </div>
    </AbsoluteFill>
  ),
  launch: () => (
    <>
      <Win src="b/v_app.mp4" at={0.4} rate={0.5} dim={0.45} label="Google Vids" credit={REC}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <PopIn delay={f(0.5)}><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 34, color: C.cyan, letterSpacing: 6 }}>✦ NEW MODEL</div></PopIn>
          <PopIn delay={f(0.55)}><Neon size={112}>Gemini Omni</Neon></PopIn>
          <PopIn delay={f(1.6)}><Neon size={112} color={C.pink}>1.2 Flash</Neon></PopIn>
        </div>
      </Win>
      <Chip delay={f(2.8)} bg="#fff" color={C.ink}>📍 inside Google Vids</Chip>
    </>
  ),
  free: () => {
    const frame = useCurrentFrame();
    const n = frame >= f(1.5) ? 3 : 0;
    const stamp = interpolate(frame, [f(3.2), f(3.45)], [2.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <AbsoluteFill>
        <GridBg bg={C.dark} line={C.line} glow="rgba(34,211,238,0.18)" />
        <div style={{ position: "absolute", top: VY + 10, left: 40, right: 40, display: "flex", justifyContent: "center", gap: 24 }}>
          {[6, 11, 18].map((at, i) => (
            <PopIn key={i} delay={f(1.5) + i * 4} from="up">
              <div style={{ width: 300, height: 400, borderRadius: 26, overflow: "hidden", border: `4px solid ${[C.cyan, C.pink, C.yellow][i]}`, boxShadow: `0 0 40px ${[C.cyan, C.pink, C.yellow][i]}88`, position: "relative", transform: `rotate(${(i - 1) * 4}deg)` }}>
                <OffthreadVideo src={staticFile("b/v_robot.mp4")} muted startFrom={Math.round(at * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)", transformOrigin: "50% 80%" }} />
                <div style={{ position: "absolute", left: 14, top: 12, fontFamily: MONO, fontWeight: 800, fontSize: 34, color: "#fff", textShadow: "0 2px 8px #000" }}>#{i + 1}</div>
              </div>
            </PopIn>
          ))}
        </div>
        <div style={{ position: "absolute", top: VY + 470, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, color: "#fff" }}>{n} AI videos <span style={{ color: C.mute, fontWeight: 700 }}>/ month</span></div>
          {frame >= f(3.2) && (
            <div style={{ transform: `rotate(-10deg) scale(${stamp})`, border: `8px solid ${C.green}`, color: C.green, borderRadius: 18, padding: "4px 22px", fontFamily: INTER, fontWeight: 900, fontSize: 72, background: "rgba(52,168,83,0.12)" }}>FREE</div>
          )}
        </div>
      </AbsoluteFill>
    );
  },
  tryit: () => (
    <>
      <Win src="b/v_app.mp4" at={1} rate={0.4} zoom={1.7} origin="21% 51%" push={0.03} credit={REC} />
      <Cursor path={[[0, 760, 880], [f(0.8), 178, 640], [f(1.5), 180, 642]]} clicks={[f(0.9)]} color="#fff" />
      <Chip delay={f(0.25)}>👉 vids.new</Chip>
    </>
  ),
  option: () => (
    <>
      <Win src="b/v_panel.mp4" at={5} pos="50% 85%" label="AI video clip" credit={REC} />
      <Chip delay={f(1.2)} bg="#fff" color={C.ink}>🎬 AI video creation</Chip>
      <Chip delay={f(2.0)} top={VY + VH + 150}>✍️ describe what you want</Chip>
    </>
  ),
  prompt: () => (
    <>
      <Win src="b/v_panel.mp4" at={36} pos="50% 85%" dim={0.3} credit={REC}>
        <div style={{ position: "absolute", left: 50, right: 50, top: 80 }}>
          <PopIn>
            <div style={{ background: "#fff", borderRadius: 28, padding: "26px 32px", boxShadow: `0 0 0 5px ${C.blue}, 0 30px 70px rgba(0,0,0,0.6)` }}>
              <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 26, color: C.blue, marginBottom: 10 }}>✦ PROMPT</div>
              <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 46, color: C.ink, lineHeight: 1.25, minHeight: 230 }}>
                <Typewriter text="A cinematic shot of a tiny robot walking through a futuristic city at night" delay={f(0.75)} cps={22} caretColor={C.blue} />
              </div>
            </div>
          </PopIn>
        </div>
      </Win>
      <Chip delay={f(2.1)} bg={C.pink} color="#fff" top={VY + VH + 60}>🤖 tiny robot · 🌃 neon city</Chip>
    </>
  ),
  generate: () => {
    const frame = useCurrentFrame();
    const cut = f(1.0);
    return (
      <>
        {frame < cut ? (
          <Win src="b/v_panel.mp4" at={54} rate={8} pos="50% 0%" label="Generating…" credit={REC} />
        ) : (
          <Sequence from={cut} layout="none">
            <Win src="b/v_robot.mp4" at={16} zoom={1.25} origin="50% 80%" push={0.1} credit={GEN} />
            <Flash dur={6} />
          </Sequence>
        )}
        <div style={{ position: "absolute", top: VY + VH + 50, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
          <PopIn delay={f(2.1)}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, background: "rgba(255,255,255,0.08)", border: `3px solid ${C.cyan}`, borderRadius: 24, padding: "10px 30px" }}>
              <div style={{ fontSize: 60 }}>⏱</div>
              <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 60, color: "#fff" }}>up to <span style={{ color: C.cyan }}>{Math.round(interpolate(frame, [f(2.1), f(2.7)], [1, 15], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))}</span> sec</div>
            </div>
          </PopIn>
        </div>
      </>
    );
  },
  reference: () => (
    <>
      <Win src="b/v_panel.mp4" at={9} pos="50% 92%" zoom={1.35} origin="50% 70%" credit={REC} />
      <Chip delay={f(0.9)} bg="#fff" color={C.ink}>🖼 + reference images</Chip>
      <Chip delay={f(1.9)} top={VY + VH + 150}>🎯 guide the result</Chip>
    </>
  ),
  question: () => {
    const frame = useCurrentFrame();
    return (
      <>
        <Win src="b/v_robot.mp4" at={27} zoom={1.15} origin="50% 70%" h={820} top={250} dim={0.6} push={0.1} credit={GEN}>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <PopIn delay={f(0.6)}><div style={{ background: C.green, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 46, padding: "10px 28px", borderRadius: 999 }}>3 free AI videos</div></PopIn>
            {frame >= f(2.1) && <PopIn><div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 104, color: "#fff", textAlign: "center", lineHeight: 1.05, textShadow: "0 6px 30px #000" }}>What would<br /><span style={{ color: C.cyan }}>YOU</span> create?</div></PopIn>}
          </div>
        </Win>
      </>
    );
  },
  comment: () => (
    <AbsoluteFill>
      <GridBg bg={C.dark} line={C.line} glow="rgba(232,121,249,0.2)" />
      <div style={{ position: "absolute", top: VY - 10, left: 70, right: 70 }}>
        <PopIn from="up">
          <div style={{ background: "#fff", borderRadius: 34, padding: 32, boxShadow: "0 30px 70px rgba(0,0,0,0.45)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: INTER, fontWeight: 800, fontSize: 40, color: C.ink }}>💬 Drop your idea 👇</div>
            <div style={{ marginTop: 18, border: "3px solid #e5e7eb", borderRadius: 20, padding: "18px 24px", fontFamily: INTER, fontWeight: 700, fontSize: 44, color: "#374151", minHeight: 120 }}>
              <Typewriter text="A dragon surfing a giant wave at sunset 🌊" delay={6} cps={24} caretColor={C.pink} />
            </div>
          </div>
        </PopIn>
      </div>
    </AbsoluteFill>
  ),
  like: () => {
    const frame = useCurrentFrame();
    const hs = interpolate(frame, [4, 10, 16], [0.6, 1.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <AbsoluteFill>
        <GridBg bg={C.dark} line={C.line} glow="rgba(234,67,53,0.2)" />
        <div style={{ position: "absolute", top: VY + 30, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <div style={{ width: 260, height: 260, borderRadius: 130, background: frame >= 4 ? C.red : "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 150, color: "#fff", transform: `scale(${hs})` }}>♥</div>
          <PopIn delay={f(1.6)}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 58, color: "#fff", textAlign: "center" }}>Love finding<br /><span style={{ color: C.cyan }}>free AI tools?</span></div></PopIn>
        </div>
      </AbsoluteFill>
    );
  },
  subscribe: () => (
    <AbsoluteFill>
      <GridBg bg={C.dark} line={C.line} glow="rgba(34,211,238,0.22)" />
      <div style={{ position: "absolute", top: VY, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn from="up"><SubscribeCard clickAt={f(0.9)} dark accent={C.red} sub="Useful AI tutorials" avatarSrc="img/ch_BEp74aewRSA.jpg" /></PopIn>
      </div>
      <Cursor path={[[0, 900, 1250], [f(0.7), 560, 860], [f(1.4), 580, 870]]} clicks={[f(0.9)]} color="#fff" />
    </AbsoluteFill>
  ),
};

type Scene = { a: number; b: number; body: React.FC; face?: boolean };
const SCENES: Scene[] = [
  { a: 0.0, b: 3.45, body: S.hook, face: true },
  { a: 3.45, b: 5.35, body: S.interesting },
  { a: 5.35, b: 8.8, body: S.launch, face: true },
  { a: 8.8, b: 12.85, body: S.free, face: true },
  { a: 12.85, b: 14.4, body: S.tryit, face: true },
  { a: 14.4, b: 17.5, body: S.option, face: true },
  { a: 17.5, b: 22.0, body: S.prompt, face: true },
  { a: 22.0, b: 25.3, body: S.generate, face: true },
  { a: 25.3, b: 27.9, body: S.reference, face: true },
  { a: 27.9, b: 31.1, body: S.question, face: true },
  { a: 31.1, b: 32.9, body: S.comment, face: true },
  { a: 32.9, b: 36.4, body: S.like, face: true },
  { a: 36.4, b: END, body: S.subscribe, face: true },
];

const chunks = chunkWords(D.words, 3, 18);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", top: 140, left: 40, right: 40, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const hot = /^(Vids|Omni|Flash|free|3|three|15|Gemini|robot)/i.test(w.w);
        return (
          <span key={i} style={{ fontFamily: INTER, fontStyle: "italic", fontWeight: 900, fontSize: 88, letterSpacing: -2, color: on ? (hot ? C.cyan : "#fff") : "rgba(255,255,255,0.4)", textShadow: on && hot ? `0 0 24px ${C.cyan}, 0 4px 18px rgba(0,0,0,0.85)` : "0 4px 18px rgba(0,0,0,0.85)" }}>
            {w.w.replace(/[,.?]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

export const Reel5: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "impact", 0.45], [1.5, "pop"], [2.55, "swish", 0.35], [3.45, "impact", 0.45], [5.35, "riser", 0.3], [5.9, "glitch", 0.3], [7.0, "pop", 0.4],
    [8.2, "pop", 0.4], [8.8, "whoosh", 0.3], [10.3, "pop"], [10.43, "pop"], [10.56, "pop"], [12.0, "impact", 0.4], [12.85, "whoosh", 0.3], [13.75, "click", 0.6],
    [14.4, "swish", 0.3], [17.5, "whoosh", 0.3], [18.25, "typing", 0.4], [22.0, "swish", 0.3], [23.0, "impact", 0.5], [24.1, "ding", 0.25],
    [25.3, "whoosh", 0.3], [26.2, "pop"], [27.9, "riser", 0.3], [30.0, "impact", 0.4], [31.1, "pop"], [31.3, "typing", 0.35], [32.9, "whoosh", 0.3], [33.05, "pop", 0.6],
    [36.4, "whoosh", 0.3], [37.3, "click", 0.6], [37.36, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: C.dark }}>
      {SCENES.map((s, i) => {
        const from = f(s.a);
        const Body = s.body;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, f(s.b) - from)}>
            <Body />
            {s.face && (
              <>
                <Aroll data={D} src="r/r5f_aroll.mp4" box={{ x: 0, y: FACE_Y, w: 1080, h: 1920 - FACE_Y }} focusY={820} zoom={1.0} offset={from} />
                <div style={{ position: "absolute", left: 0, right: 0, top: FACE_Y - 3, height: 6, background: `linear-gradient(90deg, ${C.cyan}, ${C.pink})`, boxShadow: `0 0 20px ${C.cyan}` }} />
              </>
            )}
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("r/r5f_aroll.mp4")} />
      <Music src="r/r5_music.wav" total={END} base={0.12} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, Easing, OffthreadVideo } from "remotion";
import data from "../public/r/r4f_words.json";
import {
  Aroll, Cursor, f, FPS, GridBg, INTER, MONO, SERIF, Music, Pic, PopIn, ReelData, Sfx, SubscribeCard, Typewriter, Credit,
  Flash, chunkWords, activeChunk,
} from "./lib";

/* Reel 4 v2: GPT-6.1 Terra. Every visual matches the line being spoken; Kalyan in a circle bubble at the bottom. */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R4_FRAMES = Math.ceil(END * FPS);

const C = { dark: "#0D1117", line: "rgba(255,255,255,0.06)", purple: "#7C3AED", lilac: "#C4B5FD", amber: "#F59E0B", mint: "#10B981", red: "#EF4444", ink: "#111827", mute: "#9CA3AF" };
const SINTEL = "Sintel © Blender Foundation · CC BY 3.0 (stand-in film)";
const OAI = "Clip: OpenAI · GPT-6.1 Terra launch";
const VY = 470, VH = 608; // 16:9 visual window

/* 16:9 window on a blurred copy of itself. zoom/origin let us frame the useful part. */
const Win: React.FC<{ src: string; at?: number; rate?: number; zoom?: number; origin?: string; credit?: string; label?: string; children?: React.ReactNode; dim?: number }> = ({ src, at = 0, rate = 1, zoom = 1, origin = "50% 50%", credit, label, children, dim = 1 }) => {
  const frame = useCurrentFrame();
  const z = zoom * (1 + interpolate(frame, [0, 150], [0, 0.05], { extrapolateRight: "clamp" }));
  const v = (st: React.CSSProperties) => <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(at * FPS)} playbackRate={rate} style={st} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: "blur(40px) brightness(0.4)", transform: "scale(1.2)" }}>{v({ width: "100%", height: "100%", objectFit: "cover" })}</AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: VY, width: 1080, height: VH, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ width: "100%", height: "100%", transform: `scale(${z})`, transformOrigin: origin, filter: `brightness(${dim})` }}>{v({ width: "100%", height: "100%", objectFit: "cover" })}</div>
        {children}
      </div>
      {label && <div style={{ position: "absolute", left: 24, top: VY + 20, background: "rgba(0,0,0,0.72)", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 30, padding: "8px 16px", borderRadius: 12 }}>{label}</div>}
      {credit && <div style={{ position: "absolute", right: 20, top: VY + VH + 10, fontFamily: INTER, fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{credit}</div>}
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ children: React.ReactNode; bg?: string; delay?: number; top?: number; color?: string }> = ({ children, bg = C.purple, delay = 0, top = VY + VH + 60, color = "#fff" }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <PopIn delay={delay}><div style={{ background: bg, color, fontFamily: INTER, fontWeight: 900, fontSize: 46, padding: "14px 30px", borderRadius: 999 }}>{children}</div></PopIn>
  </div>
);

/* Timeline strip under the player with a playhead and red markers. */
const Timeline: React.FC<{ sweep: [number, number]; marks?: { at: number; x: number }[]; top?: number }> = ({ sweep, marks = [], top = VY + VH + 40 }) => {
  const frame = useCurrentFrame();
  const head = interpolate(frame, sweep, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top, height: 90, borderRadius: 14, background: "repeating-linear-gradient(90deg,#2d333b 0 70px,#22272e 70px 75px)", border: "2px solid #30363d" }}>
      {marks.map((m, i) => frame >= m.at ? (
        <div key={i} style={{ position: "absolute", left: `${m.x * 100}%`, top: -20, transform: `translateX(-50%) scale(${interpolate(frame - m.at, [0, 6], [1.8, 1], { extrapolateRight: "clamp" })})`, background: C.red, color: "#fff", borderRadius: 10, fontFamily: MONO, fontWeight: 800, fontSize: 26, padding: "4px 10px" }}>⚠</div>
      ) : null)}
      <div style={{ position: "absolute", left: `${head * 100}%`, top: -12, bottom: -12, width: 6, background: C.amber, boxShadow: `0 0 18px ${C.amber}` }} />
    </div>
  );
};

/* ---------- scenes (local frames) ---------- */
const S = {
  hook: () => (
    <>
      <Win src="b/s_sintel.mp4" at={22} label="An entire movie…" credit={SINTEL}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.35), transparent)", transform: `translateX(${interpolate(useCurrentFrame(), [0, 60], [-1080, 1080], { extrapolateRight: "extend" }) % 2160 - 0}px)` }} />
      </Win>
      <Timeline sweep={[0, f(5.2)]} marks={[{ at: f(3.9), x: 0.2 }, { at: f(4.2), x: 0.42 }, { at: f(4.5), x: 0.64 }, { at: f(4.8), x: 0.86 }]} />
      <Chip top={VY + VH + 160} delay={f(3.6)} bg={C.red}>⚠ every little problem</Chip>
    </>
  ),
  crazy: () => (
    <AbsoluteFill>
      <Aroll data={D} src="r/r4f_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={900} zoom={1.3} alternate={false} offset={f(5.25)} />
      <Flash dur={5} />
      <div style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn delay={4}><div style={{ fontSize: 160 }}>🤯</div></PopIn>
      </div>
    </AbsoluteFill>
  ),
  intro: () => (
    <>
      <Win src="b/oai_terra.mp4" at={0} zoom={1.2} origin="100% 100%" credit={OAI} />
      <Chip delay={f(1.4)}>NEW · GPT-6.1 Terra</Chip>
      <Chip top={VY + VH + 170} bg="#fff" color={C.ink} delay={f(2.0)}>OpenAI · Oct 26, 2026</Chip>
    </>
  ),
  chatbot: () => {
    const frame = useCurrentFrame();
    const cross = frame >= f(1.5);
    return (
      <AbsoluteFill>
        <GridBg bg={C.dark} line={C.line} glow="rgba(124,58,237,0.18)" />
        <div style={{ position: "absolute", top: VY, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 22 }}>
          <PopIn from="right"><div style={{ alignSelf: "flex-end", marginLeft: 220, background: C.purple, color: "#fff", borderRadius: "34px 34px 8px 34px", padding: "24px 32px", fontFamily: INTER, fontWeight: 600, fontSize: 42 }}>Can you review my video?</div></PopIn>
          <PopIn from="left" delay={10}><div style={{ marginRight: 160, background: "#fff", color: C.ink, borderRadius: "34px 34px 34px 8px", padding: "24px 32px", fontFamily: INTER, fontWeight: 600, fontSize: 42 }}>Sure! Here are some general tips… 💬</div></PopIn>
        </div>
        <div style={{ position: "absolute", top: VY + 420, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <PopIn delay={18}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, color: "#fff" }}>Regular chatbot: <span style={{ color: C.mute }}>just talks</span></div></PopIn>
            {cross && <div style={{ position: "absolute", left: -20, right: -20, top: "50%", height: 12, background: C.red, transform: "rotate(-4deg)", borderRadius: 6 }} />}
          </div>
        </div>
      </AbsoluteFill>
    );
  },
  computer: () => (
    <>
      <Win src="b/oai_terra.mp4" at={12} zoom={1.2} origin="100% 100%" label="Terra operating real 3D software" credit={OAI} />
      <Chip delay={6}>🖱 uses real apps</Chip>
      <Chip top={VY + VH + 170} bg={C.mint} delay={f(2.6)}>✓ builds a 3D model on its own</Chip>
    </>
  ),
  test: () => {
    const frame = useCurrentFrame();
    const shots = [13, 16, 20, 23, 26, 28, 31, 33, 35, 24, 18, 30];
    const i = Math.floor(frame / 12) % shots.length;
    return (
      <>
        <Sequence from={i * 12} key={i}><Win src="b/s_sintel.mp4" at={shots[i]} credit={SINTEL} label={`SHOT ${String(i + 1).padStart(2, "0")}`} /></Sequence>
        <div style={{ position: "absolute", top: VY + VH + 60, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <PopIn><div style={{ background: C.amber, color: "#111", fontFamily: MONO, fontWeight: 800, fontSize: 38, padding: "10px 24px", borderRadius: 12 }}>OPENAI'S TEST · Agents' Last Exam</div></PopIn>
          <PopIn delay={f(2.5)}><div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 58, color: "#fff" }}>review a whole animated film</div></PopIn>
        </div>
      </>
    );
  },
  manual: () => {
    const frame = useCurrentFrame();
    const paused = frame >= f(3.4) && frame < f(5.8);
    return (
      <>
        <Win src="b/s_sintel.mp4" at={13} label="The manual way" credit={SINTEL} dim={paused ? 0.55 : 1}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 170, color: "#fff", opacity: 0.9 }}>{paused ? "⏸" : frame < f(2.4) ? "▶" : ""}</div>
        </Win>
        <div style={{ position: "absolute", top: VY + VH + 50, left: 60, right: 60, display: "flex", gap: 24 }}>
          <PopIn delay={f(4.3)} from="left">
            <div style={{ width: 600, height: 300, borderRadius: 24, background: "#FEF9C3", padding: 26, fontFamily: MONO, fontSize: 34, color: C.ink, lineHeight: 1.45 }}>
              <div style={{ fontWeight: 800 }}>notes.txt</div>
              <Typewriter text={"00:12  flicker?\n01:47  continuity\n03:05  audio pop"} delay={f(5.2)} cps={16} caretColor={C.red} />
            </div>
          </PopIn>
          <PopIn delay={f(2.0)}>
            <div style={{ width: 300, height: 300, borderRadius: 24, background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ fontSize: 110, transform: `rotate(${frame * 10}deg)` }}>⏱</div>
              <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 40, color: "#fff" }}>hours…</div>
            </div>
          </PopIn>
        </div>
      </>
    );
  },
  letAI: () => {
    const frame = useCurrentFrame();
    const on = frame >= f(1.6);
    return (
      <>
        <Win src="b/s_sintel.mp4" at={30} credit={SINTEL}>
          {on && <div style={{ position: "absolute", inset: 0, border: `10px solid ${C.purple}`, boxShadow: `inset 0 0 120px rgba(124,58,237,0.6)` }} />}
        </Win>
        <div style={{ position: "absolute", top: VY + VH + 70, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 56, color: "#fff" }}>AI review</div>
          <div style={{ width: 170, height: 90, borderRadius: 45, background: on ? C.purple : "#3f3f46", position: "relative", transition: "none" }}>
            <div style={{ position: "absolute", top: 9, left: on ? 89 : 9, width: 72, height: 72, borderRadius: 36, background: "#fff" }} />
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 52, color: on ? C.lilac : C.mute }}>{on ? "ON" : "OFF"}</div>
        </div>
      </>
    );
  },
  review: () => {
    const frame = useCurrentFrame();
    const rows = [["00:00:04", "Shot 02", "lighting jump"], ["00:00:11", "Shot 05", "prop moves between cuts"], ["00:00:19", "Shot 09", "frame hitch"], ["00:00:27", "Shot 12", "colour mismatch"]];
    const shot = Math.min(24, Math.floor(interpolate(frame, [f(1.2), f(3.0)], [1, 24], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
    return (
      <>
        <Win src="b/s_sintel.mp4" at={20} rate={2} credit={`Example report (illustration) · ${SINTEL}`}>
          <div style={{ position: "absolute", left: 20, top: 20, background: C.purple, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 30, padding: "6px 14px", borderRadius: 10 }}>AI checking shot {String(shot).padStart(2, "0")}/24</div>
        </Win>
        <div style={{ position: "absolute", top: VY + VH + 50, left: 40, right: 40, borderRadius: 22, overflow: "hidden", background: "#fff", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
          <div style={{ background: C.purple, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 30, padding: "10px 20px" }}>review_report.md</div>
          {rows.map(([t, s, n], i) => (frame > f(2.8 + i * 0.75) ? (
            <div key={t} style={{ display: "flex", gap: 20, padding: "10px 20px", fontFamily: MONO, fontSize: 30, color: C.ink, borderTop: "1px solid #eee", background: frame > f(4.4) && frame < f(6.0) ? "#FEE2E2" : "#fff" }}>
              <span style={{ color: C.purple, fontWeight: 800, textShadow: frame > f(5.9) ? `0 0 12px ${C.lilac}` : undefined }}>{t}</span><span style={{ color: "#6B7280" }}>{s}</span><span>{n}</span>
            </div>
          ) : null))}
        </div>
      </>
    );
  },
  yours: () => {
    const frame = useCurrentFrame();
    const scan = interpolate(frame, [f(1.0), f(6.5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const vids = [["img/ch_BEp74aewRSA.jpg", "Is REA Worth the Hype? I Tested It on a Kanban App", "9:27"], ["img/ch_Lo-GJIU1gl8.jpg", "From Raw Footage to Polished Edit: My Claude Code Experiment", "10:13"]];
    return (
      <AbsoluteFill>
        <GridBg bg={C.dark} line={C.line} glow="rgba(124,58,237,0.16)" />
        <div style={{ position: "absolute", top: VY - 20, left: 40, right: 40, display: "flex", flexDirection: "column", gap: 20 }}>
          {vids.map(([src, title, dur], i) => (
            <PopIn key={src} delay={i * 8} from="right">
              <div style={{ display: "flex", gap: 20, background: "#161B22", borderRadius: 22, padding: 16, border: "1px solid #30363d", position: "relative", overflow: "hidden" }}>
                <div style={{ width: 380, height: 214, borderRadius: 14, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                  <Pic src={src} />
                  <div style={{ position: "absolute", right: 8, bottom: 8, background: "rgba(0,0,0,0.8)", color: "#fff", fontFamily: INTER, fontWeight: 700, fontSize: 22, padding: "2px 8px", borderRadius: 6 }}>{dur}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
                  <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 30, color: "#fff", lineHeight: 1.2 }}>{title}</div>
                  <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 24, color: C.mute }}>AI with Kalyan</div>
                  <div style={{ height: 10, borderRadius: 5, background: "#2d333b", overflow: "hidden", width: 420 }}><div style={{ width: `${Math.min(1, scan * (i ? 0.8 : 1.2)) * 100}%`, height: "100%", background: C.purple }} /></div>
                </div>
              </div>
            </PopIn>
          ))}
        </div>
        <div style={{ position: "absolute", top: VY + 560, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", padding: "0 40px" }}>
          {[["⏱ hours of footage", f(4.6)], ["→", f(5.4)], ["📝 one review", f(5.8)]].map(([t, d]) => (
            <PopIn key={t as string} delay={d as number}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 46, color: t === "→" ? C.lilac : "#fff" }}>{t as string}</div></PopIn>
          ))}
        </div>
        <div style={{ position: "absolute", top: VY + 650, left: 0, right: 0, textAlign: "center", fontFamily: INTER, fontSize: 24, color: C.mute }}>Videos from the AI with Kalyan channel</div>
      </AbsoluteFill>
    );
  },
  prompt: () => (
    <AbsoluteFill>
      <GridBg bg={C.dark} line={C.line} glow="rgba(124,58,237,0.25)" />
      <div style={{ position: "absolute", top: VY, left: 80, right: 80 }}>
        <PopIn>
          <div style={{ background: "#fff", borderRadius: 30, padding: 34, boxShadow: "0 30px 70px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 44, color: C.ink }}>📝 My AI video-review prompt</div>
            <div style={{ marginTop: 18, fontFamily: MONO, fontSize: 30, color: "#374151", lineHeight: 1.5, filter: "blur(7px)" }}>
              You are a meticulous video editor. Watch my footage shot by shot and list every jump cut, audio dip, continuity error…
            </div>
            <div style={{ position: "absolute", right: 30, bottom: 26, fontSize: 70 }}>🔒</div>
          </div>
        </PopIn>
      </div>
    </AbsoluteFill>
  ),
  comment: () => (
    <AbsoluteFill>
      <GridBg bg={C.dark} line={C.line} glow="rgba(124,58,237,0.25)" />
      <div style={{ position: "absolute", top: VY - 20, left: 70, right: 70 }}>
        <PopIn from="up">
          <div style={{ background: "#fff", borderRadius: 34, padding: 32, boxShadow: "0 30px 70px rgba(0,0,0,0.45)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: INTER, fontWeight: 800, fontSize: 38, color: C.ink }}>
              <div style={{ width: 58, height: 58, borderRadius: 29, background: C.red, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>1</div>
              Comment the word
            </div>
            <div style={{ marginTop: 18, border: "3px solid #e5e7eb", borderRadius: 20, padding: "16px 24px", fontFamily: MONO, fontWeight: 800, fontSize: 90, color: C.purple, letterSpacing: 6 }}>
              <Typewriter text="EDIT" delay={6} cps={8} caretColor={C.purple} />
            </div>
            <div style={{ marginTop: 14, fontFamily: INTER, fontWeight: 600, fontSize: 32, color: "#6B7280" }}>✈️ I'll share the AI review prompt</div>
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
        <GridBg bg={C.dark} line={C.line} glow="rgba(239,68,68,0.2)" />
        <div style={{ position: "absolute", top: VY + 40, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <div style={{ width: 260, height: 260, borderRadius: 130, background: frame >= 4 ? C.red : "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 150, color: "#fff", transform: `scale(${hs})` }}>♥</div>
          <PopIn delay={10}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 54, color: "#fff", textAlign: "center" }}>Would you use AI<br />for editing?</div></PopIn>
        </div>
      </AbsoluteFill>
    );
  },
  subscribe: () => (
    <AbsoluteFill>
      <GridBg bg={C.dark} line={C.line} glow="rgba(124,58,237,0.25)" />
      <div style={{ position: "absolute", top: VY, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn from="up"><SubscribeCard clickAt={f(0.9)} dark accent={C.purple} sub="More amazing AI tools" avatarSrc="img/ch_BEp74aewRSA.jpg" /></PopIn>
      </div>
      <Cursor path={[[0, 900, 1250], [f(0.7), 560, 860], [f(1.4), 580, 870]]} clicks={[f(0.9)]} color="#fff" />
    </AbsoluteFill>
  ),
};

type Scene = { a: number; b: number; body: React.FC; face?: boolean };
const SCENES: Scene[] = [
  { a: 0, b: 5.25, body: S.hook, face: true },
  { a: 5.25, b: 6.5, body: S.crazy },
  { a: 6.5, b: 9.5, body: S.intro, face: true },
  { a: 9.5, b: 11.8, body: S.chatbot, face: true },
  { a: 11.8, b: 15.9, body: S.computer, face: true },
  { a: 15.9, b: 21.35, body: S.test, face: true },
  { a: 21.35, b: 28.2, body: S.manual, face: true },
  { a: 28.2, b: 31.0, body: S.letAI, face: true },
  { a: 31.0, b: 38.2, body: S.review, face: true },
  { a: 38.2, b: 46.1, body: S.yours, face: true },
  { a: 46.1, b: 48.85, body: S.prompt, face: true },
  { a: 48.85, b: 50.5, body: S.comment, face: true },
  { a: 50.5, b: 52.75, body: S.like, face: true },
  { a: 52.75, b: END, body: S.subscribe, face: true },
];

/* captions: serif italic, top band, 1-3 words */
const chunks = chunkWords(D.words, 3, 18);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", top: 150, left: 40, right: 40, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        return (
          <span key={i} style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 96, color: on ? (/EDIT|Terra/.test(w.w) ? C.lilac : "#fff") : "rgba(255,255,255,0.45)", textShadow: "0 4px 18px rgba(0,0,0,0.85)" }}>
            {w.w.replace(/[,.]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

export const Reel4: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0, "whoosh", 0.35], [3.9, "blip", 0.3], [4.2, "blip", 0.3], [4.5, "blip", 0.3], [4.8, "blip", 0.3], [5.25, "impact", 0.5],
    [6.5, "whoosh", 0.3], [7.9, "pop"], [9.5, "pop", 0.3], [9.85, "pop", 0.3], [11.0, "glitch", 0.3], [11.8, "whoosh", 0.3], [12.0, "click", 0.5], [14.4, "ding", 0.25],
    [15.9, "whoosh", 0.3], [16.3, "shutter", 0.3], [16.7, "shutter", 0.3], [17.1, "shutter", 0.3], [21.35, "swish", 0.3], [24.75, "click", 0.5], [26.55, "typing", 0.35],
    [28.2, "whoosh", 0.3], [29.8, "click", 0.6], [29.85, "ding", 0.25], [31.0, "whoosh", 0.3], [33.8, "pop"], [34.55, "pop"], [35.3, "pop"], [36.05, "pop"],
    [38.2, "whoosh", 0.3], [42.8, "pop"], [43.9, "ding", 0.25], [46.1, "whoosh", 0.3], [48.85, "pop"], [49.1, "typing", 0.4], [50.6, "pop", 0.6], [50.65, "ding", 0.25],
    [52.75, "whoosh", 0.3], [53.65, "click", 0.6], [53.7, "notify", 0.35],
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
              <Aroll data={D} src="r/r4f_aroll.mp4" box={{ x: 350, y: 1470, w: 380, h: 380, r: 190 }} focusY={880} zoom={1.7} offset={from} border="6px solid #fff" shadow />
            )}
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("r/r4f_aroll.mp4")} />
      <Music src="r/r4_music.wav" total={END} base={0.13} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

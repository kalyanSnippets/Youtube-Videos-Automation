import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, Easing } from "remotion";
import data from "../public/r/r4_words.json";
import {
  Aroll, Clip, Cursor, f, FPS, GridBg, INTER, MONO, SERIF, Music, Pic, PopIn, ReelData, Sfx, Typewriter, Credit, Flash,
  chunkWords, activeChunk,
} from "./lib";

const D = data as ReelData;
export const R4_FRAMES = Math.ceil(D.duration * FPS);

const C = { dark: "#0D1117", line: "rgba(255,255,255,0.06)", light: "#F8F9FA", lline: "#E1E4E8", purple: "#7C3AED", amber: "#F59E0B", mint: "#10B981", red: "#EF4444", ink: "#111827", mute: "#6B7280" };
const SINTEL = "Sintel © Blender Foundation · CC BY 3.0";

type Mode = "split" | "full" | "face";
type Scene = { a: number; b: number; mode: Mode; body?: React.FC; theme?: "dark" | "light" };

/* ---------- pieces ---------- */
const Player: React.FC<{ start?: number; w?: number; markers?: { at: number; x: number }[]; sweep?: [number, number]; dur?: number }> = ({ start = 22, w = 960, markers = [], sweep, dur = 200 }) => {
  const frame = useCurrentFrame();
  const head = sweep ? interpolate(frame, sweep, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : (frame % 240) / 240;
  return (
    <div style={{ width: w, background: "#161B22", borderRadius: 26, overflow: "hidden", border: "1px solid #30363d", boxShadow: "0 30px 70px rgba(0,0,0,0.45)" }}>
      <Clip src="b/s_sintel.mp4" startFrom={start} durFrames={dur} kenBurns={0.03} style={{ width: w, height: (w * 9) / 16 }} />
      <div style={{ padding: "18px 22px" }}>
        <div style={{ position: "relative", height: 70, borderRadius: 10, background: "repeating-linear-gradient(90deg,#2d333b 0 58px,#22272e 58px 62px)" }}>
          {markers.map((m, i) => (frame >= m.at ? (
            <div key={i} style={{ position: "absolute", left: `${m.x * 100}%`, top: -14, transform: `translateX(-50%) scale(${interpolate(frame - m.at, [0, 6], [1.8, 1], { extrapolateRight: "clamp" })})`, background: C.red, color: "#fff", borderRadius: 8, fontFamily: MONO, fontWeight: 800, fontSize: 22, padding: "2px 8px" }}>⚠</div>
          ) : null))}
          <div style={{ position: "absolute", left: `${head * 100}%`, top: -10, bottom: -10, width: 5, background: C.amber, boxShadow: `0 0 16px ${C.amber}` }} />
        </div>
      </div>
    </div>
  );
};

const Badge: React.FC = () => {
  const frame = useCurrentFrame();
  const text = " AI NEWS DROP • AI NEWS DROP • AI NEWS DROP •";
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <GridBg bg={C.light} line={C.lline} size={54} />
      <div style={{ position: "relative", width: 640, height: 640, transform: `scale(${interpolate(frame, [0, 8], [0.6, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) })})` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 320, background: C.purple, boxShadow: "0 30px 80px rgba(124,58,237,0.45)" }} />
        <div style={{ position: "absolute", inset: 100, borderRadius: 220, background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 200 }}>🎬</div>
        <svg width={640} height={640} style={{ position: "absolute", inset: 0, transform: `rotate(${frame * 2}deg)` }}>
          <defs><path id="circ" d="M320,320 m-262,0 a262,262 0 1,1 524,0 a262,262 0 1,1 -524,0" /></defs>
          <text fill="#fff" fontFamily={INTER} fontWeight={900} fontSize={46} letterSpacing={6}><textPath href="#circ">{text}</textPath></text>
        </svg>
      </div>
      <div style={{ position: "absolute", top: 1380, fontFamily: INTER, fontWeight: 900, fontSize: 110, color: C.purple, letterSpacing: -2 }}>GPT-6.1 TERRA</div>
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <PopIn><Player start={22} markers={[{ at: f(3.4), x: 0.18 }, { at: f(3.9), x: 0.41 }, { at: f(4.4), x: 0.63 }, { at: f(4.9), x: 0.86 }]} sweep={[0, f(5.6)]} /></PopIn>
    <Credit text={SINTEL} bottom={20} />
  </AbsoluteFill>
);

const News: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 26 }}>
    <PopIn from="up">
      <div style={{ width: 920, height: 600, borderRadius: 26, overflow: "hidden", background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,0.4)" }}>
        <Pic src="img/bleep_head.png" pos="0% 0%" />
      </div>
    </PopIn>
    <div style={{ display: "flex", gap: 16 }}>
      <PopIn delay={10}><div style={{ background: C.purple, color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 34, padding: "12px 24px", borderRadius: 999 }}>GPT-6.1 Terra</div></PopIn>
      <PopIn delay={16}><div style={{ background: "#fff", color: C.ink, fontFamily: INTER, fontWeight: 800, fontSize: 34, padding: "12px 24px", borderRadius: 999 }}>Oct 26, 2026</div></PopIn>
    </div>
    <Credit text="Source: BleepingComputer" bottom={20} />
  </AbsoluteFill>
);

const ComputerUse: React.FC = () => {
  const frame = useCurrentFrame();
  const phase2 = frame > f(2.6);
  const apps = [["🎬", "Editor", 170, 330], ["📊", "Sheets", 450, 230], ["🌐", "Browser", 730, 360]] as const;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {!phase2 ? (
        <div style={{ position: "relative" }}>
          <PopIn><div style={{ background: "#fff", borderRadius: "40px 40px 40px 8px", padding: "34px 44px", fontFamily: INTER, fontWeight: 700, fontSize: 48, color: C.ink }}>💬 Just a chatbot?</div></PopIn>
          {frame > f(1.4) && <div style={{ position: "absolute", left: -20, right: -20, top: "50%", height: 12, background: C.red, transform: "rotate(-8deg)", borderRadius: 6 }} />}
        </div>
      ) : (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 60, right: 60, top: 70, bottom: 70, borderRadius: 30, background: "linear-gradient(135deg,#1f2937,#111827)", border: "1px solid #374151" }} />
          {apps.map(([e, n, x, y], i) => (
            <div key={n} style={{ position: "absolute", left: x, top: y }}>
              <PopIn delay={f(2.7) + i * 5 - f(2.6)}>
                <div style={{ width: 200, height: 200, borderRadius: 40, background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 90, boxShadow: "0 16px 40px rgba(0,0,0,0.4)" }}>
                  {e}<div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 28, color: C.ink }}>{n}</div>
                </div>
              </PopIn>
            </div>
          ))}
          <div style={{ position: "absolute", left: 140, right: 140, top: 640, display: "flex", gap: 14, justifyContent: "center" }}>
            {["opens apps", "clicks", "types", "finishes tasks"].map((t, i) => (
              <PopIn key={t} delay={f(1.2) + i * f(0.6)}><div style={{ background: C.mint, color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 28, padding: "10px 18px", borderRadius: 999 }}>✓ {t}</div></PopIn>
            ))}
          </div>
          <Sequence from={f(2.6)}>
            <Cursor path={[[0, 820, 760], [f(0.7), 270, 430], [f(1.6), 550, 330], [f(2.5), 830, 460], [f(3.5), 270, 430]]} clicks={[f(0.75), f(1.65), f(2.55), f(3.55)]} color={C.purple} />
          </Sequence>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const TheTest: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 70, gap: 24 }}>
      <PopIn><div style={{ background: C.amber, color: "#111", fontFamily: MONO, fontWeight: 800, fontSize: 36, padding: "10px 24px", borderRadius: 12 }}>THE TEST · Agents' Last Exam</div></PopIn>
      <PopIn delay={6}><div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 64, color: "#fff", textAlign: "center", lineHeight: 1.1 }}>Review an animated film,<br />shot by shot</div></PopIn>
      <div style={{ width: 1080, height: 330, overflow: "hidden", position: "relative", marginTop: 20 }}>
        <div style={{ position: "absolute", top: 0, left: -interpolate(frame, [0, 180], [0, 900]), display: "flex", gap: 14 }}>
          {[13, 16, 20, 23, 26, 28, 31, 33, 35, 24].map((s, i) => (
            <div key={i} style={{ width: 440, height: 248, borderRadius: 16, overflow: "hidden", border: "6px solid #222", flexShrink: 0, position: "relative" }}>
              <Clip src="b/s_sintel.mp4" startFrom={s} durFrames={180} kenBurns={0} style={{ width: 428, height: 236 }} />
              <div style={{ position: "absolute", left: 8, top: 8, background: "rgba(0,0,0,0.7)", color: "#fff", fontFamily: MONO, fontSize: 20, padding: "2px 8px", borderRadius: 6 }}>SHOT {String(i + 1).padStart(2, "0")}</div>
            </div>
          ))}
        </div>
      </div>
      <Credit text={`${SINTEL} · stand-in film, not OpenAI's test footage`} bottom={20} />
    </AbsoluteFill>
  );
};

const Manual: React.FC = () => {
  const frame = useCurrentFrame();
  const playing = Math.floor(frame / 20) % 2 === 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 60, fontFamily: MONO, fontWeight: 800, fontSize: 38, color: C.mute, letterSpacing: 3 }}>THE MANUAL WAY</div>
      <div style={{ display: "flex", gap: 26, alignItems: "center", marginTop: 40 }}>
        <PopIn from="left">
          <div style={{ width: 520, borderRadius: 24, overflow: "hidden", background: "#111", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
            <Clip src="b/s_sintel.mp4" startFrom={13} durFrames={220} kenBurns={0} style={{ width: 520, height: 292, filter: playing ? undefined : "brightness(0.6)" }} />
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 48 }}>{playing ? "▶" : "⏸"}</div>
          </div>
        </PopIn>
        <PopIn from="right" delay={8}>
          <div style={{ width: 400, height: 372, borderRadius: 24, background: "#FEF9C3", padding: 26, boxShadow: "0 20px 50px rgba(0,0,0,0.15)", fontFamily: MONO, fontSize: 30, color: C.ink, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>notes.txt</div>
            <Typewriter text={"00:12  flicker?\n01:47  continuity\n03:05  audio pop\n04:22  …"} delay={f(4.6)} cps={14} caretColor={C.red} />
          </div>
        </PopIn>
      </div>
      <PopIn delay={f(1.5)} style={{ position: "absolute", bottom: 60 }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: C.ink, display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ display: "inline-block", transform: `rotate(${frame * 12}deg)` }}>⏱</span> watch · pause · note · repeat
        </div>
      </PopIn>
      <Credit text={SINTEL} bottom={20} align="right" color="#fff" />
    </AbsoluteFill>
  );
};

const LetAI: React.FC = () => {
  const frame = useCurrentFrame();
  const s = 1 + Math.sin(frame / 6) * 0.04;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: C.dark }}>
      <GridBg bg={C.dark} line={C.line} glow="rgba(124,58,237,0.35)" />
      <div style={{ width: 420, height: 420, borderRadius: 210, background: `radial-gradient(circle at 35% 35%, #c4b5fd, ${C.purple} 55%, #3b0764)`, transform: `scale(${s})`, boxShadow: `0 0 140px ${C.purple}` }} />
      <div style={{ position: "absolute", top: 1240, fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 120, color: "#fff" }}>let AI review it</div>
    </AbsoluteFill>
  );
};

const ROWS = [["00:00:04", "Shot 02", "check lighting jump"], ["00:00:11", "Shot 05", "continuity: prop moves"], ["00:00:19", "Shot 09", "frame hitch"], ["00:00:27", "Shot 12", "colour mismatch"], ["00:00:33", "Shot 14", "audio drop"]];
const Review: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 36, gap: 18 }}>
      <div style={{ transform: "scale(0.78)", transformOrigin: "50% 0%", height: 540 }}>
        <Player start={26} markers={ROWS.map((_, i) => ({ at: f(1.4 + i * 0.9), x: 0.12 + i * 0.18 }))} sweep={[0, f(6)]} />
      </div>
      <div style={{ width: 960, background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>
        <div style={{ background: C.purple, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 26, padding: "10px 20px", display: "flex", justifyContent: "space-between" }}><span>review_report.md</span><span>example</span></div>
        {ROWS.map(([t, s, n], i) => (frame > f(1.4 + i * 0.9) ? (
          <div key={t} style={{ display: "flex", gap: 20, padding: "8px 20px", fontFamily: MONO, fontSize: 26, color: C.ink, borderTop: "1px solid #eee", background: i % 2 ? "#fafafa" : "#fff" }}>
            <span style={{ color: C.purple, fontWeight: 800 }}>{t}</span><span style={{ color: C.mute }}>{s}</span><span>{n}</span>
          </div>
        ) : null))}
      </div>
      <Credit text={`Illustration · ${SINTEL}`} bottom={14} />
    </AbsoluteFill>
  );
};

const YourVideos: React.FC = () => {
  const frame = useCurrentFrame();
  const scan = interpolate(frame, [f(0.5), f(4.5)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 70, gap: 30 }}>
      <PopIn><div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 70, color: C.ink }}>…now your own videos</div></PopIn>
      <div style={{ display: "flex", gap: 20 }}>
        {[0, 1, 2].map((i) => (
          <PopIn key={i} delay={6 + i * 5}>
            <div style={{ width: 300, height: 400, borderRadius: 22, overflow: "hidden", position: "relative", border: "4px solid #fff", boxShadow: "0 16px 40px rgba(0,0,0,0.2)" }}>
              <Aroll data={D} src="r/r4_aroll.mp4" box={{ x: 0, y: 0, w: 300, h: 400 }} focusY={850 + i * 60} zoom={1.2 + i * 0.1} alternate={false} />
              <div style={{ position: "absolute", left: 0, right: 0, top: `${scan * 100}%`, height: 6, background: C.mint, boxShadow: `0 0 20px ${C.mint}` }} />
              {frame > f(2 + i * 0.8) && <div style={{ position: "absolute", right: 10, top: 10, background: C.red, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 22, padding: "4px 10px", borderRadius: 8 }}>⚠ flagged</div>}
            </div>
          </PopIn>
        ))}
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "center", fontFamily: INTER, fontWeight: 800, fontSize: 42, color: C.ink }}>
        <PopIn delay={f(4.2)}><span>⏱ hours of footage</span></PopIn>
        <PopIn delay={f(4.8)}><span style={{ color: C.purple }}>→ one report</span></PopIn>
      </div>
    </AbsoluteFill>
  );
};

const CommentCTA: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 70, right: 70, top: 120 }}>
      <PopIn from="up" delay={f(2.6)}>
        <div style={{ background: "#fff", borderRadius: 34, padding: 30, boxShadow: "0 30px 70px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: INTER, fontWeight: 800, fontSize: 36, color: C.ink }}>
            <div style={{ width: 54, height: 54, borderRadius: 27, background: C.red, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>1</div>
            Comment the word
          </div>
          <div style={{ marginTop: 18, border: "3px solid #e5e7eb", borderRadius: 20, padding: "18px 24px", fontFamily: MONO, fontWeight: 800, fontSize: 70, color: C.purple }}>
            <Typewriter text="EDIT" delay={f(3.0)} cps={6} caretColor={C.purple} />
          </div>
          <div style={{ marginTop: 14, fontFamily: INTER, fontWeight: 600, fontSize: 30, color: C.mute }}>✈️ I'll share the AI review prompt</div>
        </div>
      </PopIn>
    </div>
  </AbsoluteFill>
);

const LikeSub: React.FC = () => {
  const frame = useCurrentFrame();
  const liked = frame >= 6;
  const sub = frame >= f(1.8);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1500, display: "flex", justifyContent: "center", gap: 30 }}>
        <PopIn><div style={{ width: 170, height: 170, borderRadius: 85, background: liked ? C.red : "#fff", color: liked ? "#fff" : C.ink, fontSize: 90, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${liked ? interpolate(frame - 6, [0, 5, 10], [0.7, 1.25, 1], { extrapolateRight: "clamp" }) : 1})` }}>♥</div></PopIn>
        <PopIn delay={10}><div style={{ height: 170, padding: "0 50px", borderRadius: 85, background: sub ? "#fff" : "#FF0033", color: sub ? C.ink : "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 56, display: "flex", alignItems: "center" }}>{sub ? "✓ Subscribed" : "Subscribe"}</div></PopIn>
      </div>
      <Cursor path={[[0, 900, 1850], [f(1.6), 760, 1580], [f(2.4), 770, 1590]]} clicks={[f(1.8)]} color={C.purple} />
    </AbsoluteFill>
  );
};

const SCENES: Scene[] = [
  { a: 0, b: 5.87, mode: "split", body: Hook, theme: "dark" },
  { a: 5.87, b: 7.1, mode: "full", body: Badge },
  { a: 7.1, b: 10.45, mode: "split", body: News, theme: "dark" },
  { a: 10.45, b: 17.5, mode: "split", body: ComputerUse, theme: "dark" },
  { a: 17.5, b: 23.4, mode: "split", body: TheTest, theme: "dark" },
  { a: 23.4, b: 30.73, mode: "split", body: Manual, theme: "light" },
  { a: 30.73, b: 34.05, mode: "full", body: LetAI },
  { a: 34.05, b: 42.09, mode: "split", body: Review, theme: "dark" },
  { a: 42.09, b: 50.77, mode: "split", body: YourVideos, theme: "light" },
  { a: 50.77, b: 55.39, mode: "face", body: CommentCTA },
  { a: 55.39, b: D.duration, mode: "face", body: LikeSub },
];

const chunks = chunkWords(D.words, 2, 14);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const sc = SCENES.find((s) => t >= s.a && t < s.b);
  const y = sc?.mode === "split" ? 960 : sc?.mode === "face" ? 1330 : 1560;
  if (sc?.mode === "full" && sc.body === Badge) return null;
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, display: "flex", justifyContent: "center", transform: "translateY(-50%)" }}>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 92, color: "#fff", textShadow: "0 4px 18px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)" }}>
        {c.words.map((w) => w.w.replace(/[,.]$/, "")).join(" ")}
      </div>
    </div>
  );
};

export const Reel4: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0, "whoosh"], [0.3, "pop"], [3.4, "blip", 0.3], [3.9, "blip", 0.3], [4.4, "blip", 0.3], [4.9, "blip", 0.3], [5.87, "impact", 0.5], [5.9, "glitch", 0.3],
    [7.1, "whoosh"], [7.3, "shutter", 0.35], [10.45, "swish"], [11.85, "glitch", 0.35], [13.05, "whoosh"], [13.2, "pop", 0.3], [13.4, "pop", 0.3], [13.6, "pop", 0.3],
    [13.8, "click", 0.5], [14.7, "click", 0.5], [15.6, "click", 0.5], [16.6, "click", 0.5], [17.5, "whoosh"], [17.7, "pop"],
    [23.4, "swish"], [28.0, "typing", 0.3], [29.2, "typing", 0.3], [30.73, "riser", 0.3], [31.6, "impact", 0.5],
    [34.05, "whoosh"], [35.45, "blip", 0.3], [36.35, "blip", 0.3], [37.25, "blip", 0.3], [38.15, "blip", 0.3], [39.05, "blip", 0.3], [41.5, "ding", 0.25],
    [42.09, "whoosh"], [44.1, "blip", 0.25], [44.9, "blip", 0.25], [45.7, "blip", 0.25], [46.3, "pop"], [46.9, "pop"],
    [50.77, "impact", 0.4], [53.4, "whoosh"], [53.8, "typing", 0.4], [55.39, "pop", 0.5], [55.6, "ding", 0.25], [57.2, "click", 0.6], [57.25, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: C.dark }}>
      {SCENES.map((s, i) => {
        const from = f(s.a);
        const Body = s.body;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, f(s.b) - from)}>
            {s.mode === "split" && (
              <>
                <AbsoluteFill style={{ height: 960, overflow: "hidden" }}>
                  {s.theme === "light" ? <GridBg bg={C.light} line={C.lline} size={54} /> : <GridBg bg={C.dark} line={C.line} size={54} glow="rgba(124,58,237,0.18)" />}
                  {Body && <Body />}
                </AbsoluteFill>
                <Aroll data={D} src="r/r4_aroll.mp4" box={{ x: 0, y: 960, w: 1080, h: 960 }} focusY={840} offset={from} />
              </>
            )}
            {s.mode === "full" && Body && <Body />}
            {s.mode === "face" && (
              <>
                <Aroll data={D} src="r/r4_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={930} zoom={i % 2 ? 1.2 : 1.3} alternate={false} offset={from} />
                <Flash dur={5} />
                {Body && <Body />}
              </>
            )}
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("r/r4_aroll.mp4")} />
      <Music src="r/r4_music.wav" total={D.duration} base={0.14} boosts={[[5.87, 7.1, 0.35], [30.73, 34.05, 0.3]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import data from "../public/r/r13v2_words.json";
import face from "../public/r/r13v2_face.json";
import { f, FPS, INTER, Music, PopIn, ReelData, Sfx, chunkWords, activeChunk } from "./lib";
import { K, ease, clamp, Chip, FaceTrack, Screen3D } from "./split";

/* Reel 13 v2: "Shrink a massive AI model and run it on a normal laptop" (Saluki 27B by Underdog).
   - A-roll recut from a chunk-by-chunk transcript: every retake, false start and long pause removed; cuts are 4-frame dissolves
     with an alternating gentle zoom, and the effects-skill pass (spotlight, red collage, to-do, receipt, follow tap) is baked in.
   - Split-screen beats glide in and out (no hard switches); back-to-back panels cross-dissolve.
   - 3D beats are real Three.js scenes (Stage13.tsx). Research beats show the real Hugging Face model card and articles.
   Facts on screen, checked 2026-11-21 on huggingface.co/ConwayResearch/Underdog-Saluki-27B-1.0 (vendor-reported numbers):
   based on Qwen3.8-27B; one 7.89 GB GGUF vs 54 GB; tool calling 88 vs 84; 96% average retention across 9 benchmarks. */
const D = data as unknown as ReelData;
const FT = face as FaceTrack;
const BASE = "r/r13v2fx_aroll.mp4";
const END = D.duration + 0.5;
export const R13V2_FRAMES = Math.ceil(END * FPS);
const SEAM = 960, EDGE = 10;

type Panel = { a: number; b: number; C: React.FC; accent: string };

/* ---------- panels (frame 0 = panel start) ---------- */
const L = (abs: number, a: number) => f(abs) - f(a);
const Vid: React.FC<{ src: string; startFrom?: number }> = ({ src, startFrom = 0 }) => <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} style={{ position: "absolute", inset: 0, width: 1080, height: 960 }} />;
const Tag: React.FC<{ at: number; x?: number; y: number; bg?: string; color?: string; size?: number; children: React.ReactNode; center?: boolean }> = ({ at, x = 60, y, bg = "#fff", color = K.ink, size = 40, children, center }) => (
  <PopIn delay={at} from="up" dist={30} style={center ? { position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" } : { position: "absolute", left: x, top: y }}>
    <Chip bg={bg} color={color} size={size}>{children}</Chip>
  </PopIn>
);
const Source: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", left: 40, bottom: 92, fontFamily: INTER, fontWeight: 700, fontSize: 24, color: "rgba(255,255,255,0.75)", background: "rgba(0,0,0,0.45)", padding: "6px 12px", borderRadius: 8 }}>{children}</div>
);

const HookP: React.FC = () => (
  <>
    <Vid src="b/r13_3d_hook.mp4" />
    <Tag at={L(0.82, 0)} y={110} center bg={K.yellow} size={44}>🗜️ shrink a massive AI model?</Tag>
  </>
);
const ProblemP: React.FC = () => {
  const a = 5.9;
  return (
    <>
      <Vid src="b/r13_3d_problem.mp4" />
      <Tag at={L(7.42, a)} x={50} y={90} size={36}>🤗 amazing open-source model</Tag>
      <Tag at={L(9.84, a)} x={600} y={90} bg={K.blue} color="#fff" size={36}>⬇ download it</Tag>
      <Tag at={L(11.4, a)} y={190} center bg={K.red} color="#fff" size={46}>✕ not enough RAM</Tag>
    </>
  );
};
const ResearchP: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 12.7;
  const z = interpolate(frame, [0, 120], [1, 1.06], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: 40, top: 220, transform: `scale(${z})`, transformOrigin: "50% 30%" }}>
        <Screen3D src="b/r13_hf.mp4" w={1000} url="huggingface.co/ConwayResearch/Underdog-Saluki-27B-1.0" rotY={-6} rotX={6} sway={3} glow="#FFD21E" />
      </div>
      <PopIn delay={L(14.8, a)} from="down" dist={40} style={{ position: "absolute", left: 50, top: 70 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 96, color: K.yellow, letterSpacing: -4, textShadow: "0 10px 40px rgba(0,0,0,0.7)" }}>Saluki 27B</div>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, color: "#fff" }}>by Underdog</div>
        </div>
      </PopIn>
      <Source>Source: Hugging Face model card · checked 21 Nov 2026</Source>
    </>
  );
};
const CompressP: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 16.8;
  const done = frame >= L(20.9, a);
  return (
    <>
      <Vid src="b/r13_3d_compress.mp4" />
      <Tag at={L(17.3, a)} x={50} y={80} bg="#2a2f3a" color="#fff" size={36}>✕ train a brand-new model</Tag>
      {frame >= L(19.3, a) && <Tag at={L(19.3, a)} x={50} y={160} bg={K.green} size={36}>✓ compress an existing one</Tag>}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 120, textAlign: "center", fontFamily: INTER }}>
        <div style={{ fontWeight: 900, fontSize: 84, color: done ? K.green : "#fff", letterSpacing: -3, textShadow: "0 8px 30px rgba(0,0,0,0.8)" }}>{done ? "7.89 GB" : "54 GB"}</div>
        <div style={{ fontWeight: 800, fontSize: 30, color: "#c4b5fd", letterSpacing: 4 }}>{done ? "SALUKI 27B · ONE GGUF FILE" : "QWEN3.8-27B · FULL MODEL"}</div>
      </div>
      <Source>Sizes per the Saluki model card</Source>
    </>
  );
};
const VideoP: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 21.4;
  const k = interpolate(frame, [L(23.5, a), L(24.8, a)], [0, 1], { ...clamp, easing: ease });
  return (
    <>
      <div style={{ position: "absolute", left: 540 - (440 - k * 170), top: 240 + k * 60, transform: `scale(${1 - k * 0.42})`, transformOrigin: "50% 40%", width: 880 }}>
        <Screen3D src="b/r10_coffee_after.mp4" w={880} url={k > 0.5 ? "video_small.mp4 · smaller file" : "video_huge.mp4 · huge file"} rotY={-8 + k * 14} rotX={5} sway={4} glow={k > 0.5 ? K.green : K.orange} dark />
      </div>
      <Tag at={L(22.66, a)} y={90} center bg="#fff" size={40}>🎬 like shrinking a huge video file</Tag>
      {frame >= L(24.4, a) && <Tag at={L(24.4, a)} y={800} center bg={K.green} size={40}>✓ keeps most of the quality</Tag>}
    </>
  );
};
const ProofP: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 25.9;
  const swap = L(27.9, a);
  const k = interpolate(frame, [swap - 6, swap + 8], [0, 1], { ...clamp, easing: ease });
  return (
    <>
      <div style={{ position: "absolute", left: 60, top: 170, opacity: 1 - k * 0.6, transform: `translateX(${-k * 120}px) scale(${1 - k * 0.12})` }}>
        <Screen3D src="b/r13_hf.mp4" startFrom={150} w={960} url="huggingface.co/ConwayResearch/Underdog-Saluki-27B-1.0" rotY={8} rotX={5} sway={3} glow="#FFD21E" />
      </div>
      {frame < swap && <Tag at={8} y={80} center bg={K.yellow} size={36}>96% avg retention · 9 benchmarks (vendor)</Tag>}
      {frame >= swap - 6 && (
        <div style={{ position: "absolute", left: 140, top: 240, opacity: k, transform: `translateY(${(1 - k) * 80}px)` }}>
          <Screen3D src="b/r13_stork.mp4" w={880} url="stork.ai · This 27B AI Model Fits in 8GB — and Has a Catch" rotY={-8} rotX={4} sway={3} glow={K.red} />
        </div>
      )}
      {frame >= swap && <Tag at={swap + 4} y={80} center bg={K.red} color="#fff" size={44}>⚠️ …but there's a catch</Tag>}
      <Source>Sources: Hugging Face model card · stork.ai</Source>
    </>
  );
};
const PollP: React.FC = () => {
  const a = 38.05;
  return (
    <>
      <Vid src="b/r13_3d_poll.mp4" />
      <PopIn delay={4} from="down" dist={30} style={{ position: "absolute", left: 40, right: 40, top: 60, textAlign: "center" }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, color: "#fff", letterSpacing: -2, textShadow: "0 8px 30px rgba(0,0,0,0.8)" }}>How much RAM does your laptop have?</div>
      </PopIn>
      <Tag at={L(40.82, a)} y={820} center bg={K.blue} color="#fff" size={38}>💬 comment your RAM + Windows / Mac</Tag>
    </>
  );
};

const PANELS: Panel[] = [
  { a: 0, b: 3.72, C: HookP, accent: K.violet },
  { a: 5.9, b: 12.75, C: ProblemP, accent: K.red },
  { a: 12.7, b: 16.85, C: ResearchP, accent: K.yellow },
  { a: 16.8, b: 21.45, C: CompressP, accent: K.green },
  { a: 21.4, b: 25.95, C: VideoP, accent: K.orange },
  { a: 25.9, b: 28.65, C: ProofP, accent: K.red },
  { a: 38.05, b: 45.4, C: PollP, accent: K.blue },
];
/* how "split" the screen is at time t: 0 = full face, 1 = split; eases over EDGE frames at the ends of merged runs */
const RUNS = PANELS.reduce<[number, number][]>((acc, p) => { const l = acc[acc.length - 1]; if (l && p.a <= l[1] + 0.05) l[1] = Math.max(l[1], p.b); else acc.push([p.a, p.b]); return acc; }, []);
const splitAt = (fr: number) => {
  for (const [a, b] of RUNS) {
    const A = f(a), B = f(b);
    if (fr >= A && fr < B) {
      const pin = a === 0 ? 1 : interpolate(fr, [A, A + EDGE], [0, 1], clamp);
      return Math.min(pin, interpolate(fr, [B - EDGE, B], [1, 0], clamp));
    }
  }
  return 0;
};
const faceAt = (t: number) => {
  const i = Math.max(0, FT.t.findIndex((x) => x > t) - 1);
  return FT.cy[i];
};

const Layout: React.FC = () => {
  const frame = useCurrentFrame();
  const p0 = splitAt(frame);
  const p = Easing.inOut(Easing.cubic)(p0);
  const t = frame / FPS;
  if (p <= 0.001) return null;
  const seam = SEAM * p, h = 1920 - seam, s = 1 - 0.14 * p;
  let top = h * 0.5 - faceAt(t) * s;
  top = Math.min(0, Math.max(h - 1920 * s, top)) * p;
  const accent = (PANELS.find((q) => t >= q.a && t < q.b) ?? PANELS[0]).accent;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: seam, overflow: "hidden", background: `radial-gradient(ellipse at 50% 40%, #241a52, #05030f 75%)` }}>
        <div style={{ position: "absolute", left: 0, top: seam - SEAM, width: 1080, height: SEAM, opacity: Math.min(1, p * 1.4) }}>
          {PANELS.map((q, i) => {
            const A = f(q.a), B = f(q.b);
            const o = Math.min(interpolate(frame, [A, A + 8], [0, 1], clamp), interpolate(frame, [B - 8, B], [1, 0], clamp));
            if (frame < A || frame >= B) return null;
            return (
              <AbsoluteFill key={i} style={{ opacity: q.a === 0 ? Math.min(1, interpolate(frame, [B - 8, B], [1, 0], clamp)) : o, filter: o < 1 ? `blur(${(1 - o) * 6}px)` : undefined }}>
                <Sequence from={A} layout="none"><q.C /></Sequence>
              </AbsoluteFill>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: seam, width: 1080, height: h, overflow: "hidden", background: "#000" }}>
        <OffthreadVideo src={staticFile(BASE)} muted style={{ position: "absolute", left: (1080 - 1080 * s) / 2, top, width: 1080 * s, height: 1920 * s }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: seam - 3, height: 6, opacity: p, background: `linear-gradient(90deg, ${accent}, ${K.orange})`, boxShadow: `0 0 24px ${accent}` }} />
    </AbsoluteFill>
  );
};

/* captions: follow the seam smoothly; hidden while the red-collage effect shows the same words */
const words = D.words.map((w) => ({ ...w, w: w.w === "laptop," && w.s > 40 && w.s < 41 ? "laptop have?" : w.w })).filter((w) => !(w.w.toLowerCase() === "many" && w.s > 40.8 && w.s < 41.1)).map((w) => (w.w.toLowerCase() === "how" && w.s > 40.7 && w.s < 40.9 ? { ...w, w: "Comment" } : w));
const chunks = chunkWords(words, 3, 16);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t >= 28.65 && t < 32.75) return null;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const p = Easing.inOut(Easing.cubic)(splitAt(frame));
  const top = interpolate(p, [0, 1], [1440, SEAM - 52]);
  return (
    <div style={{ position: "absolute", top, left: 30, right: 30, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
        const sc = now ? interpolate(t - w.s, [0, 0.1], [1.12, 1], clamp) : 1;
        return <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 76, letterSpacing: -2, textTransform: "uppercase", color: now ? K.yellow : on ? "#fff" : "rgba(255,255,255,0.6)", transform: `scale(${sc})`, display: "inline-block", WebkitTextStroke: "3px #000", paintOrder: "stroke", textShadow: "0 6px 18px rgba(0,0,0,0.8)" }}>{w.w.replace(/[,.?]$/, "")}</span>;
      })}
    </div>
  );
};

export const Reel13v2: React.FC = () => {
  /* a few soft sounds only, each on a visible event */
  const sfx: [number, string, number][] = [
    [0.82, "swish", 0.16], [11.4, "glitch", 0.14], [14.8, "pop", 0.18], [19.6, "whoosh", 0.16], [20.9, "ding", 0.2],
    [28.65, "impact", 0.18], [35.72, "click", 0.18], [36.76, "click", 0.18], [37.52, "click", 0.18], [48.62, "click", 0.3],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(BASE)} muted style={{ width: "100%", height: "100%" }} />
      <Layout />
      <Captions />
      <Audio src={staticFile(BASE)} />
      <Music src="r/r13_music.wav" total={END} base={0.06} boosts={[[48.2, END, 0.1]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v} />)}
    </AbsoluteFill>
  );
};

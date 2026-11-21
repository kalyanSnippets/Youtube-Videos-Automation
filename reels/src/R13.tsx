import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import data from "../public/r/r13f_words.json";
import face from "../public/r/r13f_face.json";
import { f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, Flash, chunkWords, Counter } from "./lib";
import { K, ease, clamp, Split, Banner, Chip, Captions, Follow, FaceTrack, Float3D } from "./split";

/* Reel 13: "Shrink a massive AI model and run it on a normal laptop" (Saluki 27B by Underdog).
   Explainer style: each idea is built on screen in the order it is said. One premium 3D beat (Compress3D, rendered
   with Remotion + Three.js) shows the compression. On-screen facts, checked 2026-11-21:
   Saluki 27B = a 2-bit compressed Qwen3.8-27B, one 7.89 GB file vs about 54 GB for the full model, reported to run on
   a laptop with 16 GB RAM. Accuracy numbers are disputed between sources, so no percentage is shown. Times = final cut. */
const D = data as unknown as ReelData;
const FT = face as FaceTrack;
const VID = "r/r13f_aroll.mp4";
const END = D.duration + 0.6;
export const R13_FRAMES = Math.ceil(END * FPS);
const L = (abs: number, a: number) => f(abs) - f(a);

/* a chunky "AI model" file block */
const ModelBlock: React.FC<{ w: number; label: string; size: string; color?: string }> = ({ w, label, size, color = K.violet }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: w, height: w, position: "relative", transformStyle: "preserve-3d", transform: `rotateX(-18deg) rotateY(${30 + Math.sin(frame / 30) * 10}deg)` }}>
      {[["translateZ", 0], ["rotateY(90deg) translateZ", 1], ["rotateX(90deg) translateZ", 2]].map(([t, i]) => (
        <div key={i as number} style={{ position: "absolute", inset: 0, transform: `${t}(${w / 2}px)`, background: `linear-gradient(135deg, ${color}, #1e1b4b)`, border: "3px solid rgba(255,255,255,0.35)", backgroundImage: `linear-gradient(135deg, ${color}ee, #1e1b4bee), repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0 2px, transparent 2px ${w / 8}px), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 2px, transparent 2px ${w / 8}px)`, backgroundBlendMode: "overlay", opacity: i === 0 ? 1 : 0.85 }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: w * 0.3, transform: `translateZ(${w / 2 + 2}px)`, textAlign: "center", fontFamily: INTER, color: "#fff" }}>
        <div style={{ fontWeight: 900, fontSize: w * 0.17 }}>{size}</div>
        <div style={{ fontWeight: 800, fontSize: w * 0.08, opacity: 0.85 }}>{label}</div>
      </div>
    </div>
  );
};
const Laptop: React.FC<{ w: number; children?: React.ReactNode; tint?: string }> = ({ w, children, tint = "#0B0D10" }) => (
  <div style={{ width: w, position: "relative" }}>
    <div style={{ width: w, height: w * 0.62, background: tint, border: "10px solid #2b3039", borderRadius: 18, overflow: "hidden", position: "relative", boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>{children}</div>
    <div style={{ width: w * 1.16, marginLeft: -w * 0.08, height: w * 0.05, background: "linear-gradient(#9aa0aa,#5b616b)", borderRadius: "0 0 20px 20px" }} />
  </div>
);

/* 0.0 hook: a massive model next to a tiny normal laptop, then it shrinks toward the laptop */
const HookPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const shrink = interpolate(frame, [L(0.78, 0), L(1.9, 0)], [1, 0.45], { ...clamp, easing: ease });
  const fly = interpolate(frame, [L(2.5, 0), L(3.4, 0)], [0, 1], { ...clamp, easing: ease });
  return (
    <>
      <div style={{ position: "absolute", left: 300 + fly * 240, top: 230 + fly * 170, transform: `scale(${1.15 * shrink * (1 - fly * 0.45)})`, transformOrigin: "50% 50%", perspective: 1200 }}>
        <ModelBlock w={420} size="~54 GB" label="MASSIVE AI MODEL" />
      </div>
      <Float3D delay={L(2.46, 0)} spin={-60} style={{ position: "absolute", left: 560, top: 520 }}>
        <Laptop w={420}><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 900, fontSize: 40, color: K.mute }}>{fly > 0.9 ? <span style={{ color: K.green }}>✓ runs here?</span> : "normal laptop"}</div></Laptop>
      </Float3D>
      {frame >= L(0.78, 0) && <PopIn delay={L(0.78, 0)} style={{ position: "absolute", left: 60, top: 120 }}><Chip bg={K.yellow} size={44}>🗜️ SHRINK IT?</Chip></PopIn>}
    </>
  );
};

/* 6.2 the problem: download a big open-source model, laptop runs out of RAM */
const ProblemPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 6.2;
  const dl = interpolate(frame, [L(10.28, a), L(11.9, a)], [0, 100], clamp);
  const err = L(12.64, a);
  const shake = frame >= err && frame < err + 10 ? Math.sin(frame * 3) * 8 : 0;
  return (
    <>
      <Float3D delay={L(7.6, a)} spin={70} sway={4} tilt={-8} style={{ position: "absolute", left: 60, top: 140, width: 520 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "22px 24px", boxShadow: "0 30px 60px rgba(0,0,0,0.55)", fontFamily: INTER }}>
          <div style={{ fontWeight: 800, fontSize: 24, color: "#6B7280" }}>🤗 open-source model</div>
          <div style={{ fontWeight: 900, fontSize: 36, color: K.ink, marginTop: 6 }}>Amazing-AI-27B</div>
          <div style={{ fontFamily: MONO, fontSize: 24, color: "#374151", marginTop: 8 }}>model.safetensors · ~54 GB</div>
          <div style={{ marginTop: 16, display: "inline-block", background: K.blue, color: "#fff", fontWeight: 900, fontSize: 28, padding: "10px 20px", borderRadius: 12 }}>⬇ Download</div>
        </div>
      </Float3D>
      {frame >= L(10.28, a) && (
        <div style={{ position: "absolute", left: 470, top: 470, transform: `translateX(${shake}px)` }}>
          <Laptop w={540}>
            <div style={{ position: "absolute", inset: 0, padding: 30, fontFamily: MONO, color: "#E5E7EB", fontSize: 26 }}>
              <div>downloading… {Math.round(dl)}%</div>
              <div style={{ height: 20, background: K.line, borderRadius: 10, marginTop: 12 }}><div style={{ width: `${dl}%`, height: 20, background: K.blue, borderRadius: 10 }} /></div>
              <div style={{ marginTop: 26, fontFamily: INTER, fontWeight: 800 }}>RAM</div>
              <div style={{ height: 30, background: K.line, borderRadius: 8, marginTop: 8, overflow: "hidden" }}><div style={{ width: `${interpolate(frame, [err - 8, err + 4], [35, 100], clamp)}%`, height: 30, background: frame >= err ? K.red : K.green }} /></div>
            </div>
            {frame >= err && <PopIn delay={err} style={{ position: "absolute", left: 40, right: 40, top: 160 }}><div style={{ background: "#2a0f12", border: `3px solid ${K.red}`, borderRadius: 14, padding: "14px 18px", fontFamily: INTER, fontWeight: 900, fontSize: 30, color: "#fff" }}>⚠️ Not enough memory</div></PopIn>}
          </Laptop>
        </div>
      )}
    </>
  );
};

/* 14.2 the project: Saluki 27B by Underdog; compress an existing model instead of training a new one */
const SalukiPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 14.2;
  return (
    <>
      <PopIn delay={L(16.26, a)} style={{ position: "absolute", left: 60, top: 140 }}>
        <div style={{ display: "flex" }}>
          <div style={{ background: K.yellow, color: K.ink, fontFamily: INTER, fontWeight: 900, fontSize: 44, padding: "6px 20px" }}>PROJECT</div>
          <div style={{ background: "#fff", color: K.ink, fontFamily: INTER, fontWeight: 900, fontSize: 44, padding: "6px 20px" }}>by Underdog</div>
        </div>
      </PopIn>
      {frame >= L(16.6, a) && <PopIn delay={L(16.6, a)} style={{ position: "absolute", left: 60, top: 230 }}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 110, color: K.yellow, letterSpacing: -4, textShadow: "0 10px 40px rgba(0,0,0,0.6)" }}>Saluki 27B</div></PopIn>}
      {frame >= L(17.3, a) && <PopIn delay={L(17.3, a)} style={{ position: "absolute", left: 66, top: 375 }}><div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 32, color: K.mute }}>a compressed version of Alibaba's Qwen3.8-27B</div></PopIn>}
      <div style={{ position: "absolute", left: 60, right: 60, top: 480, display: "flex", gap: 30 }}>
        <Float3D delay={L(18.36, a)} spin={-90} sway={5} style={{ width: 465 }}>
          <div style={{ position: "relative", background: K.panel, border: `4px solid ${K.mute}`, borderRadius: 24, padding: "26px 22px", textAlign: "center", height: 300 }}>
            <div style={{ fontSize: 90 }}>🏗️</div>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 38, color: "#fff" }}>Train a new model</div>
            {frame >= L(19.94, a) && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 220, color: K.red, fontWeight: 900, transform: `scale(${interpolate(frame - L(19.94, a), [0, 6], [1.6, 1], clamp)})` }}>✕</div></div>}
          </div>
        </Float3D>
        <Float3D delay={L(20.72, a)} spin={90} sway={5} style={{ width: 465 }}>
          <div style={{ background: K.panel, border: `4px solid ${K.green}`, borderRadius: 24, padding: "26px 22px", textAlign: "center", height: 300, boxShadow: `0 0 50px ${K.green}44` }}>
            <div style={{ fontSize: 90 }}>🗜️</div>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 38, color: "#fff" }}>Compress an existing one</div>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 46, color: K.green, marginTop: 8 }}>✓</div>
          </div>
        </Float3D>
      </div>
    </>
  );
};

/* 21.3 the 3D compression beat (pre-rendered with Remotion + Three.js) */
const CompressPanel: React.FC = () => (
  <>
    <OffthreadVideo src={staticFile("b/r13_compress.mp4")} muted startFrom={50} style={{ position: "absolute", inset: 0, width: 1080, height: 960 }} />
    <PopIn delay={2} style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center" }}><Chip bg={K.green} size={44}>✓ compress an existing model</Chip></PopIn>
  </>
);

/* 22.9 the analogy: compressing a huge video file while keeping most of the quality */
const VideoPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 22.9;
  const k = interpolate(frame, [L(24.98, a), L(25.9, a)], [0, 1], { ...clamp, easing: ease });
  const Card: React.FC<{ size: string; sub: string; w: number; blur?: number; c: string }> = ({ size, sub, w, blur = 0, c }) => (
    <div style={{ width: w, background: K.panel, border: `4px solid ${c}`, borderRadius: 22, overflow: "hidden", boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 40px ${c}33` }}>
      <div style={{ height: w * 0.56, background: "linear-gradient(135deg,#f97316,#db2777 45%,#4f46e5)", position: "relative", filter: `blur(${blur}px)` }}>
        <div style={{ position: "absolute", left: "38%", top: "28%", width: "24%", height: "44%", borderRadius: 999, background: "rgba(255,255,255,0.9)" }} />
        <div style={{ position: "absolute", left: "47%", top: "40%", width: 0, height: 0, borderTop: `${w * 0.05}px solid transparent`, borderBottom: `${w * 0.05}px solid transparent`, borderLeft: `${w * 0.08}px solid #db2777` }} />
      </div>
      <div style={{ padding: "14px 18px", fontFamily: INTER }}>
        <div style={{ fontWeight: 900, fontSize: w * 0.09, color: "#fff" }}>🎬 {size}</div>
        <div style={{ fontWeight: 700, fontSize: w * 0.055, color: K.mute }}>{sub}</div>
      </div>
    </div>
  );
  return (
    <>
      <PopIn style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center" }}><Chip bg="#fff" size={40}>💡 Think of it like a video file</Chip></PopIn>
      <Float3D delay={L(24.14, a)} spin={-70} sway={4} tilt={8} style={{ position: "absolute", left: 50, top: 300 }}><Card size="HUGE video" sub="big file" w={470} c={K.mute} /></Float3D>
      {frame >= L(24.98, a) && (
        <>
          <div style={{ position: "absolute", left: 525, top: 470, width: 70 * k, height: 10, background: `linear-gradient(90deg, #fff, ${K.green})`, borderRadius: 5, boxShadow: `0 0 20px ${K.green}` }} />
          <div style={{ position: "absolute", left: 610, top: 340, transform: `scale(${0.4 + 0.6 * k})`, transformOrigin: "0 50%", opacity: k }}><Card size="smaller file" sub="most of the quality" w={400} blur={0.6} c={K.green} /></div>
        </>
      )}
    </>
  );
};

/* 27.7 the trade-off: easier to run locally, but accuracy can drop and memory still matters */
const CatchPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 27.7;
  const acc = interpolate(frame, [L(31.86, a), L(32.6, a)], [100, 86], clamp);
  return (
    <>
      <Float3D delay={0} spin={80} sway={4} style={{ position: "absolute", left: 60, right: 60, top: 140 }}>
        <div style={{ background: K.panel, border: `4px solid ${K.green}`, borderRadius: 24, padding: "22px 26px", fontFamily: INTER, fontWeight: 900, fontSize: 42, color: "#fff" }}>✓ Smaller = easier to run locally</div>
      </Float3D>
      {frame >= L(30.42, a) && <PopIn delay={L(30.42, a)} style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}><Chip bg={K.red} color="#fff" size={54}>⚠️ THE CATCH</Chip></PopIn>}
      {frame >= L(31.42, a) && (
        <Float3D delay={L(31.42, a)} spin={-90} sway={5} tilt={6} style={{ position: "absolute", left: 60, top: 450, width: 450 }}>
          <div style={{ background: "#0B0D10", border: `3px solid ${K.line}`, borderRadius: 22, padding: 22, fontFamily: INTER }}>
            <div style={{ fontWeight: 800, fontSize: 28, color: K.mute }}>ACCURACY</div>
            <div style={{ height: 34, background: K.line, borderRadius: 10, marginTop: 12, overflow: "hidden" }}><div style={{ width: `${acc}%`, height: "100%", background: `linear-gradient(90deg, ${K.green}, ${acc < 95 ? K.orange : K.green})` }} /></div>
            <div style={{ fontWeight: 900, fontSize: 34, color: K.orange, marginTop: 12 }}>can drop a bit</div>
          </div>
        </Float3D>
      )}
      {frame >= L(33.14, a) && (
        <Float3D delay={L(33.14, a)} spin={90} sway={5} tilt={-6} style={{ position: "absolute", left: 560, top: 450, width: 460 }}>
          <div style={{ background: "#0B0D10", border: `3px solid ${K.line}`, borderRadius: 22, padding: 22, fontFamily: INTER }}>
            <div style={{ fontWeight: 800, fontSize: 28, color: K.mute }}>MEMORY</div>
            <div style={{ fontWeight: 900, fontSize: 40, color: "#fff", marginTop: 10 }}>still needs enough RAM</div>
            <div style={{ fontWeight: 700, fontSize: 26, color: K.mute, marginTop: 8 }}>Saluki: reported to run on 16 GB</div>
          </div>
        </Float3D>
      )}
    </>
  );
};

/* 35.7 checklist before downloading any local model */
const ChecklistPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 35.7;
  const items: [string, string, number][] = [["📦", "File size", 38.38], ["🧠", "RAM requirements", 39.3], ["📊", "Benchmarks", 40.1]];
  return (
    <>
      <PopIn style={{ position: "absolute", left: 0, right: 0, top: 130, display: "flex", justifyContent: "center" }}><Chip bg={K.yellow} size={42}>Before you download any local model</Chip></PopIn>
      {items.map(([ic, t, at], i) => (
        <Float3D key={t} delay={L(at, a) - 4} spin={-80} sway={4} tilt={4 - i * 4} style={{ position: "absolute", left: 120, right: 120, top: 280 + i * 190 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, background: K.panel, border: `4px solid ${frame >= L(at, a) ? K.green : K.line}`, borderRadius: 24, padding: "22px 30px" }}>
            <div style={{ width: 70, height: 70, borderRadius: 16, border: `5px solid ${K.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 900, fontSize: 50, color: K.green }}>{frame >= L(at, a) ? "✓" : ""}</div>
            <div style={{ fontSize: 60 }}>{ic}</div>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 50, color: "#fff" }}>{t}</div>
          </div>
        </Float3D>
      ))}
    </>
  );
};

/* 40.7 the question: how much RAM, Windows or Mac */
const PollPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 40.7;
  const opts: [string, number][] = [["8 GB", 43.86], ["16 GB", 44.56], ["32 GB", 45.28]];
  const os: [string, string, number][] = [["🪟", "Windows", 47.84], ["🍎", "Mac", 50.1]];
  return (
    <>
      <PopIn style={{ position: "absolute", left: 60, right: 60, top: 130 }}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 66, color: "#fff", letterSpacing: -2, textAlign: "center" }}>How much RAM does<br />your laptop have?</div></PopIn>
      <div style={{ position: "absolute", left: 60, right: 60, top: 400, display: "flex", gap: 22 }}>
        {opts.map(([t, at], i) => (
          <Float3D key={t} delay={L(at, a)} spin={i % 2 ? -100 : 100} sway={6} style={{ width: 305 }}>
            <div style={{ background: [K.orange, K.yellow, K.green][i], borderRadius: 24, padding: "26px 0", textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 60, color: K.ink, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>{t}</div>
          </Float3D>
        ))}
      </div>
      <div style={{ position: "absolute", left: 160, right: 160, top: 600, display: "flex", gap: 30 }}>
        {os.map(([ic, t, at]) => (
          <Float3D key={t} delay={L(at, a) - 10} spin={80} sway={5} style={{ width: 365 }}>
            <div style={{ background: "#fff", borderRadius: 22, padding: "18px 0", textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 44, color: K.ink }}>{ic} {t}</div>
          </Float3D>
        ))}
      </div>
      {frame >= L(43.82, a) && <PopIn delay={L(43.82, a)} style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center" }}><Chip bg={K.blue} color="#fff" size={40}>💬 Comment your RAM + Windows/Mac</Chip></PopIn>}
    </>
  );
};

/* 50.9 the promised guide */
const GuidePanel: React.FC = () => (
  <>
    <Float3D spin={-80} sway={5} tilt={-6} style={{ position: "absolute", left: 230, top: 150 }}>
      <div style={{ width: 620, background: "#fff", borderRadius: 22, padding: "30px 30px", boxShadow: "0 30px 60px rgba(0,0,0,0.55)", fontFamily: INTER }}>
        <div style={{ fontWeight: 800, fontSize: 26, color: K.violet }}>COMING NEXT</div>
        <div style={{ fontWeight: 900, fontSize: 52, color: K.ink, lineHeight: 1.05, marginTop: 8 }}>Local AI setup guide</div>
        <div style={{ fontWeight: 700, fontSize: 30, color: "#4B5563", marginTop: 14 }}>planned from <b>your</b> answers</div>
        {["8 GB", "16 GB", "32 GB"].map((t, i) => <div key={t} style={{ marginTop: 14, height: 22, borderRadius: 11, background: ["#E9D5FF", "#DDD6FE", "#C4B5FD"][i], width: `${90 - i * 18}%` }} />)}
      </div>
    </Float3D>
  </>
);

type Seg = { a: number; b: number; split?: React.FC; accent?: string; over?: React.ReactNode };
const SEGS: Seg[] = [
  { a: 0, b: 3.9, split: HookPanel, accent: K.violet },
  { a: 4.0, b: 6.1, over: <Banner text="🤯 FASCINATING IDEA" top={180} size={62} /> },
  { a: 6.2, b: 14.1, split: ProblemPanel, accent: K.red },
  { a: 14.2, b: 20.55, split: SalukiPanel, accent: K.yellow },
  { a: 20.55, b: 22.9, split: CompressPanel, accent: K.blue },
  { a: 22.9, b: 27.6, split: VideoPanel, accent: K.green },
  { a: 27.7, b: 35.5, split: CatchPanel, accent: K.orange },
  { a: 35.6, b: 40.6, split: ChecklistPanel, accent: K.green },
  { a: 40.7, b: 50.8, split: PollPanel, accent: K.blue },
  { a: 50.8, b: 53.4, split: GuidePanel, accent: K.violet },
  { a: 53.44, b: END, over: <Follow top={180} /> },
];
const isSplit = (t: number) => SEGS.some((s) => s.split && t >= s.a && t < s.b);
const chunks = chunkWords(D.words, 3, 16);

export const Reel13: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "swish", 0.3], [0.78, "whoosh", 0.25], [2.46, "pop", 0.28], [4.0, "swish", 0.25],
    [6.2, "swish", 0.28], [7.6, "pop", 0.25], [10.28, "click", 0.4], [12.64, "glitch", 0.25],
    [14.2, "swish", 0.28], [16.6, "impact", 0.3], [19.94, "pop", 0.28], 
    [20.55, "whoosh", 0.28], [22.75, "ding", 0.3],
    [22.9, "swish", 0.25], [24.98, "whoosh", 0.22], [27.7, "swish", 0.25], [30.42, "glitch", 0.22],
    [35.6, "swish", 0.25], [38.38, "ding", 0.22], [39.3, "ding", 0.22], [40.1, "ding", 0.22],
    [40.7, "swish", 0.25], [43.86, "pop", 0.25], [44.56, "pop", 0.25], [45.28, "pop", 0.25],
    [50.8, "swish", 0.25], [54.4, "click", 0.4],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(VID)} muted style={{ width: "100%", height: "100%" }} />
      {SEGS.map((s, i) => (
        <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}>
          {s.split ? <Split video={VID} face={FT} offset={f(s.a)} accent={s.accent}><Flash dur={4} /><s.split /></Split> : s.over}
        </Sequence>
      ))}
      <Captions chunks={chunks} isSplit={isSplit} />
      <Audio src={staticFile(VID)} />
      <Music src="r/r13_music.wav" total={END} base={0.07} boosts={[[53.4, END, 0.12]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.3} />)}
    </AbsoluteFill>
  );
};

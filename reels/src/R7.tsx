import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, Img } from "remotion";
import data from "../public/r/r7f_words.json";
import { Aroll, Cursor, f, FPS, INTER, MONO, SERIF, Music, PopIn, ReelData, Sfx, SubscribeCard, Flash, chunkWords, activeChunk } from "./lib";

/* Reel 7: Tripo AI Agentic Canvas. Clean "3D studio / node canvas" look: warm paper background,
   dot grid, node cards with wires, a sketch robot that becomes a 3D character. All motion graphics. */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R7_FRAMES = Math.ceil(END * FPS);

export const C = { bg: "#F4F1EA", dot: "rgba(17,24,39,0.10)", ink: "#111827", mute: "#6B7280", orange: "#FF6A2B", violet: "#7C3AED", teal: "#14B8A6", yellow: "#FACC15", card: "#FFFFFF", line: "#D6D3CB" };
export const FACE_Y = 1152;
export const TOP = 280;

export const Canvas: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.dot} 2.5px, transparent 2.5px)`, backgroundSize: "40px 40px" }} />
    {children}
  </AbsoluteFill>
);

/* ---------- the robot: sketch → mesh → textured → rigged ---------- */
type Stage = "sketch" | "mesh" | "tex" | "rig";
export const Robot: React.FC<{ stage: Stage; draw?: number; size?: number; spin?: boolean; color?: string; wave?: boolean }> = ({ stage, draw = 1, size = 360, spin = true, color = C.orange, wave }) => {
  const frame = useCurrentFrame();
  const rot = spin && stage !== "sketch" ? Math.sin(frame / 28) * 28 : 0;
  const arm = wave ? Math.sin(frame / 5) * 25 : 0;
  const sk = stage === "sketch";
  const stroke = sk ? C.ink : "rgba(17,24,39,0.55)";
  const sw = sk ? 4 : 2;
  const fill = (base: string, id: string) => (sk ? "none" : stage === "mesh" ? "#CBD5E1" : `url(#${id})`);
  const dash = sk ? { strokeDasharray: 1000, strokeDashoffset: 1000 * (1 - draw) } : {};
  return (
    <div style={{ width: size, height: size * 1.3, transform: `perspective(900px) rotateY(${rot}deg)`, filter: sk ? undefined : "drop-shadow(0 30px 30px rgba(0,0,0,0.25))" }}>
      <svg viewBox="0 0 200 260" width="100%" height="100%">
        <defs>
          <linearGradient id="gHead" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="0.35" stopColor={color} /><stop offset="1" stopColor="#7c2d12" /></linearGradient>
          <linearGradient id="gBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E5E7EB" /><stop offset="0.5" stopColor="#94A3B8" /><stop offset="1" stopColor="#334155" /></linearGradient>
          <linearGradient id="gLimb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#475569" /><stop offset="0.5" stopColor="#CBD5E1" /><stop offset="1" stopColor="#334155" /></linearGradient>
          <pattern id="wire" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 10 L10 0 M0 0 L10 10" stroke="rgba(15,23,42,0.35)" strokeWidth="0.8" /></pattern>
        </defs>
        <g stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={dash}>
          <line x1="100" y1="20" x2="100" y2="6" />
          <circle cx="100" cy="5" r="5" fill={sk ? "none" : color} />
          <rect x="58" y="20" width="84" height="62" rx="18" fill={fill(color, "gHead")} />
          <rect x="52" y="92" width="96" height="88" rx="16" fill={fill("#94A3B8", "gBody")} />
          <g transform={`rotate(${-arm} 52 100)`}><rect x="26" y="98" width="22" height="70" rx="11" fill={fill("#64748B", "gLimb")} /></g>
          <rect x="152" y="98" width="22" height="70" rx="11" fill={fill("#64748B", "gLimb")} />
          <rect x="66" y="184" width="26" height="62" rx="12" fill={fill("#64748B", "gLimb")} />
          <rect x="108" y="184" width="26" height="62" rx="12" fill={fill("#64748B", "gLimb")} />
        </g>
        {stage === "mesh" && (
          <g opacity="0.9">
            <rect x="58" y="20" width="84" height="62" rx="18" fill="url(#wire)" />
            <rect x="52" y="92" width="96" height="88" rx="16" fill="url(#wire)" />
          </g>
        )}
        <circle cx="84" cy="50" r="9" fill={sk ? "none" : stage === "mesh" ? "#94A3B8" : "#67E8F9"} stroke={sk ? C.ink : "none"} strokeWidth={sw} style={dash} />
        <circle cx="116" cy="50" r="9" fill={sk ? "none" : stage === "mesh" ? "#94A3B8" : "#67E8F9"} stroke={sk ? C.ink : "none"} strokeWidth={sw} style={dash} />
        {(stage === "tex" || stage === "rig") && <rect x="80" y="118" width="40" height="26" rx="6" fill="#0F172A" stroke="#67E8F9" strokeWidth="2" />}
        {stage === "rig" && (
          <g stroke={C.violet} strokeWidth="3" fill={C.violet}>
            <line x1="100" y1="52" x2="100" y2="176" /><line x1="58" y1="104" x2="142" y2="104" />
            <line x1="58" y1="104" x2="37" y2="160" /><line x1="142" y1="104" x2="163" y2="160" />
            <line x1="100" y1="176" x2="79" y2="240" /><line x1="100" y1="176" x2="121" y2="240" />
            {[[100, 52], [100, 104], [58, 104], [142, 104], [37, 160], [163, 160], [100, 176], [79, 240], [121, 240]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" stroke="#fff" strokeWidth="2" />)}
          </g>
        )}
      </svg>
    </div>
  );
};

/* node card */
export const Node: React.FC<{ icon: string; title: string; state: "idle" | "run" | "done"; w?: number; accent?: string }> = ({ icon, title, state, w = 300, accent = C.orange }) => {
  const frame = useCurrentFrame();
  const glow = state === "run" ? 0.5 + 0.5 * Math.sin(frame / 3) : 0;
  return (
    <div style={{ width: w, background: C.card, borderRadius: 20, padding: "14px 18px", border: `3px solid ${state === "idle" ? C.line : accent}`, boxShadow: `0 10px 24px rgba(0,0,0,0.08), 0 0 ${30 * glow}px ${accent}`, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: state === "idle" ? "#F3F4F6" : `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{icon}</div>
      <div style={{ flex: 1, fontFamily: INTER, fontWeight: 800, fontSize: 28, color: C.ink, lineHeight: 1.1 }}>{title}</div>
      <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 26, color: state === "done" ? C.teal : state === "run" ? accent : C.mute }}>{state === "done" ? "✓" : state === "run" ? "●" : "○"}</div>
    </div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; delay?: number; top: number; size?: number }> = ({ children, bg = C.ink, color = "#fff", delay = 0, top, size = 44 }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <PopIn delay={delay}><div style={{ background: bg, color, fontFamily: INTER, fontWeight: 900, fontSize: size, padding: "12px 30px", borderRadius: 999, boxShadow: "0 12px 30px rgba(0,0,0,0.15)" }}>{children}</div></PopIn>
  </div>
);

/* pipeline steps: [icon, title, startSec (scene-local)] */
const STEPS: [string, string, Stage][] = [["🧠", "Plan steps", "sketch"], ["🧊", "3D model", "mesh"], ["🎨", "Textures", "tex"], ["📐", "Geometry", "tex"], ["🦴", "Rig · animation", "rig"]];


/* ---------- real tripo3d.ai page sections in a browser window ---------- */
type Box = { x: number; y: number; w: number; h: number; at: number; until?: number; label?: string; color?: string };
const SITE_W = 1000, SRC_W = 2160;
export const Site: React.FC<{ img: string; srcH: number; top?: number; boxes?: Box[]; zoom?: { at: number; z: number; ox: number; oy: number } }> = ({ img, srcH, top = 290, boxes = [], zoom }) => {
  const frame = useCurrentFrame();
  const k = SITE_W / SRC_W, h = Math.round(srcH * k);
  const zp = zoom ? interpolate(frame, [zoom.at, zoom.at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => 1 - Math.pow(1 - x, 3) }) : 0;
  const z = (1 + interpolate(frame, [0, 200], [0, 0.04], { extrapolateRight: "clamp" })) * (1 + (zoom ? zoom.z - 1 : 0) * zp);
  const origin = zoom ? `${zoom.ox * 100}% ${zoom.oy * 100}%` : "50% 50%";
  return (
    <PopIn from="up" style={{ position: "absolute", left: 40, top }}>
      <div style={{ width: SITE_W, borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.25)", background: "#0B0B0F" }}>
        <div style={{ height: 44, background: "#1F2023", display: "flex", alignItems: "center", gap: 9, padding: "0 16px" }}>
          {["#EF4444", "#F59E0B", "#22C55E"].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
          <div style={{ marginLeft: 12, flex: 1, height: 28, borderRadius: 14, background: "#2B2C30", color: "#A1A1AA", fontFamily: MONO, fontSize: 18, display: "flex", alignItems: "center", padding: "0 14px" }}>tripo3d.ai/features/3d-agentic-canvas</div>
        </div>
        <div style={{ width: SITE_W, height: h, overflow: "hidden", position: "relative" }}>
          <div style={{ width: SITE_W, height: h, transform: `scale(${z})`, transformOrigin: origin, position: "relative" }}>
            <Img src={staticFile(img)} style={{ width: SITE_W, height: h, display: "block" }} />
            {boxes.map((b, i) => {
              if (frame < b.at || (b.until !== undefined && frame >= b.until)) return null;
              const s = interpolate(frame - b.at, [0, 8], [1.15, 1], { extrapolateRight: "clamp" });
              const col = b.color ?? C.orange;
              return (
                <div key={i} style={{ position: "absolute", left: b.x * k, top: b.y * k, width: b.w * k, height: b.h * k, border: `6px solid ${col}`, borderRadius: 16, transform: `scale(${s})`, boxShadow: `0 0 30px ${col}` }}>
                  {b.label && <div style={{ position: "absolute", left: -6, top: -50, background: col, color: "#111", fontFamily: INTER, fontWeight: 900, fontSize: 28, padding: "4px 14px", borderRadius: 10, whiteSpace: "nowrap" }}>{b.label}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, textAlign: "right", fontFamily: INTER, fontWeight: 600, fontSize: 20, color: C.mute }}>Source: tripo3d.ai</div>
    </PopIn>
  );
};

/* ---------- scenes ---------- */
const S = {
  hook: () => {
    const frame = useCurrentFrame();
    const draw = interpolate(frame, [f(0.6), f(2.2)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <Canvas>
        <div style={{ position: "absolute", left: 70, top: TOP + 40, width: 400, height: 520, background: "#fff", borderRadius: 18, boxShadow: "0 20px 40px rgba(0,0,0,0.12)", transform: "rotate(-3deg)", display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "repeating-linear-gradient(0deg, transparent 0 38px, rgba(59,130,246,0.15) 38px 40px)" }}>
          <Robot stage="sketch" draw={draw} size={300} />
          <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 30, color: C.mute }}>my drawing ✏️</div>
        </div>
        <PopIn delay={f(3.3)} style={{ position: "absolute", left: 480, top: TOP + 250 }}><div style={{ fontSize: 90, color: C.orange, fontWeight: 900 }}>→</div></PopIn>
        <PopIn delay={f(4.2)} style={{ position: "absolute", right: 60, top: TOP + 60 }}>
          <div style={{ width: 400, height: 480, borderRadius: 24, border: `5px dashed ${C.orange}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(255,106,43,0.06)" }}>
            <div style={{ fontSize: 150, fontFamily: INTER, fontWeight: 900, color: C.orange }}>?</div>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 40, color: C.ink, textAlign: "center" }}>3D game<br />character</div>
          </div>
        </PopIn>
      </Canvas>
    );
  },
  work: () => (
    <AbsoluteFill>
      <Aroll data={D} src="r/r7f_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={840} zoom={1.3} alternate={false} offset={f(5.4)} />
      <Flash dur={4} />
      <div style={{ position: "absolute", top: 1300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn delay={3}><div style={{ background: "#fff", color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 64, padding: "14px 36px", borderRadius: 999, boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}>🤔 would it work?</div></PopIn>
      </div>
    </AbsoluteFill>
  ),
  intro: () => (
    <Canvas>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOP + 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <PopIn><div style={{ background: C.ink, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 34, padding: "8px 24px", borderRadius: 999 }}>NEW · Tripo AI</div></PopIn>
        <PopIn delay={f(1.9)}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 150, color: C.ink, letterSpacing: -6, lineHeight: 0.95, textAlign: "center" }}>Agentic<br /><span style={{ color: C.orange }}>Canvas</span></div></PopIn>
        <PopIn delay={f(2.3)}><div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 34, color: C.mute }}>beta · node-based 3D workflows</div></PopIn>
      </div>
    </Canvas>
  ),
  notOnly: () => {
    const frame = useCurrentFrame();
    const cross = interpolate(frame, [f(2.4), f(2.7)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const wf = frame >= f(2.7);
    return (
      <Canvas>
        {!wf ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: TOP + 120, display: "flex", justifyContent: "center" }}>
            <PopIn delay={f(0.8)}>
              <div style={{ position: "relative", transform: "scale(1.45)", marginTop: 160 }}>
                <Node icon="🧊" title="Generate one 3D object" state="done" w={640} />
                <div style={{ position: "absolute", left: -20, right: -20, top: "50%", height: 12, background: "#EF4444", borderRadius: 6, transform: `rotate(-4deg) scaleX(${cross})`, transformOrigin: "0 50%" }} />
              </div>
            </PopIn>
          </div>
        ) : (
          <div style={{ position: "absolute", left: 60, right: 60, top: TOP + 40, display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>
            {STEPS.map(([icon, title], i) => (
              <PopIn key={title} delay={f(2.75) + i * 4} from="left" style={{ marginLeft: (i % 2) * 160 - 80 }}><Node icon={icon} title={title} state="idle" w={520} /></PopIn>
            ))}
          </div>
        )}
        {wf && <Chip top={TOP + 680} delay={f(3.6)} bg={C.orange}>an entire 3D workflow</Chip>}
      </Canvas>
    );
  },
  upload: () => {
    const frame = useCurrentFrame();
    const p = interpolate(frame, [f(0.4), f(1.8)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const y = interpolate(frame, [0, f(0.6)], [-260, 0], { extrapolateRight: "clamp" });
    return (
      <Canvas>
        <div style={{ position: "absolute", left: 140, right: 140, top: TOP + 40, height: 560, borderRadius: 30, border: `5px dashed ${p >= 1 ? C.teal : C.line}`, background: "rgba(255,255,255,0.7)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div style={{ transform: `translateY(${y}px) rotate(-3deg)`, background: "#fff", borderRadius: 14, padding: 12, boxShadow: "0 16px 30px rgba(0,0,0,0.15)" }}><Robot stage="sketch" size={200} /></div>
          <div style={{ width: 460, height: 18, borderRadius: 9, background: "#E5E7EB", overflow: "hidden" }}><div style={{ width: `${p * 100}%`, height: "100%", background: C.teal }} /></div>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 30, color: p >= 1 ? C.teal : C.mute }}>{p >= 1 ? "✓ robot.png uploaded" : "uploading robot.png…"}</div>
        </div>
      </Canvas>
    );
  },
  pipeline: () => {
    const frame = useCurrentFrame();
    // scene starts at 16.4s; step start times (absolute) → local
    const at = [16.98, 17.86, 19.26, 20.08, 21.36].map((t) => f(t - 16.4));
    const cur = at.filter((a) => frame >= a).length - 1;
    const stage: Stage = cur < 1 ? "sketch" : STEPS[cur][2];
    return (
      <Canvas>
        <div style={{ position: "absolute", left: 40, top: TOP + 10, width: 460, height: 620, borderRadius: 28, background: "linear-gradient(160deg,#fff,#ECE8DF)", border: `3px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 14, left: 18, fontFamily: MONO, fontWeight: 800, fontSize: 22, color: C.mute }}>PREVIEW</div>
          <div style={{ position: "absolute", bottom: 40, width: 300, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.12)" }} />
          <Robot stage={stage} size={330} wave={stage === "rig" && frame >= at[4] + 10} />
        </div>
        <div style={{ position: "absolute", right: 30, top: TOP + 10, width: 520, display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map(([icon, title], i) => (
            <React.Fragment key={title}>
              <PopIn delay={Math.max(0, at[i] - 6)} from="right"><Node icon={icon} title={title} state={cur > i ? "done" : cur === i ? "run" : "idle"} w={520} /></PopIn>
              {i < STEPS.length - 1 && <div style={{ marginLeft: 50, width: 6, height: 10, background: cur > i ? C.orange : C.line, borderRadius: 3 }} />}
            </React.Fragment>
          ))}
        </div>
      </Canvas>
    );
  },
  siteIntro: () => (
    <>
      <Site img="img/tripo_hero.png" srcH={1560} boxes={[{ x: 120, y: 520, w: 960, h: 180, at: f(8.5 - 6.5), label: "NEW" }]} />
    </>
  ),
  siteWorkflow: () => {
    const frame = useCurrentFrame();
    const cross = interpolate(frame, [f(2.4), f(2.7)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return frame < f(2.75) ? (
      <Canvas>
        <div style={{ position: "absolute", left: 0, right: 0, top: TOP + 280, display: "flex", justifyContent: "center" }}>
          <PopIn delay={f(0.8)}>
            <div style={{ position: "relative", transform: "scale(1.45)" }}>
              <Node icon="🧊" title="Generate one 3D object" state="done" w={640} />
              <div style={{ position: "absolute", left: -20, right: -20, top: "50%", height: 12, background: "#EF4444", borderRadius: 6, transform: `rotate(-4deg) scaleX(${cross})`, transformOrigin: "0 50%" }} />
            </div>
          </PopIn>
        </div>
      </Canvas>
    ) : (
      <Sequence from={f(2.75)} layout="none">
        <Canvas><Site img="img/tripo_steps.png" srcH={1500} boxes={[{ x: 40, y: 150, w: 2080, h: 90, at: 8, label: "the whole workflow" }]} /></Canvas>
      </Sequence>
    );
  },
  siteUpload: () => (
    <Site img="img/tripo_steps.png" srcH={1500} zoom={{ at: 4, z: 1.35, ox: 0.5, oy: 0.45 }} boxes={[{ x: 1248, y: 352, w: 604, h: 768, at: f(0.4), label: "upload a picture" }, { x: 0, y: 352, w: 680, h: 316, at: f(1.4), color: C.teal }]} />
  ),
  sitePipeline: () => {
    const L = (t: number) => f(t - 16.4);
    const frame = useCurrentFrame();
    return (
      <>
      {frame >= L(16.98) && frame < L(17.86) + 6 && <Chip top={TOP + 790} bg={C.orange}>🧠 AI plans the steps</Chip>}
      <Site img="img/tripo_nodes.png" srcH={1520} boxes={[
        { x: 700, y: 40, w: 760, h: 140, at: L(16.98), until: L(17.86) },
        { x: 0, y: 240, w: 568, h: 540, at: L(17.86), label: "3D model" },
        { x: 800, y: 840, w: 600, h: 600, at: L(19.26), label: "textures" },
        { x: 1268, y: 240, w: 612, h: 540, at: L(20.08), label: "geometry" },
        { x: 160, y: 840, w: 592, h: 600, at: L(21.36), label: "animation" },
      ]} />
      </>
    );
  },
  siteReview: () => (
    <>
      <Site img="img/tripo_steps.png" srcH={1500} boxes={[{ x: 0, y: 740, w: 680, h: 180, at: f(0.5), color: C.violet, label: "review each step" }]} />
      <Chip top={TOP + 760} delay={f(2.2)} bg={C.violet}>✏️ change one step · no restart</Chip>
    </>
  ),
  interesting: () => (
    <AbsoluteFill>
      <Aroll data={D} src="r/r7f_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={840} zoom={1.25} alternate={false} offset={f(22.8)} />
      <div style={{ position: "absolute", top: 1300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn delay={6}><div style={{ background: C.yellow, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 60, padding: "14px 34px", borderRadius: 999 }}>⭐ the best part</div></PopIn>
      </div>
    </AbsoluteFill>
  ),
  review: () => {
    const frame = useCurrentFrame();
    const clickT = f(1.1), rerun = f(1.9), done = f(2.9);
    const color = frame >= done ? C.teal : C.orange;
    return (
      <Canvas>
        <div style={{ position: "absolute", left: 40, top: TOP + 10, width: 460, height: 620, borderRadius: 28, background: "linear-gradient(160deg,#fff,#ECE8DF)", border: `3px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Robot stage="rig" size={330} color={color} />
        </div>
        <div style={{ position: "absolute", right: 30, top: TOP + 10, width: 520, display: "flex", flexDirection: "column", gap: 26 }}>
          {STEPS.map(([icon, title], i) => {
            const isTex = i === 2;
            const st = isTex && frame >= rerun && frame < done ? "run" : "done";
            return (
              <div key={title} style={{ transform: `scale(${isTex && frame >= clickT ? 1.06 : 1})`, opacity: !isTex && frame >= clickT ? 0.55 : 1 }}>
                <Node icon={icon} title={isTex && frame >= clickT ? "Textures · teal" : title} state={st} w={520} accent={isTex ? C.violet : C.orange} />
              </div>
            );
          })}
        </div>
        <Cursor path={[[0, 900, 1100], [f(0.9), 760, 640], [f(1.6), 765, 645]]} clicks={[clickT]} color={C.ink} />
        <Chip top={TOP + 680} delay={f(2.2)} bg={C.violet}>✏️ change one step · no restart</Chip>
      </Canvas>
    );
  },
  comment: () => {
    const opts: [string, string, number][] = [["🤖", "Robot", 30.28], ["🐉", "Dragon", 30.78], ["🦸", "Superhero", 31.3]];
    return (
      <Canvas>
        <PopIn style={{ position: "absolute", top: TOP + 20, left: 0, right: 0, textAlign: "center" }}><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 36, color: C.mute }}>💬 COMMENT ONE</div></PopIn>
        <div style={{ position: "absolute", top: TOP + 100, left: 40, right: 40, display: "flex", justifyContent: "center", gap: 24 }}>
          {opts.map(([e, t, s], i) => (
            <PopIn key={t} delay={f(s - 28.0)} from="up">
              <div style={{ width: 300, height: 340, background: "#fff", borderRadius: 28, border: `4px solid ${[C.orange, C.teal, C.violet][i]}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, boxShadow: "0 16px 30px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: 130 }}>{e}</div>
                <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 46, color: C.ink }}>{t}</div>
              </div>
            </PopIn>
          ))}
        </div>
        <Chip top={TOP + 500} delay={f(32.06 - 28.0)} bg={C.orange}>🧪 I'll build the winner for real</Chip>
      </Canvas>
    );
  },
  subscribe: () => (
    <Canvas>
      <div style={{ position: "absolute", top: TOP + 20, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn from="up"><SubscribeCard clickAt={f(1.0)} accent="#EF4444" sub="Real AI experiments" avatarSrc="img/ch_BEp74aewRSA.jpg" /></PopIn>
      </div>
      <Cursor path={[[0, 900, 1250], [f(0.7), 560, 870], [f(1.4), 580, 880]]} clicks={[f(1.0)]} color={C.ink} />
      <Chip top={TOP + 560} delay={f(3.2)} bg={C.ink}>worth using? 👀 find out</Chip>
    </Canvas>
  ),
};

type Scene = { a: number; b: number; body: React.FC; face?: boolean };
const SCENES: Scene[] = [
  { a: 0.0, b: 5.4, body: S.hook, face: true },
  { a: 5.4, b: 6.5, body: S.work },
  { a: 6.5, b: 9.3, body: () => <Canvas><S.siteIntro /></Canvas>, face: true },
  { a: 9.3, b: 14.2, body: S.siteWorkflow, face: true },
  { a: 14.2, b: 16.4, body: () => <Canvas><S.siteUpload /></Canvas>, face: true },
  { a: 16.4, b: 22.8, body: () => <Canvas><S.sitePipeline /></Canvas>, face: true },
  { a: 22.8, b: 24.35, body: S.interesting },
  { a: 24.35, b: 28.0, body: () => <Canvas><S.siteReview /></Canvas>, face: true },
  { a: 28.0, b: 34.6, body: S.comment, face: true },
  { a: 34.6, b: END, body: S.subscribe, face: true },
];

const chunks = chunkWords(D.words, 3, 18);
const FULL = SCENES.filter((s) => !s.face);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const full = FULL.some((s) => t >= s.a && t < s.b);
  return (
    <div style={{ position: "absolute", top: full ? 180 : 120, left: 40, right: 40, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const hot = /^(Tripo|Agentic|Canvas|3D|robot|dragon|superhero|textures|geometry|animation|workflow)/i.test(w.w);
        return (
          <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 84, letterSpacing: -2, color: on ? (hot ? C.orange : full ? "#fff" : C.ink) : full ? "rgba(255,255,255,0.45)" : "rgba(17,24,39,0.28)", textShadow: full ? "0 4px 18px rgba(0,0,0,0.8)" : "0 2px 0 rgba(255,255,255,0.8)" }}>
            {w.w.replace(/[,.?]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

export const Reel7: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "swish", 0.3], [0.6, "typing", 0.3], [3.3, "whoosh", 0.25], [4.2, "pop"], [5.4, "impact", 0.4], [6.5, "whoosh", 0.3], [8.4, "pop"],
    [9.3, "swish", 0.3], [11.7, "swish", 0.4], [12.0, "pop", 0.3], [12.15, "pop", 0.3], [12.3, "pop", 0.3], [12.45, "pop", 0.3], [12.6, "pop", 0.3],
    [14.2, "whoosh", 0.3], [16.0, "ding", 0.25], [16.4, "swish", 0.3], [16.98, "blip", 0.35], [17.86, "blip", 0.35], [19.26, "blip", 0.35], [20.08, "blip", 0.35], [21.36, "blip", 0.35], [22.0, "ding", 0.25],
    [22.8, "impact", 0.35], [24.35, "whoosh", 0.3], [25.45, "click", 0.6], [26.25, "blip", 0.35], [27.25, "ding", 0.25],
    [28.0, "whoosh", 0.3], [30.28, "pop"], [30.78, "pop"], [31.3, "pop"], [32.06, "ding", 0.25], [34.6, "whoosh", 0.3], [35.6, "click", 0.6], [35.66, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SCENES.map((s, i) => {
        const from = f(s.a);
        const Body = s.body;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, f(s.b) - from)}>
            <Body />
            {s.face && (
              <>
                <Aroll data={D} src="r/r7f_aroll.mp4" box={{ x: 0, y: FACE_Y, w: 1080, h: 1920 - FACE_Y }} focusY={760} zoom={1.0} offset={from} />
                <div style={{ position: "absolute", left: 0, right: 0, top: FACE_Y - 4, height: 8, background: `linear-gradient(90deg, ${C.orange}, ${C.violet})` }} />
              </>
            )}
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("r/r7f_aroll.mp4")} />
      <Music src="r/r7_music.wav" total={END} base={0.12} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

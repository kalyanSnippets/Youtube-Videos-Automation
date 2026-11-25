import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import data from "../public/r/r16_words.json";
import face from "../public/r/r16_face.json";
import { f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, chunkWords, activeChunk, Typewriter } from "./lib";
import { ease, clamp, Screen3D, FaceTrack } from "./split";

/* Reel 16: GitHub Goldmine EP 3, Paperclip AI (open-source app to run AI agents like a company).
   Style: mix of A (animated AI-agent org chart, zooms into each department, checkmarks, light pings) and
   B (split screen: graphics on top, face below, series badge, real GitHub stat cards, boxed captions, follow CTA).
   Real footage: github.com/paperclipai/paperclip recorded 2026-11-25 (117k stars, 19.4k forks, MIT licence) and the
   product demo video embedded in its README. Times = seconds on the final cut (56.06 s + 3 s outro). */
const D = data as unknown as ReelData;
const FT = face as FaceTrack & { cx: number[] };
const BASE = "r/r16fx_aroll.mp4";
const OUTRO = 3.0;
const END = D.duration + OUTRO;
export const R16_FRAMES = Math.ceil(END * FPS);
const Y = "#FFE14D", CY = "#5CF2FF", VI = "#A78BFA", GR = "#34D399", RD = "#FF5A5A";
const L = (abs: number, a: number) => f(abs) - f(a);
const faceAt = (t: number) => { const i = Math.max(0, FT.t.findIndex((x) => x > t) - 1); return { cy: FT.cy[i] }; };

/* ---------- shared pieces ---------- */
const Hud: React.FC<{ at: number; y: number; color?: string; size?: number; children: React.ReactNode; out?: number }> = ({ at, y, color = CY, size = 44, children, out }) => {
  const frame = useCurrentFrame();
  if (frame < at || (out !== undefined && frame >= out)) return null;
  const k = interpolate(frame - at, [0, 7], [0, 1], { ...clamp, easing: ease });
  const b = 22;
  const br = (s: React.CSSProperties) => <div style={{ position: "absolute", width: b, height: b, borderColor: color, borderStyle: "solid", borderWidth: 0, ...s }} />;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", padding: "14px 26px", background: "rgba(6,10,18,0.78)", backdropFilter: "blur(6px)", opacity: k, transform: `translateY(${(1 - k) * 24}px)` }}>
        {br({ left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4 })}{br({ right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4 })}
        {br({ left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4 })}{br({ right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4 })}
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: size, color: "#fff", whiteSpace: "nowrap" }}>{children}</div>
      </div>
    </div>
  );
};
const Title: React.FC<{ at?: number; children: React.ReactNode; color?: string; top?: number }> = ({ at = 0, children, color = "#fff", top = 54 }) => (
  <PopIn delay={at} from="down" dist={30} style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 56, letterSpacing: -1.5, color, textTransform: "uppercase", textShadow: "0 6px 20px rgba(0,0,0,0.6)" }}>{children}</PopIn>
);
const Chip: React.FC<{ at: number; color?: string; children: React.ReactNode }> = ({ at, color = Y, children }) => (
  <PopIn delay={at} from="up" dist={40}>
    <div style={{ background: "rgba(8,12,22,0.9)", border: `3px solid ${color}`, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 40, padding: "12px 24px", borderRadius: 18, boxShadow: `0 10px 30px ${color}44`, whiteSpace: "nowrap" }}>{children}</div>
  </PopIn>
);
const Grid: React.FC<{ tint?: string }> = ({ tint = "#1b1440" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${tint}, #06060f 75%)` }}>
      <AbsoluteFill style={{ opacity: 0.18, backgroundImage: "linear-gradient(rgba(167,139,250,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px", backgroundPosition: `0 ${frame * 0.6}px` }} />
    </AbsoluteFill>
  );
};
/* Paperclip mark (drawn, not the official asset): black rounded tile with a white clip */
const ClipMark: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect x="2" y="2" width="96" height="96" rx="22" fill="#111" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
    <path d="M62 30 L38 54 a8 8 0 0 0 11 11 L71 43 a14 14 0 0 0 -20 -20 L28 46 a20 20 0 0 0 28 28 L72 58" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* split: graphic on top, face below */
const Split: React.FC<{ offset: number; fadeIn?: boolean; fadeOut?: boolean; children: React.ReactNode }> = ({ offset, fadeIn = true, fadeOut, children }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 14], [1.04, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fade = fadeIn ? interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: ease }) : 1;
  const panelIn = interpolate(frame, [0, 10], [0, 1], { ...clamp, easing: ease });
  const { durationInFrames: dur } = useVideoConfig();
  const out = !fadeOut ? 1 : interpolate(frame, [dur - 8, dur], [1, 0], { ...clamp, easing: ease });
  const slide = fadeIn ? (1 - fade) * -70 : 0;
  const t = (frame + offset) / FPS; const s = 0.86, h = 960;
  let top = h * 0.52 - faceAt(t).cy * s; top = Math.min(0, Math.max(h - 1920 * s, top));
  return (
    <AbsoluteFill style={{ opacity: Math.min(fade, out) }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 960, overflow: "hidden", background: "#06060f" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${slide}px) scale(${z})` }}>{children}</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 960, width: 1080, height: 960, overflow: "hidden", background: "#000" }}>
        <OffthreadVideo src={staticFile(BASE)} muted startFrom={offset} style={{ position: "absolute", left: (1080 - 1080 * s) / 2, top, width: 1080 * s, height: 1920 * s }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 957, height: 6, background: `linear-gradient(90deg, ${VI}, ${CY})` }} />
    </AbsoluteFill>
  );
};

/* agent node used by the org chart beats */
const Node: React.FC<{ x: number; y: number; icon: string; role: string; sub?: string; color: string; at: number; dim?: number; glow?: number; w?: number }> = ({ x, y, icon, role, sub, color, at, dim = 0, glow = 0, w = 300 }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame - at, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.7)) });
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, transform: `scale(${k})`, opacity: 1 - dim * 0.6, filter: dim ? `grayscale(${dim * 0.8})` : undefined }}>
      <div style={{ background: "linear-gradient(180deg, rgba(30,24,64,0.95), rgba(12,10,28,0.95))", border: `3px solid ${color}`, borderRadius: 26, padding: "20px 16px 18px", textAlign: "center", boxShadow: `0 0 ${20 + glow * 60}px ${color}${glow ? "cc" : "55"}` }}>
        <div style={{ fontSize: 84, lineHeight: 1 }}>{icon}</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 40, color: "#fff", marginTop: 10, letterSpacing: -0.5 }}>{role}</div>
        {sub && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, color, marginTop: 6 }}>{sub}</div>}
      </div>
    </div>
  );
};
/* line that draws itself, with a light ping travelling along it */
const Wire: React.FC<{ x1: number; y1: number; x2: number; y2: number; at: number; color?: string; ping?: boolean }> = ({ x1, y1, x2, y2, at, color = VI, ping = true }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame - at, [0, 12], [0, 1], { ...clamp, easing: ease });
  const len = Math.hypot(x2 - x1, y2 - y1);
  const p = ((frame - at) % 36) / 36;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={960}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={5} strokeOpacity={0.7} strokeDasharray={len} strokeDashoffset={len * (1 - k)} strokeLinecap="round" />
      {ping && k >= 1 && <circle cx={x1 + (x2 - x1) * p} cy={y1 + (y2 - y1) * p} r={10} fill="#fff" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />}
    </svg>
  );
};

/* ---------- beats ---------- */
const Badge: React.FC = () => {
  const k = interpolate(useCurrentFrame(), [2, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <div style={{ position: "absolute", left: 40, top: 40, transform: `scale(${k})`, transformOrigin: "0 50%", display: "flex", boxShadow: "0 14px 34px rgba(0,0,0,0.45)", zIndex: 5 }}>
      <div style={{ background: "#111", color: Y, fontFamily: MONO, fontWeight: 800, fontSize: 34, padding: "10px 16px", border: `3px solid ${Y}` }}>⛏ GITHUB GOLDMINE</div>
      <div style={{ background: Y, color: "#111", fontFamily: MONO, fontWeight: 900, fontSize: 34, padding: "10px 16px" }}>EP 3</div>
    </div>
  );
};

/* 0–3.3: a "company" of 12 seats; 11 become AI agents, one human stays */
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const flipAt = (i: number) => L(1.1, 0) + i * 2;
  const human = 5;
  return (
    <AbsoluteFill>
      <Grid />
      <Badge />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 64, color: "#fff", letterSpacing: -2 }}>
        THE NEXT <span style={{ color: Y }}>$1,000,000,000</span><br />COMPANY
      </div>
      <div style={{ position: "absolute", left: 120, top: 370, width: 840, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 26 }}>
        {Array.from({ length: 12 }, (_, i) => {
          const k = interpolate(frame - i * 1.5, [0, 8], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
          const isH = i === human;
          const bot = !isH && frame >= flipAt(i);
          const flip = isH ? 0 : interpolate(frame - flipAt(i), [-4, 0, 4], [0, 90, 0], clamp);
          const hl = isH && frame >= L(2.0, 0);
          return (
            <div key={i} style={{ height: 118, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70, transform: `scale(${k * (hl ? 1.12 : 1)}) rotateY(${flip}deg)`,
              background: hl ? "rgba(255,225,77,0.18)" : bot ? "rgba(92,242,255,0.10)" : "rgba(255,255,255,0.08)", border: `3px solid ${hl ? Y : bot ? CY + "88" : "rgba(255,255,255,0.2)"}`, boxShadow: hl ? `0 0 40px ${Y}aa` : undefined }}>
              {isH ? "🧑" : bot ? "🤖" : "🧑‍💼"}
            </div>
          );
        })}
      </div>
      {frame >= L(2.1, 0) && <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", gap: 24 }}>
        <Chip at={L(2.1, 0)} color={Y}>🧑 1 HUMAN</Chip><Chip at={L(2.4, 0)} color={CY}>🤖 11 AI AGENTS</Chip>
      </div>}
    </AbsoluteFill>
  );
};

const CrazyTag: React.FC = () => <Hud at={4} y={150} color={Y} size={52}>🤯 SOUNDS CRAZY?</Hud>;

/* 6.44–14.54: the normal way: a whole team before launch */
const OldTeam: React.FC = () => {
  const a = 6.44, frame = useCurrentFrame();
  const kids: [string, string, number, number][] = [["👨‍💻", "DEVELOPERS", 10.07, 220], ["🎨", "DESIGNERS", 10.61, 540], ["📣", "MARKETERS", 10.87, 860]];
  const team = frame >= L(12.09, a);
  return (
    <AbsoluteFill>
      <Grid tint="#1a1f2e" />
      <Title at={L(6.59, a)}>Starting a software company?</Title>
      <Node x={540} y={170} icon="👔" role="CEO" color="#9CA3AF" at={L(8.89, a)} w={280} />
      {kids.map(([ic, r, t, x], i) => <React.Fragment key={i}><Wire x1={540} y1={400} x2={x} y2={470} at={L(t, a) - 4} color="#9CA3AF" ping={false} /><Node x={x} y={470} icon={ic} role={r} color="#9CA3AF" at={L(t, a)} w={290} /></React.Fragment>)}
      {team && <div style={{ position: "absolute", left: 50, top: 150, width: 980, height: 560, border: `4px dashed ${Y}`, borderRadius: 30, opacity: interpolate(frame - L(12.09, a), [0, 8], [0, 1], clamp) }} />}
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center", gap: 24 }}>
        <Chip at={L(12.19, a)} color={Y}>👥 A WHOLE TEAM</Chip>
        <Chip at={L(13.69, a)} color={RD}>🚀 LAUNCHED: 0</Chip>
      </div>
    </AbsoluteFill>
  );
};

/* 14.54–19.69: real GitHub repo */
const Repo: React.FC = () => {
  const a = 14.54;
  return (
    <AbsoluteFill>
      <Grid tint="#101a2e" />
      <PopIn delay={L(16.39, a)} from="down" dist={30} style={{ position: "absolute", left: 0, right: 0, top: 44, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
        <ClipMark size={84} /><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 72, color: "#fff", letterSpacing: -2 }}>Paperclip AI</div>
      </PopIn>
      <div style={{ position: "absolute", left: 70, top: 160 }}>
        <Screen3D src="b/r16/gh_topf.mp4" w={940} url="github.com/paperclipai/paperclip" rotY={-5} sway={2.5} glow={VI} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center", gap: 20 }}>
        <Chip at={L(15.09, a)} color={Y}>⭐ 117K STARS</Chip>
        <Chip at={L(15.49, a)} color={GR}>🔓 OPEN SOURCE · MIT</Chip>
      </div>
    </AbsoluteFill>
  );
};

/* 19.69–27.24: AI agents organised like a company; zoom into CEO, developer, marketing */
const AgentOrg: React.FC = () => {
  const a = 19.69, frame = useCurrentFrame();
  const focus = [[L(23.89, a), 540, 250], [L(25.19, a), 230, 560], [L(26.54, a), 850, 560]] as const;
  let fi = -1; focus.forEach(([t], i) => { if (frame >= t) fi = i; });
  const fk = fi < 0 ? 0 : interpolate(frame - focus[fi][0], [0, 9], [0, 1], { ...clamp, easing: ease });
  const prev = fi <= 0 ? [540, 480] : [focus[fi - 1][1], focus[fi - 1][2]];
  const cx = fi < 0 ? 540 : prev[0] + (focus[fi][1] - prev[0]) * fk, cy = fi < 0 ? 480 : prev[1] + (focus[fi][2] - prev[1]) * fk;
  const sc = fi < 0 ? 1 : fi === 0 ? 1 + 0.28 * fk : 1.28;
  const tx = (540 - cx) * (sc - 1) / sc * 1.4, ty = (480 - cy) * (sc - 1) / sc * 1.4;
  const dim = (i: number) => (fi >= 0 && fi !== i ? 1 : 0), glow = (i: number) => (fi === i ? 1 : 0);
  return (
    <AbsoluteFill>
      <Grid />
      <Title at={L(19.79, a)} top={36}>AI agents = <span style={{ color: CY }}>a company</span></Title>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${sc}) translate(${tx}px, ${ty}px)` }}>
        <Wire x1={540} y1={420} x2={230} y2={540} at={L(21.89, a)} color={CY} />
        <Wire x1={540} y1={420} x2={850} y2={540} at={L(22.09, a)} color={CY} />
        <Wire x1={385} y1={680} x2={695} y2={680} at={L(22.39, a)} color={VI} />
        <Node x={540} y={170} icon="🤖" role="CEO AGENT" sub="plans · delegates" color={Y} at={L(20.99, a)} dim={dim(0)} glow={glow(0)} />
        <Node x={230} y={540} icon="🤖" role="DEVELOPER" sub="writes the code" color={CY} at={L(21.49, a)} dim={dim(1)} glow={glow(1)} />
        <Node x={850} y={540} icon="🤖" role="MARKETING" sub="launch · content" color={"#F472B6"} at={L(21.69, a)} dim={dim(2)} glow={glow(2)} />
      </div>
    </AbsoluteFill>
  );
};

/* 27.24–33.69: one goal -> tasks -> agents coordinate */
const GoalTasks: React.FC = () => {
  const a = 27.24, frame = useCurrentFrame();
  const split = L(31.34, a);
  const cols: [string, string, string, number][] = [["CEO", "Plan the features", Y, 200], ["DEV", "Build the app", CY, 540], ["MKT", "Plan the launch", "#F472B6", 880]];
  return (
    <AbsoluteFill>
      <Grid />
      <PopIn delay={L(27.39, a)} from="down" dist={40} style={{ position: "absolute", left: 90, right: 90, top: 70 }}>
        <div style={{ background: "rgba(255,225,77,0.12)", border: `4px solid ${Y}`, borderRadius: 28, padding: "26px 30px", boxShadow: `0 0 40px ${Y}55` }}>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 34, color: Y }}>🎯 ONE GOAL</div>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 54, color: "#fff", marginTop: 8, minHeight: 66 }}>
            <Typewriter text="Build a simple productivity app" delay={L(28.84, a)} cps={26} caretColor={Y} />
          </div>
        </div>
      </PopIn>
      {cols.map(([who, task, c, x], i) => {
        const at = split + i * 3, show = L(27.89, a) + i * 3;
        const k = interpolate(frame - show, [0, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
        const got = frame >= at, flash = interpolate(frame - at, [0, 4, 14], [0, 1, 0], clamp);
        const done = frame >= L(32.49 + i * 0.4, a);
        if (frame < show) return null;
        return (
          <React.Fragment key={i}>
            {got && <Wire x1={540} y1={290} x2={x} y2={420} at={at - 3} color={c} />}
            <div style={{ position: "absolute", left: x - 155, top: 420 + (1 - k) * 60, width: 310, transform: `scale(${0.6 + 0.4 * k})`, opacity: k * (got ? 1 : 0.55) }}>
              <div style={{ background: "rgba(14,12,32,0.95)", border: `3px solid ${c}`, borderRadius: 22, padding: "20px 18px", textAlign: "center", boxShadow: `0 0 ${flash * 50}px ${c}` }}>
                <div style={{ fontSize: 64 }}>🤖</div>
                <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 30, color: c }}>{who} AGENT</div>
                <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 32, color: "#fff", marginTop: 10, lineHeight: 1.15, minHeight: 74 }}>{got ? task : "waiting for a goal…"}</div>
                <div style={{ marginTop: 14, display: "inline-block", fontFamily: MONO, fontWeight: 800, fontSize: 26, padding: "6px 14px", borderRadius: 99, background: done ? GR : "rgba(255,255,255,0.12)", color: done ? "#062" : "#ddd" }}>{done ? "✓ DONE" : got ? "● IN PROGRESS" : "○ IDLE"}</div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {frame >= L(32.69, a) && <>
        <Wire x1={355} y1={560} x2={385} y2={560} at={L(32.69, a)} color={GR} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", justifyContent: "center" }}><Chip at={L(32.69, a)} color={GR}>🔁 AGENTS COORDINATE THE WORK</Chip></div>
      </>}
    </AbsoluteFill>
  );
};

/* 33.69–36.34: the real dashboard from the project's README demo */
const Dash: React.FC = () => {
  const a = 33.69;
  return (
    <AbsoluteFill>
      <Grid tint="#101a2e" />
      <div style={{ position: "absolute", left: 50, top: 70 }}>
        <Screen3D src="b/r16/gh_dashc.mp4" w={980} url="Paperclip dashboard · official demo" dark rotY={4} sway={2} glow={CY} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center", gap: 20 }}>
        <Chip at={L(34.39, a)} color={CY}>📊 MONITOR PROGRESS</Chip>
        <Chip at={L(35.34, a)} color={Y}>💰 CONTROL SPENDING</Chip>
      </div>
    </AbsoluteFill>
  );
};

/* 36.34–40.74: the honest catch (full face) */
const Catch: React.FC = () => (
  <>
    <Hud at={L(36.69, 36.34)} out={L(38.99, 36.34)} y={150} color={RD} size={50}>⚠️ AGENTS ≠ EMPLOYEES</Hud>
    <Hud at={L(39.04, 36.34)} y={150} color={Y} size={50}>👀 YOU REVIEW THEIR WORK</Hud>
  </>
);

/* 40.74–45.28: starter setup with two agents */
const Starter: React.FC = () => {
  const a = 40.74, frame = useCurrentFrame();
  const flow = frame >= L(44.73, a);
  const p = ((frame - L(44.73, a)) % 40) / 40;
  return (
    <AbsoluteFill>
      <Grid />
      <Title at={L(41.13, a)}>💡 Start with <span style={{ color: Y }}>just 2 agents</span></Title>
      <Node x={270} y={260} icon="🔎" role="RESEARCHER" sub="finds the facts" color={CY} at={L(43.68, a)} w={360} />
      <Node x={810} y={260} icon="✍️" role="WRITER" sub="turns them into a draft" color={"#F472B6"} at={L(44.53, a)} w={360} />
      {flow && <>
        <Wire x1={455} y1={390} x2={625} y2={390} at={L(44.73, a)} color={Y} ping={false} />
        <div style={{ position: "absolute", left: 470 + 140 * p - 30, top: 350, fontSize: 60 }}>📄</div>
      </>}
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", gap: 20 }}>
        <Chip at={L(44.78, a)} color={GR}>✅ SMALL · EASY TO REVIEW</Chip>
      </div>
    </AbsoluteFill>
  );
};

/* 45.28–48.03: link + beginner plan (README "how it works" steps) */
const Plan: React.FC = () => {
  const a = 45.28;
  return (
    <AbsoluteFill>
      <Grid tint="#101a2e" />
      <div style={{ position: "absolute", left: 70, top: 80 }}>
        <Screen3D src="b/r16/gh_goal.mp4" w={940} url="github.com/paperclipai/paperclip" rotY={-4} sway={2} glow={Y} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center", gap: 20 }}>
        <Chip at={L(45.93, a)} color={CY}>🔗 PROJECT LINK</Chip>
        <Chip at={L(46.93, a)} color={Y}>📋 BEGINNER SETUP PLAN</Chip>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: ease });
  const fadeOut = interpolate(frame, [f(OUTRO) - 20, f(OUTRO)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #1b1440, #06060f 75%)", opacity: k, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", opacity: fadeOut, transform: `scale(${0.94 + 0.06 * k})` }}>
        <div style={{ display: "inline-flex", boxShadow: "0 14px 34px rgba(0,0,0,0.35)" }}>
          <div style={{ background: "#111", color: Y, fontFamily: MONO, fontWeight: 800, fontSize: 48, padding: "14px 22px", border: `3px solid ${Y}` }}>⛏ GITHUB GOLDMINE</div>
          <div style={{ background: Y, color: "#111", fontFamily: MONO, fontWeight: 900, fontSize: 48, padding: "14px 22px" }}>EP 3</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26, marginTop: 60 }}>
          <ClipMark size={130} />
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 116, color: "#fff", letterSpacing: -4 }}>Paperclip AI</div>
        </div>
        <div style={{ marginTop: 70, display: "inline-block", background: "#fff", color: "#111", fontFamily: INTER, fontWeight: 900, fontSize: 52, padding: "18px 34px", borderRadius: 999 }}>💬 Comment <span style={{ color: "#7C3AED" }}>COMPANY</span> for the link</div>
        <div style={{ marginTop: 30, fontFamily: INTER, fontWeight: 800, fontSize: 42, color: "rgba(255,255,255,0.85)" }}>Follow AI with Kalyan</div>
      </div>
    </AbsoluteFill>
  );
};

type Seg = { a: number; b: number; split?: React.FC; over?: React.FC };
const SEGS: Seg[] = [
  { a: 0, b: 3.3, split: Hook },
  { a: 3.3, b: 6.44, over: CrazyTag },
  { a: 6.44, b: 14.54, split: OldTeam },
  { a: 14.54, b: 19.69, split: Repo },
  { a: 19.69, b: 27.24, split: AgentOrg },
  { a: 27.24, b: 33.69, split: GoalTasks },
  { a: 33.69, b: 36.34, split: Dash },
  { a: 36.34, b: 40.74, over: Catch },
  { a: 40.74, b: 45.28, split: Starter },
  { a: 45.28, b: 48.03, split: Plan },
  { a: D.duration, b: 1e9, over: Outro },
];
const SEGS_E = SEGS.map((x) => ({ ...x, b: Math.min(x.b, END) }));
const isSplit = (t: number) => SEGS_E.some((s) => s.split && t >= s.a && t < s.b);
const chunks = chunkWords(D.words, 3, 16);
const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if ((t >= 48.08 && t < 50.83) || t >= D.duration) return null; // comment box shows the keyword; outro has no speech
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const top = isSplit(t) ? 900 : 1440;
  return (
    <div style={{ position: "absolute", top, left: 30, right: 30, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", background: "rgba(8,8,16,0.82)", border: "2px solid rgba(255,255,255,0.14)", borderRadius: 22, padding: "8px 26px" }}>
        {c.words.map((w, i) => {
          const on = t >= w.s - 0.03; const now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
          const sc = now ? interpolate(t - w.s, [0, 0.1], [1.1, 1], clamp) : 1;
          return <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, letterSpacing: -1.5, textTransform: "uppercase", color: now ? Y : on ? "#fff" : "rgba(255,255,255,0.55)", transform: `scale(${sc})`, display: "inline-block" }}>{w.w.replace(/[,.?]$/, "")}</span>;
        })}
      </div>
    </div>
  );
};

export const Reel16: React.FC = () => {
  const frame = useCurrentFrame();
  const back = SEGS_E.filter((s) => s.split).map((s) => f(s.b));
  const since = Math.min(...back.map((b) => (frame >= b ? frame - b : 999)));
  const z = since < 13 ? interpolate(since, [0, 12], [1.04, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  const sfx: [number, string, number][] = [
    [0.1, "pop", 0.16], [1.1, "blip", 0.12], [2.1, "ding", 0.14], [8.89, "click", 0.14], [10.07, "click", 0.12], [10.61, "click", 0.12], [10.87, "click", 0.12],
    [13.69, "glitch", 0.1], [15.09, "pop", 0.14], [20.99, "blip", 0.12], [23.89, "click", 0.12], [25.19, "click", 0.12], [26.54, "click", 0.12],
    [28.84, "typing", 0.14], [31.34, "swish", 0.1], [32.59, "ding", 0.14], [36.69, "glitch", 0.1], [43.68, "pop", 0.14], [44.53, "pop", 0.14], [D.duration + 0.05, "ding", 0.14],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 35%" }}>
        <OffthreadVideo src={staticFile(BASE)} muted style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      {SEGS_E.map((s, i) => (
        <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}>
          {s.split ? <Split offset={f(s.a)} fadeIn={!SEGS_E[i - 1]?.split} fadeOut={!SEGS_E[i + 1]?.split}><s.split /></Split> : s.over ? <s.over /> : null}
        </Sequence>
      ))}
      <Captions />
      <Audio src={staticFile(BASE)} />
      <Music src="r/r16_music.wav" total={END} base={0.07} boosts={[[D.duration, END, 0.12]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v} />)}
    </AbsoluteFill>
  );
};

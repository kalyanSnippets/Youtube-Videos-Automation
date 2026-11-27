import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import data from "../public/r/r17_words.json";
import face from "../public/r/r17_face.json";
import { f, FPS, INTER, MONO, Music, ReelData, Sfx, chunkWords, activeChunk, Typewriter } from "./lib";
import { clamp } from "./split";

/* Reel 17: Headroom (GitHub Goldmine). Style matched to the reference creator style the user picked:
   warm cream canvas, speaker in a rounded bottom card with the head popping out over the graphics (a person
   cut-out layered on top and clipped above the card edge), full-screen face resets, big italic serif keywords,
   dark Mac-style terminal cards, soft shadows, counters, our own pixel mascot (a miner robot) changing props,
   bold white word captions over the chest, soft UI pops. Real footage: github.com/headroomlabs-ai/headroom
   recorded 2026-11-27 (81k stars, Apache-2.0; README measures 21-57% fewer input tokens on four agent tasks).
   Times = seconds on the 58.55 s cut, plus a 2.8 s end card. */
const D = data as unknown as ReelData;
const FT = face as { t: number[]; cy: number[]; h: number[] };
const BASE = "r/r17fx_aroll.mp4";
const MATTE = "r/r17_matte.webm";
const OUTRO = 2.8;
const END = D.duration + OUTRO;
export const R17_FRAMES = Math.ceil(END * FPS);
const CREAM = "#F1EDE5", INK = "#16181D", OR = "#D9693F", MINT = "#16A974", RED = "#E5484D", GOLD = "#E9B949";
const SERIF = "'Playfair Display', serif";
const L = (abs: number, a: number) => f(abs) - f(a);
const backE = Easing.out(Easing.back(1.5));
const pop = (frame: number, at: number, d = 8) => interpolate(frame - at, [0, d], [0, 1], { ...clamp, easing: backE });
const fadeIn = (frame: number, at: number, d = 6) => interpolate(frame - at, [0, d], [0, 1], clamp);

/* ---------- speaker placement ---------- */
const smooth = (arr: number[], t: number) => { // face track sampled every 0.2 s, averaged over ±0.6 s so the card stays steady
  const i = Math.max(0, FT.t.findIndex((x) => x > t) - 1); let s = 0, n = 0;
  for (let k = Math.max(0, i - 3); k <= Math.min(arr.length - 1, i + 3); k++) { s += arr[k]; n++; }
  return s / n;
};
const CARD = { x: 40, y: 1010, w: 1000, h: 870, r: 48 };
const SC = 0.98;
const placement = (t: number) => {
  const hairTop = smooth(FT.cy, t) - 0.85 * smooth(FT.h, t);
  const top = CARD.y - 170 - hairTop * SC; // the top of the head rises ~170 px above the card edge
  return { left: (1080 - 1080 * SC) / 2, top };
};

/* ---------- shared look ---------- */
const Stage: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: CREAM }}>
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(22,24,29,0.09) 1.6px, transparent 1.6px)", backgroundSize: "36px 36px", backgroundPosition: "18px 18px" }} />
    {children}
  </AbsoluteFill>
);
const Card: React.FC<{ x: number; y: number; w: number; h?: number; at?: number; children?: React.ReactNode; dark?: boolean; style?: React.CSSProperties }> = ({ x, y, w, h, at = 0, children, dark, style }) => {
  const frame = useCurrentFrame(); const k = pop(frame, at);
  if (frame < at) return null;
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 28, background: dark ? "#15171C" : "#FFFFFF", boxShadow: "0 24px 50px rgba(40,30,20,0.16), 0 4px 10px rgba(40,30,20,0.08)", transform: `scale(${0.92 + 0.08 * k})`, opacity: Math.min(1, k * 1.5), overflow: "hidden", ...style }}>{children}</div>;
};
const MacBar: React.FC<{ title: string; dark?: boolean }> = ({ title, dark = true }) => (
  <div style={{ height: 54, display: "flex", alignItems: "center", gap: 12, padding: "0 22px", background: dark ? "#1E2027" : "#F3F1EC", borderBottom: `1px solid ${dark ? "#2A2D35" : "#E4E0D8"}` }}>
    {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 99, background: c }} />)}
    <div style={{ marginLeft: 12, fontFamily: MONO, fontWeight: 500, fontSize: 24, color: dark ? "#8C919C" : "#6B6F78" }}>{title}</div>
  </div>
);
const Serif: React.FC<{ at: number; x?: number; y: number; size?: number; color?: string; children: React.ReactNode; center?: boolean; rot?: number }> = ({ at, x = 0, y, size = 120, color = INK, children, center = true, rot = 0 }) => {
  const frame = useCurrentFrame(); const k = pop(frame, at, 9);
  if (frame < at) return null;
  return <div style={{ position: "absolute", left: center ? 0 : x, right: center ? 0 : undefined, top: y, textAlign: center ? "center" : "left", fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: size, lineHeight: 1.0, letterSpacing: -2, color, opacity: Math.min(1, k * 1.4), transform: `translateY(${(1 - k) * 30}px) scale(${0.9 + 0.1 * k}) rotate(${rot}deg)` }}>{children}</div>;
};
const Pill: React.FC<{ at: number; bg?: string; color?: string; children: React.ReactNode; size?: number }> = ({ at, bg = INK, color = "#fff", children, size = 34 }) => {
  const frame = useCurrentFrame(); const k = pop(frame, at);
  if (frame < at) return null;
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: 999, background: bg, color, fontFamily: INTER, fontWeight: 800, fontSize: size, boxShadow: "0 10px 24px rgba(40,30,20,0.15)", transform: `scale(${0.85 + 0.15 * k})`, opacity: Math.min(1, k * 1.5) }}>{children}</div>;
};
const Row: React.FC<{ y: number; children: React.ReactNode; gap?: number }> = ({ y, children, gap = 16 }) => <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", gap }}>{children}</div>;

/* ---------- our pixel mascot: a little miner robot (original design) ---------- */
const PAL: Record<string, string> = { k: "#1B1D22", y: GOLD, Y: "#B98A22", s: "#8FA3B8", S: "#62758A", m: "#5CF2C8", w: "#FFFFFF", o: OR, b: "#9C6B3C", g: "#C9CED6" };
const BOT = [
  "...kkkkkk...", "..kyyyyyyk..", ".kyyyYYyyyk.", "kkkkkkkkkkkk", ".kssssssssk.", ".ksmmssmmsk.", ".ksmmssmmsk.", ".kssssssssk.",
  "..kkkkkkkk..", ".kSssssssSk.", "kSsskyykssSk", ".kSssssssSk.", "..kk....kk..",
];
const PROPS: Record<string, string[]> = {
  pick: ["..kkkkk", ".kgggggk", "kgk.b.kgk", "k...b...k", "....b....", "....b....", "....b...."],
  glass: [".kkkk..", "kwwwwk.", "kwwwwk.", "kwwwwk.", ".kkkkb.", ".....bb", "......b"],
  broom: ["...b...", "...b...", "...b...", "...b...", "..yyy..", ".yYyYy.", "yYyYyYy"],
  key: ["..kkk....", ".kyyyk...", ".ky.yk...", ".kyyykkkkk", "..kkk.yky", "......yky"],
  star: ["....y....", "...yyy...", "yyyyyyyyy", ".yyyyyyy.", "..yyyyy..", ".yy...yy.", "yy.....yy"],
};
const Grid: React.FC<{ rows: string[]; px: number }> = ({ rows, px }) => (
  <svg width={Math.max(...rows.map((r) => r.length)) * px} height={rows.length * px} style={{ display: "block", imageRendering: "pixelated" as const }}>
    {rows.flatMap((r, y) => [...r].map((c, x) => (PAL[c] ? <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={PAL[c]} /> : null)))}
  </svg>
);
const Mascot: React.FC<{ x: number; y: number; prop?: keyof typeof PROPS; at?: number; px?: number; flip?: boolean }> = ({ x, y, prop, at = 0, px = 11, flip }) => {
  const frame = useCurrentFrame(); if (frame < at) return null;
  const hop = Math.floor((frame - at) / 8) % 2 ? -px : 0; const k = pop(frame, at, 8);
  return (
    <div style={{ position: "absolute", left: x, top: y + hop + (1 - k) * 40, display: "flex", alignItems: "flex-end", gap: px, transform: `scaleX(${flip ? -1 : 1})`, opacity: k, filter: "drop-shadow(0 8px 0 rgba(40,30,20,0.12))" }}>
      <Grid rows={BOT} px={px} />
      {prop && <div style={{ marginBottom: px * 4, transform: `rotate(${Math.sin(frame / 5) * 8}deg)` }}><Grid rows={PROPS[prop]} px={px} /></div>}
    </div>
  );
};

/* ---------- beats (top area is 0..~990 in split shots) ---------- */
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Row y={110}><Pill at={2} bg={INK} color={GOLD}>⛏ GITHUB GOLDMINE</Pill></Row>
      <Serif at={6} y={250} size={128}>exploring</Serif>
      <Serif at={14} y={392} size={150} color={OR}>GitHub</Serif>
      <Card x={600} y={640} w={330} h={190} at={22}>
        <div style={{ padding: "26px 28px", fontFamily: MONO, fontSize: 26, color: "#555B66" }}>📁 new-repo<div style={{ marginTop: 18, fontFamily: INTER, fontWeight: 900, fontSize: 44, color: INK }}>✨ found it</div></div>
      </Card>
      <Mascot x={170} y={650} prop="pick" at={16} />
      <div style={{ position: "absolute", left: 330, top: 820, fontSize: 54, opacity: fadeIn(frame, 30), transform: `translateY(${Math.sin(frame / 6) * 6}px)` }}>🪙</div>
    </>
  );
};
const Start: React.FC = () => ( // full face opening
  <>
    <Row y={150}><Pill at={2} bg={INK} color={GOLD}>⛏ GITHUB GOLDMINE</Pill></Row>
    <Serif at={L(1.4, 0)} y={260} size={110} color="#fff">exploring GitHub</Serif>
  </>
);
const Hook: React.FC = () => { // split: "you find a project and you're like… wait, someone actually built this?"
  const frame = useCurrentFrame(); const a = 2.7;
  return (
    <>
      <Serif at={L(3.0, a)} y={110} size={92}>you find a <span style={{ color: OR }}>project</span>…</Serif>
      <Card x={600} y={330} w={340} h={200} at={L(3.9, a)}>
        <div style={{ padding: "26px 28px", fontFamily: MONO, fontSize: 26, color: "#555B66" }}>📁 new-repo<div style={{ marginTop: 18, fontFamily: INTER, fontWeight: 900, fontSize: 44, color: INK }}>✨ found it</div></div>
      </Card>
      <Mascot x={150} y={330} prop="pick" at={L(3.2, a)} />
      <div style={{ position: "absolute", left: 330, top: 470, fontSize: 54, opacity: fadeIn(frame, L(3.6, a)), transform: `translateY(${Math.sin(frame / 6) * 6}px)` }}>🪙</div>
      <Serif at={L(5.32, a)} y={590} size={120} color={OR}>wait…</Serif>
      <Serif at={L(5.9, a)} y={730} size={54}>someone actually built this? 🤯</Serif>
    </>
  );
};
const There: React.FC = () => <Serif at={L(24.2, 23.95)} y={220} size={96} color="#fff">there actually is 👀</Serif>;
const Follow: React.FC = () => {
  const a = 42.95;
  return (
    <>
      <Row y={110}><Pill at={L(43.1, a)} bg={INK} color="#fff">➕ follow</Pill></Row>
      <Serif at={L(43.5, a)} y={220} size={110}>AI with Kalyan</Serif>
      <Row y={400} gap={22}><Pill at={L(44.6, a)} bg="#fff" color={INK}>📸 Instagram</Pill><Pill at={L(45.4, a)} bg={RED} color="#fff">▶ YouTube</Pill></Row>
      <Serif at={L(47.9, a)} y={560} size={88} color={OR}>the next GitHub find 💎</Serif>
      <Mascot x={70} y={700} prop="star" at={L(46.6, a)} px={9} />
    </>
  );
};
const Wow: React.FC = () => ( // (unused) full face: "wait… someone actually built this?"
  <>
    <Serif at={L(5.14, 2.34)} y={170} size={110} color="#fff">wait…</Serif>
    <Serif at={L(5.7, 2.34)} y={300} size={70} color="#fff">someone actually built this? 🤯</Serif>
  </>
);
const LOGS = ["PASSED tests/test_auth.py::test_login", "WARN  DeprecationWarning: utcnow() is deprecated", "WARN  DeprecationWarning: utcnow() is deprecated", "INFO  Collecting 412 items", "WARN  DeprecationWarning: utcnow() is deprecated", "PASSED tests/test_api.py::test_users", "ERROR  AssertionError: expected 200, got 500", "INFO  Retrying request (attempt 2)", "WARN  DeprecationWarning: utcnow() is deprecated", "INFO  Retrying request (attempt 3)", "PASSED tests/test_db.py::test_migrate", "WARN  DeprecationWarning: utcnow() is deprecated"];
const Terminal: React.FC<{ a: number; flood?: number; still?: boolean }> = ({ a, flood, still }) => {
  const frame = useCurrentFrame();
  const fl = flood === undefined ? -1 : frame - L(flood, a);
  const n = fl < 0 ? 0 : Math.floor(fl * 1.6);
  return (
    <Card x={70} y={110} w={940} h={600} dark at={still ? -20 : 0}>
      <MacBar title="claude code · ~/my-app" />
      <div style={{ padding: "22px 28px", fontFamily: MONO, fontSize: 25, color: "#D6D9E0", lineHeight: 1.55 }}>
        <div><span style={{ color: MINT }}>›</span> <Typewriter text="fix one small bug in the login test" delay={L(9.52, a)} cps={26} caret={fl < 0} caretColor={GOLD} /></div>
        <div style={{ position: "relative", height: 430, overflow: "hidden", marginTop: 8 }}>
          <div style={{ transform: `translateY(${-Math.max(0, n - 11) * 39}px)` }}>
            {Array.from({ length: n }, (_, i) => { const s = LOGS[(i * 7) % LOGS.length]; const rep = s.includes("utcnow"); return <div key={i} style={{ color: s.startsWith("ERROR") ? RED : rep ? "#C9A23A" : "#9AA0AC", background: rep ? "rgba(233,185,73,0.10)" : undefined, whiteSpace: "nowrap" }}>{s}</div>; })}
          </div>
        </div>
      </div>
    </Card>
  );
};
const Prompt: React.FC = () => <><Terminal a={7.15} /><Serif at={L(10.4, 7.15)} y={735} size={80} color={OR}>one small bug 🐛</Serif></>;
const Flood: React.FC = () => {
  const frame = useCurrentFrame(); const a = 10.95;
  const lines = Math.round(interpolate(frame, [0, f(5.5)], [24, 1248], clamp));
  return (
    <>
      <Terminal a={a} flood={11.16} still />
      <div style={{ position: "absolute", right: 60, top: 70, zIndex: 3 }}><Pill at={4} bg={RED}>📜 {lines.toLocaleString()} lines read</Pill></div>
      <Serif at={L(15.3, a)} y={735} size={76} color={OR}>repeated. again. 🔁</Serif>
    </>
  );
};
const Tokens: React.FC = () => { // full cream graphic
  const frame = useCurrentFrame(); const a = 16.5;
  const fill = interpolate(frame, [L(17.18, a), L(18.3, a)], [0.18, 0.97], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Stage>
      <Serif at={2} y={330} size={150}>your <span style={{ color: OR }}>tokens</span></Serif>
      <Card x={110} y={600} w={860} h={250} at={6}>
        <div style={{ padding: "30px 36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 28, color: "#6B6F78" }}><span>context window</span><span style={{ color: fill > 0.8 ? RED : INK }}>{Math.round(fill * 100)}%</span></div>
          <div style={{ marginTop: 22, height: 54, borderRadius: 99, background: "#EEEAE2", overflow: "hidden" }}><div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 99, background: fill > 0.8 ? RED : OR }} /></div>
          {fill > 0.9 && <div style={{ marginTop: 18, fontFamily: INTER, fontWeight: 800, fontSize: 30, color: RED }}>⚠️ almost full</div>}
        </div>
      </Card>
      {Array.from({ length: 9 }, (_, i) => { const t0 = 4 + i * 4; const y = interpolate(frame - t0, [0, 40], [-80, 1000], clamp); return frame > t0 ? <div key={i} style={{ position: "absolute", left: 90 + ((i * 113) % 880), top: y, fontSize: 56, transform: `rotate(${i * 40 + frame * 4}deg)`, opacity: 0.9 }}>🪙</div> : null; })}
      <Mascot x={470} y={950} prop="glass" at={10} />
    </Stage>
  );
};
const Clean: React.FC = () => {
  const frame = useCurrentFrame(); const a = 18.5;
  const clean = fadeIn(frame, L(20.34, a), 14);
  return (
    <>
      <Serif at={L(18.66, a)} y={70} size={92}>imagine it <span style={{ color: MINT }}>cleaned up</span></Serif>
      <Card x={60} y={220} w={440} h={480} dark at={L(18.8, a)}>
        <MacBar title="raw logs" />
        <div style={{ padding: 18, fontFamily: MONO, fontSize: 17, lineHeight: 1.5, color: "#9AA0AC" }}>{Array.from({ length: 16 }, (_, i) => { const s = LOGS[(i * 5) % LOGS.length]; return <div key={i} style={{ whiteSpace: "nowrap", opacity: 1 - clean * (s.includes("utcnow") ? 0.75 : 0.1), textDecoration: clean > 0.5 && s.includes("utcnow") ? "line-through" : undefined }}>{s.slice(0, 34)}</div>; })}</div>
      </Card>
      <div style={{ position: "absolute", left: 512, top: 420, fontSize: 64, color: INK, opacity: clean }}>→</div>
      <Card x={590} y={280} w={430} h={360} at={L(20.6, a)}>
        <MacBar title="what Claude reads" dark={false} />
        <div style={{ padding: 24, fontFamily: MONO, fontSize: 22, lineHeight: 1.6, color: INK }}>
          <div>✅ 3 tests passed</div><div style={{ color: RED }}>❌ test_users: 500</div><div style={{ color: "#8A6A1F" }}>⚠ utcnow() deprecated ×6</div>
        </div>
      </Card>
      <Mascot x={800} y={730} prop="broom" at={L(20.2, a)} px={9} />
      <div style={{ position: "absolute", left: 60, top: 730 }}><Pill at={L(22.5, a)} bg={MINT} size={28}>before Claude reads it</Pill></div>
    </>
  );
};
const Reveal: React.FC = () => { // full cream: the real repo
  const frame = useCurrentFrame(); const a = 25.3;
  const stars = Math.round(interpolate(frame, [L(25.5, a), L(26.3, a)], [0, 81], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <Stage>
      <Serif at={L(25.9, a)} y={170} size={160} color={INK}>Headroom</Serif>
      <Card x={60} y={420} w={960} h={654} at={2}>
        <MacBar title="github.com/headroomlabs-ai/headroom" dark={false} />
        <OffthreadVideo src={staticFile("b/r17/gh_top.mp4")} muted style={{ width: 960, height: 600, objectFit: "cover", objectPosition: "50% 0%" }} />
      </Card>
      <Row y={1120}><Pill at={L(25.4, a)} bg={INK} color={GOLD}>⭐ {stars}K stars</Pill><Pill at={L(25.8, a)} bg="#fff" color={INK}>🔓 open source · Apache-2.0</Pill></Row>
      <Mascot x={800} y={1250} prop="star" at={L(26.0, a)} px={8} />
    </Stage>
  );
};
const Clever: React.FC = () => <Serif at={L(29.3, 27.45)} y={200} size={90} color="#fff">pretty clever 💡</Serif>;
const Flow: React.FC = () => {
  const frame = useCurrentFrame(); const a = 27.0;
  const node = (x: number, at: number, icon: string, label: string, hl?: boolean) => (
    <Card x={x} y={250} w={290} h={250} at={at} style={hl ? { border: `4px solid ${OR}` } : undefined}>
      <div style={{ textAlign: "center", paddingTop: 34 }}><div style={{ fontSize: 86 }}>{icon}</div><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 36, color: hl ? OR : INK, marginTop: 8 }}>{label}</div></div>
    </Card>
  );
  const p = ((frame - L(27.6, a)) % 50) / 50; const go = frame > L(27.6, a);
  const blockX = p < 0.5 ? interpolate(p, [0, 0.5], [270, 420]) : interpolate(p, [0.5, 1], [700, 790]);
  const squish = p < 0.5 ? 1 : interpolate(frame - L(29.56, a), [0, 10], [1, 0.3], clamp);
  return (
    <>
      <Serif at={L(27.0, a)} y={90} size={86}>it sits <span style={{ color: OR }}>in between</span></Serif>
      {node(40, L(27.1, a), "🤖", "AI agent")}
      {node(395, L(27.4, a), "▣", "Headroom", true)}
      {node(750, L(28.9, a), "🧠", "the model")}
      {go && <div style={{ position: "absolute", left: blockX, top: 530, width: 70, height: 150 * squish, borderRadius: 10, background: `repeating-linear-gradient(180deg, #9AA0AC 0 10px, #D7D3CB 10px 18px)`, opacity: 0.9 }} />}
      <Serif at={L(29.56, a)} y={700} size={70} color={OR}>compressing 🗜️</Serif>
      <Mascot x={60} y={560} prop="key" at={L(27.8, a)} px={8} />
      <div style={{ position: "absolute", right: 40, top: 580 }}><Pill at={L(30.4, a)} bg="#fff" color={INK} size={28}>💻 runs on your machine</Pill></div>
    </>
  );
};
const Compact: React.FC = () => {
  const frame = useCurrentFrame(); const a = 35.7;
  const h1 = interpolate(frame, [4, 16], [0, 470], { ...clamp, easing: Easing.out(Easing.cubic) });
  const h2 = interpolate(frame, [L(36.9, a), L(37.5, a)], [0, 170], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return (
    <>
      <Serif at={L(36.9, a)} y={80} size={130}>compact</Serif>
      <div style={{ position: "absolute", left: 190, top: 740 - h1, width: 240, height: h1, borderRadius: 18, background: "repeating-linear-gradient(180deg, #A9ADB5 0 14px, #DAD6CE 14px 24px)", boxShadow: "0 18px 40px rgba(40,30,20,0.15)" }} />
      <div style={{ position: "absolute", left: 650, top: 740 - h2, width: 240, height: h2, borderRadius: 18, background: `repeating-linear-gradient(180deg, ${MINT} 0 14px, #BFEBD9 14px 24px)`, boxShadow: "0 18px 40px rgba(40,30,20,0.15)" }} />
      <div style={{ position: "absolute", left: 190, width: 240, top: 755, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, color: "#6B6F78" }}>before</div>
      <div style={{ position: "absolute", left: 650, width: 240, top: 755, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, color: MINT, opacity: fadeIn(frame, L(37.2, a)) }}>what Claude gets</div>
    </>
  );
};
const Proof: React.FC = () => { // full cream: the README's own numbers
  const a = 31.4;
  return (
    <Stage>
      <Serif at={2} y={150} size={150} color={OR}>21–57%</Serif>
      <Serif at={8} y={330} size={62}>fewer input tokens</Serif>
      <Card x={60} y={470} w={960} h={654} at={4}>
        <MacBar title="headroom · README · Proof" dark={false} />
        <OffthreadVideo src={staticFile("b/r17/gh_proof.mp4")} muted style={{ width: 960, height: 600, objectFit: "cover", objectPosition: "0% 0%" }} />
      </Card>
      <Row y={1170}><Pill at={L(32.4, a)} bg="#fff" color={INK} size={30}>📊 measured on 4 agent tasks · project README</Pill></Row>
      <Row y={1260}><Pill at={L(34.2, a)} bg={MINT}>⚡ automatically</Pill></Row>
    </Stage>
  );
};
const Next: React.FC = () => {
  const frame = useCurrentFrame(); const a = 38.9;
  const nodes = Array.from({ length: 26 }, (_, i) => ({ x: 120 + ((i * 197) % 820), y: 330 + ((i * 131) % 430), r: 10 + (i % 4) * 5 }));
  return (
    <>
      <Row y={80}><Pill at={2} bg={INK} color={GOLD}>⛏ NEXT UP</Pill></Row>
      <Serif at={L(41.6, a)} y={170} size={96}>massive <span style={{ color: OR }}>codebases</span></Serif>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={960}>
        {nodes.map((n, i) => { const m = nodes[(i * 5 + 3) % nodes.length]; const k = interpolate(frame - i * 1.5, [0, 10], [0, 1], clamp); return <g key={i} opacity={k}><line x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke="#C9C2B5" strokeWidth={3} /><circle cx={n.x} cy={n.y} r={n.r} fill={i % 5 === 0 ? OR : "#fff"} stroke={INK} strokeWidth={3} /></g>; })}
      </svg>
      <Mascot x={60} y={780} prop="glass" at={L(40.6, a)} px={9} />
      <div style={{ position: "absolute", right: 50, top: 800 }}><Pill at={L(40.9, a)} bg="#fff" color={INK} size={28}>🔒 coming next</Pill></div>
    </>
  );
};
const Outro: React.FC = () => {
  const frame = useCurrentFrame(); const out = interpolate(frame, [f(OUTRO) - 16, f(OUTRO)], [1, 0], clamp);
  return (
    <Stage>
      <div style={{ position: "absolute", inset: 0, opacity: out }}>
        <Row y={520}><Pill at={2} bg={INK} color={GOLD}>⛏ GITHUB GOLDMINE</Pill></Row>
        <Serif at={6} y={640} size={170}>Headroom</Serif>
        <Row y={880}><Pill at={12} bg={OR}>💬 comment GOLD</Pill></Row>
        <Row y={980}><Pill at={18} bg="#fff" color={INK} size={30}>📘 full setup guide · aiwithkalyan.com</Pill></Row>
        <Mascot x={470} y={1120} prop="pick" at={14} px={11} />
      </div>
    </Stage>
  );
};

/* ---------- layouts ---------- */
type Kind = "split" | "face" | "full";
type Seg = { a: number; b: number; kind: Kind; C?: React.FC };
const SEGS: Seg[] = [
  { a: 0, b: 2.7, kind: "face", C: Start },
  { a: 2.7, b: 7.15, kind: "split", C: Hook },
  { a: 7.15, b: 10.95, kind: "split", C: Prompt },
  { a: 10.95, b: 16.5, kind: "split", C: Flood },
  { a: 16.5, b: 18.5, kind: "full", C: Tokens },
  { a: 18.5, b: 23.95, kind: "split", C: Clean },
  { a: 23.95, b: 25.3, kind: "face", C: There },
  { a: 25.3, b: 27.0, kind: "full", C: Reveal },
  { a: 27.0, b: 31.4, kind: "split", C: Flow },
  { a: 31.4, b: 34.95, kind: "full", C: Proof },
  { a: 34.95, b: 38.9, kind: "face" },
  { a: 38.9, b: 42.95, kind: "split", C: Next },
  { a: 42.95, b: D.duration, kind: "split", C: Follow },
  { a: D.duration, b: END, kind: "full", C: Outro },
];
const segAt = (t: number) => SEGS.find((s) => t >= s.a && t < s.b) ?? SEGS[SEGS.length - 1];

/* split: cream top graphics + speaker in a rounded bottom card, head popping out over the graphics */
const SplitShot: React.FC<{ offset: number; children: React.ReactNode }> = ({ offset, children }) => {
  const frame = useCurrentFrame(); const t = (frame + offset) / FPS; const p = placement(t);
  const vw = 1080 * SC, vh = 1920 * SC;
  return (
    <Stage>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: CARD.y + 40 }}>{children}</div>
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: CARD.r, overflow: "hidden", boxShadow: "0 30px 60px rgba(40,30,20,0.22)", background: "#000" }}>
        <OffthreadVideo src={staticFile(BASE)} muted startFrom={offset} style={{ position: "absolute", left: p.left - CARD.x, top: p.top - CARD.y, width: vw, height: vh }} />
      </div>
      {/* the pop-out: the cut-out person, only above the card edge */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: CARD.y + 2, overflow: "hidden", filter: "drop-shadow(0 10px 14px rgba(40,30,20,0.25))" }}>
        <OffthreadVideo src={staticFile(MATTE)} transparent muted startFrom={offset} style={{ position: "absolute", left: p.left, top: p.top, width: vw, height: vh }} />
      </div>
    </Stage>
  );
};
const Shot: React.FC<{ s: Seg; prev?: Seg }> = ({ s, prev }) => {
  const frame = useCurrentFrame(); const { durationInFrames: dur } = useVideoConfig(); void dur;
  const k = prev && prev.kind === s.kind ? 1 : interpolate(frame, [0, 5], [0, 1], clamp);
  const z = prev && prev.kind === s.kind ? 1 : interpolate(frame, [0, 8], [1.04, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const off = f(s.a);
  return (
    <AbsoluteFill style={{ opacity: k, transform: `scale(${z})` }}>
      {s.kind === "split" ? <SplitShot offset={off}>{s.C && <s.C />}</SplitShot> : s.kind === "full" ? (s.C ? <s.C /> : null) : s.C ? <s.C /> : null}
    </AbsoluteFill>
  );
};

/* captions: bold white word chunks over the chest (face/split), a black pill on full graphics */
const chunks = chunkWords(D.words, 3, 16);
const KEY = /^(tokens|Headroom|GOLD|Claude|compact|compressing|GitHub)/i;
const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if ((t >= 35.0 && t < 38.75) || t >= D.duration) return null;
  const c = activeChunk(chunks, t); if (!c) return null;
  const s = segAt(t);
  const top = s.kind === "split" ? 1640 : s.kind === "face" ? 1450 : 1700;
  return (
    <div style={{ position: "absolute", top, left: 40, right: 40, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", ...(s.kind === "full" ? { background: INK, borderRadius: 999, padding: "10px 30px" } : {}) }}>
        {c.words.map((w, i) => {
          const on = t >= w.s - 0.03, now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
          const word = w.w.replace(/[,.?]$/, "");
          return <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 68, letterSpacing: -1.5, color: KEY.test(word) ? GOLD : "#fff", opacity: on ? 1 : 0.55, transform: `scale(${now ? 1.06 : 1})`, display: "inline-block", textShadow: s.kind === "full" ? undefined : "0 4px 14px rgba(0,0,0,0.65), 0 0 2px rgba(0,0,0,0.8)" }}>{word}</span>;
        })}
      </div>
    </div>
  );
};

export const Reel17: React.FC = () => {
  const frame = useCurrentFrame();
  const faces = SEGS.filter((s) => s.kind === "face").map((s) => f(s.a));
  const since = Math.min(...faces.map((b) => (frame >= b ? frame - b : 999)));
  const zf = since < 10 ? interpolate(since, [0, 9], [1.06, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  const punch = 1;
  const sfx: [number, string, number][] = [
    [0.05, "pop", 0.14], [1.4, "8bit_coin", 0.07], [2.7, "swish", 0.07], [5.32, "pop", 0.12], [7.15, "click", 0.1], [9.52, "typing", 0.12],
    [11.16, "glitch", 0.07], [16.5, "swish", 0.07], [17.18, "riser", 0.06], [18.5, "click", 0.1], [20.34, "whoosh", 0.06], [23.95, "pop", 0.1],
    [25.4, "8bit_coin", 0.08], [25.9, "ding", 0.12], [27.0, "click", 0.1], [29.56, "whoosh", 0.06], [31.4, "swish", 0.07], [32.4, "ding", 0.1],
    [38.9, "click", 0.1], [41.6, "pop", 0.1], [42.95, "click", 0.1], [47.9, "pop", 0.1], [D.duration + 0.05, "8bit_levelup", 0.08],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zf * punch})`, transformOrigin: "50% 38%" }}>
        <OffthreadVideo src={staticFile(BASE)} muted style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      {SEGS.map((s, i) => (s.kind === "face" && !s.C ? null : (
        <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}>
          {s.kind === "face" ? s.C && <s.C /> : <Shot s={s} prev={SEGS[i - 1]} />}
        </Sequence>
      )))}
      <Captions />
      <Audio src={staticFile(BASE)} />
      <Music src="r/r17_music.wav" total={END} base={0.07} boosts={[[D.duration, END, 0.12]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v} />)}
    </AbsoluteFill>
  );
};

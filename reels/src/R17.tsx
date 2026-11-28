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
   Times = seconds on the 48.04 s cut, plus a 2.8 s end card. */
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

/* particle burst (sparkles / coins flying out from a point) */
const Burst: React.FC<{ x: number; y: number; at: number; items?: string[]; n?: number; dist?: number }> = ({ x, y, at, items = ["✨", "🪙", "⭐"], n = 10, dist = 190 }) => {
  const frame = useCurrentFrame(); const u = (frame - at) / 22; if (u < 0 || u > 1) return null;
  const e = 1 - Math.pow(1 - u, 3);
  return <>{Array.from({ length: n }, (_, i) => { const ang = (i / n) * Math.PI * 2 + 0.3; return <div key={i} style={{ position: "absolute", left: x + Math.cos(ang) * dist * e - 20, top: y + Math.sin(ang) * dist * e - 20, fontSize: 40, opacity: 1 - u * u, transform: `scale(${1.2 - 0.6 * u}) rotate(${i * 30 + u * 120}deg)` }}>{items[i % items.length]}</div>; })}</>;
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
      <Burst x={770} y={430} at={L(3.95, a)} />
      <Burst x={540} y={650} at={L(5.0, a)} items={["❗", "✨"]} n={8} dist={260} />
      <div style={{ position: "absolute", left: 330, top: 470, fontSize: 54, opacity: fadeIn(frame, L(3.6, a)), transform: `translateY(${Math.sin(frame / 6) * 6}px)` }}>🪙</div>
      <Serif at={L(5.32, a)} y={590} size={120} color={OR}>wait…</Serif>
      <Serif at={L(5.9, a)} y={730} size={54}>someone actually built this? 🤯</Serif>
    </>
  );
};
const There: React.FC = () => <Serif at={L(23.56, 23.31)} y={220} size={96} color="#fff">there actually is 👀</Serif>;
const Follow: React.FC = () => {
  const a = 42.11;
  return (
    <>
      {(() => { const frame = useCurrentFrame(); const tap = L(42.6, a); const on = frame >= tap; const press = interpolate(frame, [tap - 3, tap, tap + 5], [1, 0.9, 1], clamp); return <>
        <Row y={110}><div style={{ transform: `scale(${press})` }}><Pill at={L(42.2, a)} bg={on ? "#fff" : INK} color={on ? INK : "#fff"}>{on ? "✓ following" : "➕ follow"}</Pill></div></Row>
        <div style={{ position: "absolute", left: interpolate(frame, [0, tap], [760, 590], clamp), top: interpolate(frame, [0, tap], [260, 150], clamp), fontSize: 64, opacity: frame < tap + 18 ? 1 : 0 }}>👆</div>
        <Burst x={540} y={140} at={tap} items={["💛", "✨"]} n={10} dist={170} />
      </>; })()}
      <Serif at={L(42.66, a)} y={220} size={110}>AI with Kalyan</Serif>
      <Row y={400} gap={22}><Pill at={L(43.76, a)} bg="#fff" color={INK}>📸 Instagram</Pill><Pill at={L(44.56, a)} bg={RED} color="#fff">▶ YouTube</Pill></Row>
      <Serif at={L(47.06, a)} y={560} size={88} color={OR}>the next GitHub find 💎</Serif>
      <Mascot x={70} y={700} prop="star" at={L(45.76, a)} px={9} />
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
        <div><span style={{ color: MINT }}>›</span> <Typewriter text="fix one small bug in the login test" delay={L(9, a)} cps={26} caret={fl < 0} caretColor={GOLD} /></div>
        <div style={{ position: "relative", height: 430, overflow: "hidden", marginTop: 8 }}>
          <div style={{ transform: `translateY(${-Math.max(0, n - 11) * 39}px)` }}>
            {Array.from({ length: n }, (_, i) => { const s = LOGS[(i * 7) % LOGS.length]; const rep = s.includes("utcnow"); return <div key={i} style={{ color: s.startsWith("ERROR") ? RED : rep ? "#C9A23A" : "#9AA0AC", background: rep ? "rgba(233,185,73,0.10)" : undefined, whiteSpace: "nowrap" }}>{s}</div>; })}
          </div>
        </div>
      </div>
    </Card>
  );
};
const Prompt: React.FC = () => {
  const frame = useCurrentFrame(); const a = 7.15; const t0 = L(9.9, a);
  const bx = interpolate(frame, [t0, t0 + 40], [120, 880], clamp);
  return <><Terminal a={a} />{frame > t0 && <div style={{ position: "absolute", left: bx, top: 640, fontSize: 56, transform: `rotate(${Math.sin(frame / 2) * 12}deg) scaleX(-1)` }}>🐛</div>}<Serif at={L(10.04, a)} y={735} size={80} color={OR}>one small bug 🐛</Serif></>;
};
const Flood: React.FC = () => {
  const frame = useCurrentFrame(); const a = 10.59;
  const lines = Math.round(interpolate(frame, [0, f(5.5)], [24, 1248], clamp));
  return (
    <>
      <Terminal a={a} flood={10.8} still />
      <div style={{ position: "absolute", right: 60, top: 70, zIndex: 3 }}><Pill at={4} bg={RED}>📜 {lines.toLocaleString()} lines read</Pill></div>
      <div style={{ position: "absolute", left: 60, top: 630, zIndex: 3 }}><Pill at={L(11.6, a)} bg={INK} color={GOLD} size={30}>🪙 {(lines * 37).toLocaleString()} tokens</Pill></div>
      <Serif at={L(14.94, a)} y={735} size={76} color={OR}>repeated. again. 🔁</Serif>
    </>
  );
};
const Tokens: React.FC = () => { // full cream graphic
  const frame = useCurrentFrame(); const a = 16.14;
  const fill = interpolate(frame, [L(16.82, a), L(17.94, a)], [0.18, 0.97], { ...clamp, easing: Easing.out(Easing.cubic) });
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
  const frame = useCurrentFrame(); const a = 18.14;
  const clean = fadeIn(frame, L(19.98, a), 14);
  return (
    <>
      <Serif at={L(18.3, a)} y={70} size={92}>imagine it <span style={{ color: MINT }}>cleaned up</span></Serif>
      <Card x={60} y={220} w={440} h={480} dark at={L(18.44, a)}>
        <MacBar title="raw logs" />
        <div style={{ padding: 18, fontFamily: MONO, fontSize: 17, lineHeight: 1.5, color: "#9AA0AC" }}>{Array.from({ length: 16 }, (_, i) => { const s = LOGS[(i * 5) % LOGS.length]; return <div key={i} style={{ whiteSpace: "nowrap", opacity: 1 - clean * (s.includes("utcnow") ? 0.75 : 0.1), textDecoration: clean > 0.5 && s.includes("utcnow") ? "line-through" : undefined }}>{s.slice(0, 34)}</div>; })}</div>
      </Card>
      <div style={{ position: "absolute", left: 512, top: 420, fontSize: 64, color: INK, opacity: clean }}>→</div>
      {clean > 0 && clean < 1 && <div style={{ position: "absolute", left: 60, top: 274 + clean * 420, width: 440, height: 8, background: MINT, boxShadow: `0 0 24px ${MINT}`, borderRadius: 4 }} />}
      <Burst x={805} y={460} at={L(20.3, a)} items={["✨", "🧹"]} n={8} dist={240} />
      <Card x={590} y={280} w={430} h={360} at={L(20.24, a)}>
        <MacBar title="what Claude reads" dark={false} />
        <div style={{ padding: 24, fontFamily: MONO, fontSize: 22, lineHeight: 1.6, color: INK }}>
          <div>✅ 3 tests passed</div><div style={{ color: RED }}>❌ test_users: 500</div><div style={{ color: "#8A6A1F" }}>⚠ utcnow() deprecated ×6</div>
        </div>
      </Card>
      <Mascot x={800} y={730} prop="broom" at={L(19.84, a)} px={9} />
      <div style={{ position: "absolute", left: 60, top: 730 }}><Pill at={L(22.14, a)} bg={MINT} size={28}>before Claude reads it</Pill></div>
    </>
  );
};
const Reveal: React.FC = () => { // full cream: the real repo
  const frame = useCurrentFrame(); const a = 24.46;
  const stars = Math.round(interpolate(frame, [L(24.66, a), L(25.46, a)], [0, 81], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <Stage>
      <Serif at={L(25.06, a)} y={170} size={160} color={INK}>Headroom</Serif>
      <Card x={60} y={420} w={960} h={654} at={2}>
        <MacBar title="github.com/headroomlabs-ai/headroom" dark={false} />
        <OffthreadVideo src={staticFile("b/r17/gh_top.mp4")} muted style={{ width: 960, height: 600, objectFit: "cover", objectPosition: "50% 0%" }} />
      </Card>
      <Row y={1120}><Pill at={L(24.56, a)} bg={INK} color={GOLD}>⭐ {stars}K stars</Pill><Pill at={L(24.96, a)} bg="#fff" color={INK}>🔓 open source · Apache-2.0</Pill></Row>
      <Mascot x={800} y={1250} prop="star" at={L(25.16, a)} px={8} />
    </Stage>
  );
};
const Clever: React.FC = () => <Serif at={L(28.46, 26.61)} y={200} size={90} color="#fff">pretty clever 💡</Serif>;
const Flow: React.FC = () => {
  const frame = useCurrentFrame(); const a = 26.16;
  const node = (x: number, at: number, icon: string, label: string, hl?: boolean) => (
    <Card x={x} y={250} w={290} h={250} at={at} style={hl ? { border: `4px solid ${OR}` } : undefined}>
      <div style={{ textAlign: "center", paddingTop: 34 }}><div style={{ fontSize: 86 }}>{icon}</div><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 36, color: hl ? OR : INK, marginTop: 8 }}>{label}</div></div>
    </Card>
  );
  const p = ((frame - L(26.76, a)) % 50) / 50; const go = frame > L(26.76, a);
  const blockX = p < 0.5 ? interpolate(p, [0, 0.5], [270, 420]) : interpolate(p, [0.5, 1], [700, 790]);
  const squish = p < 0.5 ? 1 : interpolate(frame - L(28.72, a), [0, 10], [1, 0.3], clamp);
  return (
    <>
      <Serif at={L(26.16, a)} y={90} size={86}>it sits <span style={{ color: OR }}>in between</span></Serif>
      {node(40, L(26.26, a), "🤖", "AI agent")}
      {node(395, L(26.56, a), "▣", "Headroom", true)}
      {node(750, L(28.06, a), "🧠", "the model")}
      {go && [0, 1, 2].map((j) => { const q = ((frame - L(26.76, a) + j * 17) % 50) / 50; const bx = q < 0.5 ? interpolate(q, [0, 0.5], [270, 420]) : interpolate(q, [0.5, 1], [700, 790]); const sq = q < 0.5 ? 1 : (frame > L(28.72, a) ? 0.3 : 1); return <div key={j} style={{ position: "absolute", left: bx, top: 530 + (1 - sq) * 60, width: 70, height: 150 * sq, borderRadius: 10, background: q < 0.5 ? `repeating-linear-gradient(180deg, #9AA0AC 0 10px, #D7D3CB 10px 18px)` : `repeating-linear-gradient(180deg, ${MINT} 0 10px, #BFEBD9 10px 18px)`, opacity: 0.9 }} />; })}
      <Serif at={L(28.72, a)} y={700} size={70} color={OR}>compressing 📦</Serif>
      <Mascot x={60} y={560} prop="key" at={L(26.96, a)} px={8} />
      <div style={{ position: "absolute", right: 40, top: 580 }}><Pill at={L(29.56, a)} bg="#fff" color={INK} size={28}>💻 runs on your machine</Pill></div>
    </>
  );
};
const Compact: React.FC = () => {
  const frame = useCurrentFrame(); const a = 34.86;
  const h1 = interpolate(frame, [4, 16], [0, 470], { ...clamp, easing: Easing.out(Easing.cubic) });
  const h2 = interpolate(frame, [L(36.06, a), L(36.66, a)], [0, 170], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return (
    <>
      <Serif at={L(36.06, a)} y={80} size={130}>compact</Serif>
      <div style={{ position: "absolute", left: 190, top: 740 - h1, width: 240, height: h1, borderRadius: 18, background: "repeating-linear-gradient(180deg, #A9ADB5 0 14px, #DAD6CE 14px 24px)", boxShadow: "0 18px 40px rgba(40,30,20,0.15)" }} />
      <div style={{ position: "absolute", left: 650, top: 740 - h2, width: 240, height: h2, borderRadius: 18, background: `repeating-linear-gradient(180deg, ${MINT} 0 14px, #BFEBD9 14px 24px)`, boxShadow: "0 18px 40px rgba(40,30,20,0.15)" }} />
      <div style={{ position: "absolute", left: 190, width: 240, top: 755, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, color: "#6B6F78" }}>before</div>
      <div style={{ position: "absolute", left: 650, width: 240, top: 755, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, color: MINT, opacity: fadeIn(frame, L(36.36, a)) }}>what Claude gets</div>
    </>
  );
};
const Proof: React.FC = () => { // full cream: the README's own numbers
  const a = 30.56; const frame = useCurrentFrame();
  const hi = Math.round(interpolate(frame, [4, 26], [21, 57], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <Stage>
      <Serif at={2} y={150} size={150} color={OR}>21–{hi}%</Serif>
      <div style={{ position: "absolute", left: 830, top: 160, fontSize: 90, transform: `translateY(${interpolate(frame, [26, 34], [-30, 0], clamp)}px)`, opacity: fadeIn(frame, 26) }}>📉</div>
      <Serif at={8} y={330} size={62}>fewer input tokens</Serif>
      <Card x={60} y={470} w={960} h={654} at={4}>
        <MacBar title="headroom · README · Proof" dark={false} />
        <OffthreadVideo src={staticFile("b/r17/gh_proof.mp4")} muted style={{ width: 960, height: 600, objectFit: "cover", objectPosition: "0% 0%" }} />
      </Card>
      <Row y={1170}><Pill at={L(31.56, a)} bg="#fff" color={INK} size={30}>📊 measured on 4 agent tasks · project README</Pill></Row>
      <Row y={1260}><Pill at={L(33.36, a)} bg={MINT}>⚡ automatically</Pill></Row>
    </Stage>
  );
};
const Next: React.FC = () => {
  const frame = useCurrentFrame(); const a = 38.06;
  const nodes = Array.from({ length: 26 }, (_, i) => ({ x: 120 + ((i * 197) % 820), y: 330 + ((i * 131) % 430), r: 10 + (i % 4) * 5 }));
  return (
    <>
      <Row y={80}><Pill at={2} bg={INK} color={GOLD}>⛏ NEXT UP</Pill></Row>
      <Serif at={L(40.76, a)} y={170} size={96}>massive <span style={{ color: OR }}>codebases</span></Serif>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={960}>
        {nodes.map((n, i) => { const m = nodes[(i * 5 + 3) % nodes.length]; const k = interpolate(frame - i * 1.5, [0, 10], [0, 1], clamp); return <g key={i} opacity={k}><line x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke="#C9C2B5" strokeWidth={3} /><circle cx={n.x} cy={n.y} r={n.r} fill={i % 5 === 0 ? OR : "#fff"} stroke={INK} strokeWidth={3} /></g>; })}
      </svg>
      <Mascot x={60} y={780} prop="glass" at={L(39.76, a)} px={9} />
      {frame > 10 && <div style={{ position: "absolute", left: 120 + ((frame * 9) % 820) - 70, top: 400 + Math.sin(frame / 14) * 160, width: 140, height: 140, borderRadius: 99, border: `6px solid ${OR}`, background: "rgba(217,105,63,0.08)", boxShadow: "0 10px 30px rgba(40,30,20,0.2)" }} />}
      <div style={{ position: "absolute", right: 50, top: 800 }}><Pill at={L(40.06, a)} bg="#fff" color={INK} size={28}>🔒 coming next</Pill></div>
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

/* ---------- premium layer: AI opening shot + stock "meme moment" cutaways ---------- */
const Scribble: React.FC<{ kind: "arrow" | "circle"; x: number; y: number; w: number; h: number; rot?: number }> = ({ kind, x, y, w, h, rot = 0 }) => {
  const frame = useCurrentFrame(); const k = interpolate(frame, [2, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const d = kind === "circle"
    ? `M ${w * 0.5} 6 C ${w * 0.95} 4, ${w - 4} ${h * 0.75}, ${w * 0.55} ${h - 6} C ${w * 0.1} ${h - 2}, 4 ${h * 0.35}, ${w * 0.35} 10 C ${w * 0.5} 4, ${w * 0.62} 8, ${w * 0.66} 14`
    : `M 10 10 C ${w * 0.3} ${h * 0.1}, ${w * 0.75} ${h * 0.35}, ${w - 20} ${h - 30} M ${w - 20} ${h - 30} L ${w - 70} ${h - 46} M ${w - 20} ${h - 30} L ${w - 36} ${h - 86}`;
  return <svg style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg)`, overflow: "visible" }} width={w} height={h}><path d={d} fill="none" stroke={RED} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))" }} /></svg>;
};
type Cut = { a: number; b: number; src: string; from: number; tag?: string; land?: boolean; mark?: { kind: "arrow" | "circle"; x: number; y: number; w: number; h: number; rot?: number }; pos?: string };
const CUTS: Cut[] = [ // only 1–2 stock meme moments per reel
  { a: 5.3, b: 6.45, src: "b/r17/mx9228.mp4", from: 3.2, land: true, mark: { kind: "arrow", x: 640, y: 1190, w: 300, h: 240, rot: 200 } },
  { a: 33.3, b: 34.1, src: "b/r17/mx43832.mp4", from: 0.6, pos: "50% 40%" },
];
const CutShot: React.FC<{ c: Cut }> = ({ c }) => {
  const frame = useCurrentFrame(); const z = interpolate(frame, [0, f(c.b - c.a)], [1.08, 1.0], clamp);
  const k = interpolate(frame, [0, 3], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: k, background: "#000" }}>
      {c.land ? <>
        <AbsoluteFill style={{ filter: "blur(28px) brightness(0.55)", transform: "scale(1.15)" }}><OffthreadVideo src={staticFile(c.src)} muted startFrom={Math.round(c.from * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill>
        <div style={{ position: "absolute", left: 0, top: 560, width: 1080, height: 608, transform: `scale(${z})`, boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}><OffthreadVideo src={staticFile(c.src)} muted startFrom={Math.round(c.from * FPS)} style={{ width: 1080, height: 608, objectFit: "cover" }} /></div>
      </> : <AbsoluteFill style={{ transform: `scale(${z})` }}><OffthreadVideo src={staticFile(c.src)} muted startFrom={Math.round(c.from * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: c.pos ?? "50% 50%" }} /></AbsoluteFill>}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), transparent 25%, transparent 70%, rgba(0,0,0,0.45))" }} />
      {c.mark && <Scribble {...c.mark} />}
      {c.tag && <Row y={330}><Pill at={3} bg={INK} color={GOLD} size={46}>{c.tag}</Pill></Row>}
    </AbsoluteFill>
  );
};
const OPEN_END = 0; // the AI shot now lands on the "tokens wasted" line, not the opening
type AiClip = { a: number; b: number; src: string; from: number; tag?: string };
const AI: AiClip[] = [ // Higgsfield-generated clips (see demo/ASSETS.md)
  { a: 16.14, b: 18.14, src: "b/r17/ai_open.mp4", from: 0, tag: "🪙 your tokens" },
  { a: 28.6, b: 30.3, src: "b/r17/ai_compress.mp4", from: 0, tag: "📦 compressing" },
];
const AiShot: React.FC<{ c: AiClip }> = ({ c }) => {
  const frame = useCurrentFrame(); const dur = f(c.b - c.a);
  const z = interpolate(frame, [0, dur], [1.0, 1.08], clamp);
  const k = Math.min(interpolate(frame, [0, 4], [0, 1], clamp), interpolate(frame, [dur - 4, dur], [1, 0], clamp));
  return (
    <AbsoluteFill style={{ opacity: k, background: CREAM }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}><OffthreadVideo src={staticFile(c.src)} muted startFrom={Math.round(c.from * FPS)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></AbsoluteFill>
      {c.tag && <Row y={170}><Pill at={4} bg={INK} color={GOLD} size={46}>{c.tag}</Pill></Row>}
    </AbsoluteFill>
  );
};

/* ---------- layouts ---------- */
type Kind = "split" | "face" | "full";
type Seg = { a: number; b: number; kind: Kind; C?: React.FC };
const SEGS: Seg[] = [
  { a: 0, b: 2.7, kind: "face", C: Start },
  { a: 2.7, b: 7.15, kind: "split", C: Hook },
  { a: 7.15, b: 10.59, kind: "split", C: Prompt },
  { a: 10.59, b: 16.14, kind: "split", C: Flood },
  { a: 16.14, b: 18.14, kind: "full", C: Tokens },
  { a: 18.14, b: 23.31, kind: "split", C: Clean },
  { a: 23.31, b: 24.46, kind: "face", C: There },
  { a: 24.46, b: 26.16, kind: "full", C: Reveal },
  { a: 26.16, b: 30.56, kind: "split", C: Flow },
  { a: 30.56, b: 34.11, kind: "full", C: Proof },
  { a: 34.11, b: 38.06, kind: "face" },
  { a: 38.06, b: 42.11, kind: "split", C: Next },
  { a: 42.11, b: D.duration, kind: "split", C: Follow },
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
  if ((t >= 34.16 && t < 37.91) || t >= D.duration) return null;
  const c = activeChunk(chunks, t); if (!c) return null;
  const s = segAt(t); const inCut = CUTS.some((c) => t >= c.a && t < c.b) || AI.some((c) => t >= c.a && t < c.b);
  const top = inCut ? 1500 : s.kind === "split" ? 1640 : s.kind === "face" ? 1450 : 1700;
  return (
    <div style={{ position: "absolute", top, left: 40, right: 40, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", ...(s.kind === "full" && !inCut ? { background: INK, borderRadius: 999, padding: "10px 30px" } : {}) }}>
        {c.words.map((w, i) => {
          const on = t >= w.s - 0.03, now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
          const word = w.w.replace(/[,.?]$/, "");
          return <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 68, letterSpacing: -1.5, color: KEY.test(word) ? GOLD : "#fff", opacity: on ? 1 : 0.55, transform: `scale(${now ? 1.06 : 1})`, display: "inline-block", textShadow: s.kind === "full" && !inCut ? undefined : "0 4px 14px rgba(0,0,0,0.65), 0 0 2px rgba(0,0,0,0.8)" }}>{word}</span>;
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
    [0.05, "pop", 0.14], [5.3, "whoosh", 0.06], [16.14, "impact", 0.08], [16.5, "8bit_coin", 0.07], [17.1, "8bit_coin", 0.06], [17.6, "8bit_coin", 0.07], [28.7, "whoosh", 0.07], [29.6, "pop", 0.12], [33.3, "pop", 0.1], [2.7, "swish", 0.07], [5.32, "pop", 0.12], [7.15, "click", 0.1], [9, "typing", 0.12],
    [10.8, "glitch", 0.07], [16.14, "swish", 0.07], [16.82, "riser", 0.06], [18.14, "click", 0.1], [19.98, "whoosh", 0.06], [23.31, "pop", 0.1],
    [24.56, "8bit_coin", 0.08], [25.06, "ding", 0.12], [26.16, "click", 0.1], [28.72, "whoosh", 0.06], [30.56, "swish", 0.07], [31.56, "ding", 0.1],
    [38.06, "click", 0.1], [40.76, "pop", 0.1], [42.11, "click", 0.1], [47.06, "pop", 0.1], [D.duration + 0.05, "8bit_levelup", 0.08],
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
      {CUTS.map((c, i) => <Sequence key={`c${i}`} from={f(c.a)} durationInFrames={f(c.b) - f(c.a)}><CutShot c={c} /></Sequence>)}
      {AI.map((c, i) => <Sequence key={`ai${i}`} from={f(c.a)} durationInFrames={f(c.b) - f(c.a)}><AiShot c={c} /></Sequence>)}
      <Captions />
      <Audio src={staticFile(BASE)} />
      <Music src="r/r17_music.wav" total={END} base={0.07} boosts={[[D.duration, END, 0.12]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v} />)}
    </AbsoluteFill>
  );
};

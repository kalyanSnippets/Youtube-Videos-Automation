import React from "react";
import { AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, Easing } from "remotion";
import data from "../public/r/r11f_words.json";
import face from "../public/r/r11f_face.json";
import { f, FPS, INTER, MONO, SERIF, Music, Sfx, chunkWords, activeChunk, useSpring, ReelData } from "./lib";

/* Reel 11: "Headroom" (GitHub Goldmine). Editorial cream-and-terracotta motion graphics: an X-post hook banner on top,
   full-screen diagrams, Kalyan full-frame for hook / CTA / sign-off and in a rounded cutout (bottom right) everywhere else.
   No savings numbers on screen (Kalyan's choice): savings are shown as meters and shapes only. */
const D = data as ReelData & { beats: { beat: string; s: number; e: number }[] };
const END = D.duration + 0.4;
export const R11_FRAMES = Math.ceil(END * FPS);
const C = { bg: "#F4EEE3", bg2: "#EFE6D6", card: "#FFFDF8", ink: "#1F1D1A", mute: "#8A8378", line: "#E3D9C9", acc: "#D9683F", accSoft: "#F6D9CB", green: "#3E8E63", greenSoft: "#D7EBDD", term: "#1E1C1A", termInk: "#EDE6DA", termMute: "#8C857B", red: "#C8402F" };
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const W = 1080;

/* ---------- time helpers ---------- */
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9']/g, "");
const word = (txt: string, after = 0) => { const w = D.words.find((x) => x.s >= after - 0.01 && norm(x.w) === norm(txt)); if (!w) throw new Error("word " + txt); return w.s; };
const beat = (b: string) => D.beats.find((x) => x.beat === b)!;
const S = {
  github: word("github,"), wait: word("wait,"), claudeCode: word("claude", 7), ask: word("ask", 10), suddenly: word("suddenly"), terminal: word("terminal"), logs: word("logs,", 12), repeated: word("repeated"), tokens: word("tokens."),
  imagine: beat("imagine").s, clean: word("clean"), before: word("before", 25), actually: word("actually", 27), headroom: word("headroom."),
  clever: beat("clever").s, sits: word("sits"), agent: word("agent", 33), model: word("model,"), compressing: word("compressing"),
  compact: word("compact"), claudeGets: word("claude", 37.5), interesting: beat("interesting").s, scenario: beat("scenario").s, huge: word("huge"), tests: word("tests,"), errors: word("errors,"), processing: word("processing"),
  helps: beat("helps").s, automatically: word("automatically,"), everyday: word("every", 57), cta: beat("cta").s, comment: word("comment"), repo: word("repository"), guide: word("guide."),
  series: beat("series").s, goldmine: word("goldmine"), another: word("another"), navigate: word("navigate"), follow: beat("follow").s, instagram: word("instagram"), youtube: word("youtube."),
};
// layout per time: full face or graphics + cutout
const FULL: [number, number][] = [[0, beat("problem").s], [S.cta, S.series], [S.follow, END]];
const isFull = (t: number) => FULL.some(([a, b]) => t >= a && t < b);

/* ---------- face video ---------- */
const FT = face as { t: number[]; cx: number[]; cy: number[]; h: number[] };
const smooth = (arr: number[], t: number, win = 0.8) => { let s = 0, n = 0; for (let i = 0; i < FT.t.length; i++) if (Math.abs(FT.t[i] - t) <= win) { s += arr[i]; n++; } return n ? s / n : arr[0]; };
const Vid: React.FC<{ style: React.CSSProperties }> = ({ style }) => <OffthreadVideo src={staticFile("r/r11f_aroll.mp4")} muted style={style} />;
/** Kalyan in a rounded frame. The source's bottom 180 px (an export watermark) is always kept out of frame. */
const FaceFrame: React.FC<{ x: number; y: number; w: number; h: number; zoom: number; faceAt?: number; radius?: number; border?: boolean }> = ({ x, y, w, h, zoom, faceAt = 0.42, radius = 44, border = true }) => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const s = (w / 1080) * zoom;
  const cx = smooth(FT.cx, t), cy = smooth(FT.cy, t);
  let left = w / 2 - cx * s; left = Math.min(0, Math.max(w - 1080 * s, left));
  let top = h * faceAt - cy * s; const maxSrcBottom = 1740; top = Math.min(0, Math.max(h - maxSrcBottom * s, top));
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: radius, overflow: "hidden", background: "#000", boxShadow: "0 24px 60px rgba(60,40,20,.25)", border: border ? `6px solid ${C.card}` : undefined }}>
      <Vid style={{ position: "absolute", left, top, width: 1080 * s, height: 1920 * s }} />
    </div>
  );
};

/* ---------- design primitives ---------- */
const Paper: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, ${C.bg} 0%, ${C.bg2} 100%)` }}>
    <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.line}88 1px, transparent 1px), linear-gradient(90deg, ${C.line}88 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.5 }} />
  </AbsoluteFill>
);
const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; from?: "up" | "scale" | "left" | "right"; dist?: number }> = ({ at, children, style, from = "scale", dist = 60 }) => {
  const frame = useCurrentFrame(); const p = useSpring(f(at), 13, 170);
  if (frame < f(at)) return null;
  const tr = from === "scale" ? `scale(${interpolate(p, [0, 1], [0.6, 1])})` : from === "up" ? `translateY(${interpolate(p, [0, 1], [dist, 0])}px)` : from === "left" ? `translateX(${interpolate(p, [0, 1], [-dist, 0])}px)` : `translateX(${interpolate(p, [0, 1], [dist, 0])}px)`;
  return <div style={{ position: "absolute", opacity: Math.min(1, p * 1.8), transform: tr, ...style }}>{children}</div>;
};
const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, bg = C.card, color = C.ink, size = 34, style }) => (
  <div style={{ background: bg, color, fontFamily: INTER, fontWeight: 700, fontSize: size, padding: `${size * 0.35}px ${size * 0.7}px`, borderRadius: size, border: `2px solid ${bg === C.card ? C.line : bg}`, boxShadow: "0 8px 24px rgba(60,40,20,.10)", whiteSpace: "nowrap", ...style }}>{children}</div>
);
const Title: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 96, style }) => (
  <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: size, color: C.ink, letterSpacing: -2, lineHeight: 1.02, ...style }}>{children}</div>
);
const Kicker: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.acc, style }) => (
  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 6, color, textTransform: "uppercase", ...style }}>{children}</div>
);
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: C.card, borderRadius: 32, border: `2px solid ${C.line}`, boxShadow: "0 20px 50px rgba(60,40,20,.12)", ...style }}>{children}</div>
);

/* ---------- top hook banner: an X-post style card from @aiwithkalyan ---------- */
const Banner: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const p = useSpring(0, 16, 140);
  const slim = !isFull(t);
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 110, transform: `translateY(${interpolate(p, [0, 1], [-200, 0])}px)` }}>
      <Card style={{ padding: slim ? "22px 30px" : "30px 36px", display: "flex", flexDirection: "column", gap: slim ? 10 : 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Img src={staticFile("img/r11_avatar.png")} style={{ width: slim ? 64 : 84, height: slim ? 64 : 84, borderRadius: 50 }} />
          <div>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: slim ? 30 : 36, color: C.ink }}>AI with Kalyan <span style={{ color: "#1D9BF0" }}>✓</span></div>
            <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: slim ? 24 : 28, color: C.mute }}>@aiwithkalyan · GitHub Goldmine</div>
          </div>
        </div>
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: slim ? 36 : 46, color: C.ink, lineHeight: 1.15 }}>
          This GitHub repo stops <span style={{ color: C.acc }}>Claude Code</span> from drowning in its own logs.
        </div>
      </Card>
    </div>
  );
};

/* ---------- captions: white pill, active word in terracotta ---------- */
const CH = chunkWords(D.words, 3, 18);
const Captions: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const c = activeChunk(CH, t); if (!c) return null;
  const y = isFull(t) ? 1400 : 1130;
  const p = interpolate(t, [c.s - 0.05, c.s + 0.08], [0.85, 1], cl);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", transform: `scale(${p})` }}>
      <div style={{ background: "#fff", borderRadius: 26, padding: "14px 30px", boxShadow: "0 12px 30px rgba(0,0,0,.18)", fontFamily: INTER, fontWeight: 800, fontSize: 58, color: C.ink, display: "flex", gap: 16 }}>
        {c.words.map((w, i) => { const on = t >= w.s - 0.04; const now = t >= w.s - 0.04 && t < w.e + 0.05; return <span key={i} style={{ color: now ? C.acc : C.ink, opacity: on ? 1 : 0.35 }}>{w.w.replace(/["“”]/g, "")}</span>; })}
      </div>
    </div>
  );
};

/* ================= scenes ================= */
const G0 = 330; // graphics area top (under the banner)

// hook: Kalyan full frame + GitHub card + "wait, what?" stamp
const Hook: React.FC = () => (
  <>
    <Pop at={S.github} from="left" style={{ left: 70, top: 1100 }}>
      <Card style={{ padding: "20px 28px", display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: 27, background: C.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 800, fontSize: 26 }}>{"{}"}</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, color: C.ink }}>github.com/<span style={{ color: C.acc }}>explore</span></div>
      </Card>
    </Pop>
    <Pop at={S.wait} style={{ right: 60, top: 1000 }}>
      <div style={{ transform: "rotate(-6deg)", background: C.acc, color: "#fff", fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 64, padding: "10px 34px", borderRadius: 18, boxShadow: "0 16px 40px rgba(217,104,63,.4)" }}>wait… what?</div>
    </Pop>
  </>
);

// the session floods: a terminal on cream
const LOGS = ["PASS  src/auth/login.test.ts", "[vite] hmr update /src/App.tsx", "WARN  deprecated request@2.88", "GET /api/session 200 12ms", " FAIL  src/auth/login.test.ts", "  at verify (src/auth/jwt.ts:41)", "npm WARN unsupported engine", "Tests: 1 failed, 41 passed"];
const REP = new Set([0, 1, 2]);
const lineAt = (i: number) => { const h = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1; return h < 0.55 ? Math.floor(h * 5.4) % 3 : 3 + Math.floor(h * 97) % 5; };
const Terminal: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const ask = "fix one small bug";
  const typed = ask.slice(0, Math.floor(interpolate(t, [S.ask + 0.4, S.ask + 1.4], [0, ask.length], cl)));
  const x = Math.max(0, t - S.suddenly); const n = Math.floor(4 * x + 2.2 * x * x);
  const rows = 15; const lines: number[] = []; for (let i = Math.max(0, n - rows); i < n; i++) lines.push(lineAt(i));
  const fill = interpolate(t, [S.suddenly, S.tokens + 0.3], [0.08, 1], cl);
  const full = t > S.tokens;
  return (
    <div style={{ position: "absolute", left: 50, top: G0 + 40, width: 980 }}>
      <Pop at={beat("problem").s + 0.05} from="up">
        <div style={{ width: 980, borderRadius: 30, background: C.term, boxShadow: "0 30px 70px rgba(30,20,10,.35)", overflow: "hidden" }}>
          <div style={{ height: 70, display: "flex", alignItems: "center", gap: 12, padding: "0 26px", background: "#2A2724" }}>
            {["#E5604D", "#E9B44C", "#5FB15F"].map((c) => <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, color: C.termInk, marginLeft: 16 }}>claude — ~/app</div>
          </div>
          {/* context meter: no number, just how full it is */}
          <div style={{ padding: "20px 30px 8px" }}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.termMute, letterSpacing: 3, marginBottom: 10 }}>CONTEXT WINDOW</div>
            <div style={{ height: 22, borderRadius: 11, background: "#3A3632", overflow: "hidden" }}>
              <div style={{ width: `${fill * 100}%`, height: "100%", background: fill > 0.8 ? C.red : C.acc, borderRadius: 11 }} />
            </div>
          </div>
          <div style={{ height: 560, padding: "16px 30px", fontFamily: MONO, fontSize: 27, lineHeight: "36px", color: C.termInk, overflow: "hidden" }}>
            <div><span style={{ color: C.acc }}>❯</span> {typed}{t < S.ask + 1.6 && Math.floor(t * 3) % 2 === 0 ? "▍" : ""}</div>
            {lines.map((k, i) => <div key={i} style={{ color: REP.has(k) ? C.termMute : C.termInk, background: REP.has(k) && t > S.repeated ? "rgba(217,104,63,.22)" : "transparent", whiteSpace: "nowrap" }}>{LOGS[k]}</div>)}
          </div>
        </div>
      </Pop>
      <Pop at={S.terminal} from="left" style={{ left: 10, top: 940 }}><Chip size={38}>terminal output</Chip></Pop>
      <Pop at={S.logs} from="left" style={{ left: 10, top: 1050 }}><Chip size={38}>logs</Chip></Pop>
      <Pop at={S.repeated} from="left" style={{ left: 10, top: 1160 }}><Chip size={38} bg={C.acc} color="#fff">repeated info</Chip></Pop>
      {full && <Pop at={S.tokens} style={{ left: 180, top: 190 }}><div style={{ background: C.red, color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 40, padding: "14px 30px", borderRadius: 20, boxShadow: "0 16px 40px rgba(200,64,47,.45)", transform: `rotate(-3deg) scale(${1 + 0.04 * Math.sin(t * 18)})` }}>⚠ Context window almost full</div></Pop>}
    </div>
  );
};

// imagine: messy strips, a sweep cleans the duplicates before Claude reads them
const Imagine: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const sweep = interpolate(t, [S.clean, S.clean + 1.0], [0, 1], { ...cl, easing: ease });
  const strips = [0, 1, 0, 2, 0, 1, 3, 0, 2, 1, 0, 4];
  return (
    <>
      <div style={{ position: "absolute", left: 60, top: G0 + 30, width: 560, height: 700 }}>
        {strips.map((k, i) => { const dup = strips.indexOf(k) !== i; const gone = dup ? interpolate(sweep, [i / 14, i / 14 + 0.15], [0, 1], cl) : 0; const keepY = [0, 1, 2, 3, 4].indexOf(k);
          const y = interpolate(sweep, [0.6, 1], [i * 56, (dup ? i * 56 : keepY * 66)], cl);
          return <Pop key={i} at={S.imagine + 0.1 + i * 0.07} from="left" style={{ left: 0, top: y, opacity: 1 - gone, transform: `translateX(${gone * -200}px)` }}>
            <div style={{ width: 520, height: 46, borderRadius: 12, background: dup ? C.accSoft : C.card, border: `2px solid ${dup ? C.acc : C.line}`, display: "flex", alignItems: "center", padding: "0 18px", fontFamily: MONO, fontSize: 22, color: C.ink, whiteSpace: "nowrap", overflow: "hidden" }}>{LOGS[k]}</div>
          </Pop>; })}
        {sweep > 0 && sweep < 1 && <div style={{ position: "absolute", left: -20, top: sweep * 700 - 10, width: 600, height: 8, borderRadius: 4, background: C.acc, boxShadow: `0 0 30px ${C.acc}` }} />}
      </div>
      <Pop at={S.imagine + 0.5} from="right" style={{ left: 690, top: G0 + 170 }}>
        <Card style={{ width: 320, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 110, height: 110, borderRadius: 30, background: C.acc, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 70 }}>C</div>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 38, color: C.ink }}>Claude</div>
          <div style={{ fontFamily: MONO, fontSize: 22, color: C.mute }}>{t < S.before ? "waiting…" : "reads it ✓"}</div>
        </Card>
      </Pop>
      <Pop at={S.before - 0.1} from="up" style={{ left: 60, top: G0 + 640 }}><Title size={84}>before Claude <span style={{ color: C.acc }}>reads it</span></Title></Pop>
    </>
  );
};

// reveal: Headroom
const Reveal: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const u = interpolate(t, [S.headroom + 0.2, S.headroom + 0.8], [0, 1], { ...cl, easing: ease });
  return (
    <>
      <Pop at={S.actually - 0.3} from="up" style={{ left: 80, top: G0 + 80 }}><Kicker>an open-source github find</Kicker></Pop>
      <Pop at={S.headroom} style={{ left: 70, top: G0 + 150 }}>
        <Title size={190}>Headroom</Title>
        <div style={{ height: 14, width: 860 * u, background: C.acc, borderRadius: 7, marginTop: 6 }} />
      </Pop>
      <Pop at={S.headroom + 0.35} from="up" style={{ left: 80, top: G0 + 470 }}><Chip size={34}>⎇ chopratejas/headroom · open source</Chip></Pop>
      <Pop at={S.headroom + 0.6} from="up" style={{ left: 80, top: G0 + 580 }}>
        <div style={{ background: C.term, color: C.termInk, fontFamily: MONO, fontWeight: 700, fontSize: 38, padding: "20px 34px", borderRadius: 20 }}><span style={{ color: C.acc }}>$</span> headroom wrap claude</div>
      </Pop>
    </>
  );
};

// how it works: agent → Headroom → model, duplicates fold inside the filter
const Node: React.FC<{ label: string; sub: string; color: string; icon: string }> = ({ label, sub, color, icon }) => (
  <Card style={{ width: 560, padding: "22px 30px", display: "flex", alignItems: "center", gap: 24 }}>
    <div style={{ width: 86, height: 86, borderRadius: 24, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46 }}>{icon}</div>
    <div><div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, color: C.ink }}>{label}</div><div style={{ fontFamily: MONO, fontSize: 24, color: C.mute }}>{sub}</div></div>
  </Card>
);
const How: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const fold = interpolate(t, [S.compressing, S.compressing + 1.2], [0, 1], { ...cl, easing: ease });
  const chips = ["logs", "logs", "tool output", "logs", "logs", "files"];
  return (
    <>
      <Pop at={S.clever} from="up" style={{ left: 60, top: G0 + 10 }}><Kicker>how it works</Kicker></Pop>
      <Pop at={S.agent - 0.15} from="left" style={{ left: 260, top: G0 + 70 }}><Node label="AI coding agent" sub="Claude Code" color={C.ink} icon="⌨" /></Pop>
      {/* the filter */}
      <Pop at={S.sits} style={{ left: 190, top: G0 + 330 }}>
        <div style={{ width: 700, height: 150, borderRadius: 75, background: C.acc, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, boxShadow: "0 24px 60px rgba(217,104,63,.45)" }}>
          <div style={{ fontSize: 54 }}>⏚</div><div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 74, color: "#fff" }}>Headroom</div>
        </div>
      </Pop>
      <Pop at={S.model - 0.15} from="right" style={{ left: 260, top: G0 + 590 }}><Node label="The model" sub="reads the context" color={C.green} icon="◎" /></Pop>
      {/* chips falling from the agent into the filter; repeats merge */}
      {t > S.sits + 0.3 && chips.map((c, i) => {
        const ph = ((t - S.sits - 0.3) * 0.7 + i / chips.length) % 1;
        const y = G0 + 200 + ph * 140; const dup = c === "logs" && i !== 0;
        const op = dup ? 1 - fold : 1; const x = 120 + i * 140 + (dup ? fold * (120 - i * 140) : 0);
        return <div key={i} style={{ position: "absolute", left: x, top: y, opacity: op * Math.sin(ph * Math.PI) * 1.4 }}><Chip size={24} bg={c === "logs" ? C.accSoft : C.card}>{c}</Chip></div>;
      })}
      {t > S.compressing + 0.6 && <Pop at={S.compressing + 0.6} style={{ left: 340, top: G0 + 500 }}><Chip size={28} bg={C.greenSoft} color={C.green}>logs × many → 1 summary</Chip></Pop>}
    </>
  );
};

// compact: before / after, no numbers
const Compact: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const shrink = interpolate(t, [S.compact - 0.2, S.compact + 0.5], [0, 1], { ...cl, easing: ease });
  return (
    <>
      <Pop at={S.claudeGets - 0.3} from="up" style={{ left: 60, top: G0 + 10 }}><Kicker>what Claude reads</Kicker></Pop>
      <Pop at={S.claudeGets - 0.2} from="left" style={{ left: 90, top: G0 + 90 }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 36, color: C.mute, marginBottom: 14 }}>Before</div>
        {Array.from({ length: 13 }).map((_, i) => <div key={i} style={{ width: 380 - (i % 3) * 40, height: 34, marginBottom: 10, borderRadius: 8, background: i % 2 ? "#D9CFBF" : "#E5DCCD" }} />)}
      </Pop>
      <Pop at={S.compact - 0.2} from="right" style={{ left: 590, top: G0 + 90 }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 36, color: C.green, marginBottom: 14 }}>With Headroom</div>
        <Card style={{ width: 400, padding: 24, borderColor: C.green, transform: `scale(${0.9 + 0.1 * shrink})` }}>
          {["FAIL  login.test.ts", "expected 401, got 200", "repeats folded ✓"].map((s, i) => <div key={i} style={{ fontFamily: MONO, fontSize: 26, color: i === 2 ? C.green : C.ink, marginBottom: 10 }}>{s}</div>)}
        </Card>
      </Pop>
      <Pop at={S.compact + 0.1} style={{ left: 600, top: G0 + 420 }}><div style={{ transform: "rotate(-8deg)", border: `6px solid ${C.green}`, color: C.green, fontFamily: INTER, fontWeight: 900, fontSize: 70, padding: "6px 26px", borderRadius: 16, letterSpacing: 4 }}>COMPACT</div></Pop>
    </>
  );
};

// "really interesting?"
const Interesting: React.FC = () => (
  <Pop at={S.interesting} from="up" style={{ left: 70, top: G0 + 220 }}>
    <Kicker style={{ marginBottom: 20 }}>but here's the best part</Kicker>
    <Title size={120}>what makes it <span style={{ color: C.acc }}>really</span> interesting?</Title>
  </Pop>
);

// huge project: terminal tiles multiply, tests / errors, all streaming logs
const Scenario: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const n = Math.min(12, Math.floor(interpolate(t, [S.huge - 0.3, S.huge + 1.4], [1, 12], cl)));
  return (
    <>
      <Pop at={S.scenario} from="up" style={{ left: 60, top: G0 + 10 }}><Kicker>a huge project</Kicker></Pop>
      {Array.from({ length: n }).map((_, i) => {
        const col = i % 3, row = Math.floor(i / 3); const ok = t > S.tests && i % 4 !== 3; const bad = t > S.errors && i % 4 === 3;
        const stream = t > S.processing ? (t * 6 + i) % 5 : 0;
        return <Pop key={i} at={S.huge - 0.3 + i * 0.12} style={{ left: 70 + col * 320, top: G0 + 70 + row * 175 }}>
          <div style={{ width: 290, height: 158, borderRadius: 20, background: C.term, padding: 16, overflow: "hidden", boxShadow: "0 12px 30px rgba(30,20,10,.25)", border: bad ? `4px solid ${C.red}` : "4px solid transparent" }}>
            {[0, 1, 2, 3].map((r) => <div key={r} style={{ height: 14, width: `${50 + ((r * 37 + i * 13 + Math.floor(stream) * 11) % 45)}%`, background: r === 0 ? "#5A544D" : "#3E3934", borderRadius: 7, marginBottom: 10 }} />)}
            {ok && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, color: "#7FCF8E" }}>✓ tests passed</div>}
            {bad && <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, color: "#FF8A7A" }}>✗ error</div>}
          </div>
        </Pop>;
      })}
      <Pop at={S.tests} from="left" style={{ left: 60, top: 1300 }}><Chip size={38}>running tests</Chip></Pop>
      <Pop at={S.errors} from="left" style={{ left: 60, top: 1410 }}><Chip size={38} bg={C.red} color="#fff">debugging errors</Chip></Pop>
    </>
  );
};

// helps: curves without numbers + the automatic switch
const Helps: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const u = interpolate(t, [S.helps + 0.2, S.helps + 2.2], [0, 1], { ...cl, easing: ease });
  const on = t > S.automatically;
  const P = (k: number) => Array.from({ length: 41 }).map((_, i) => { const x = i / 40; return `${i ? "L" : "M"}${60 + x * 820},${520 - (k * x * x + x * 0.15) * 440}`; }).join(" ");
  return (
    <>
      <Pop at={S.helps} from="up" style={{ left: 60, top: G0 + 10 }}><Kicker>tokens used over a session</Kicker></Pop>
      <Pop at={S.helps + 0.1} style={{ left: 60, top: G0 + 70 }}>
        <Card style={{ width: 960, height: 600, position: "relative" }}>
          <svg width={960} height={600}>
            <line x1={60} y1={520} x2={900} y2={520} stroke={C.line} strokeWidth={3} /><line x1={60} y1={60} x2={60} y2={520} stroke={C.line} strokeWidth={3} />
            <path d={P(0.95)} fill="none" stroke={C.acc} strokeWidth={10} strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - u)} />
            <path d={P(0.32)} fill="none" stroke={C.green} strokeWidth={10} strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - u)} />
          </svg>
          <div style={{ position: "absolute", left: 560, top: 70, fontFamily: INTER, fontWeight: 800, fontSize: 32, color: C.acc, opacity: u }}>without Headroom</div>
          <div style={{ position: "absolute", left: 600, top: 330, fontFamily: INTER, fontWeight: 800, fontSize: 32, color: C.green, opacity: u }}>with Headroom</div>
          <div style={{ position: "absolute", left: 70, bottom: 22, fontFamily: MONO, fontSize: 22, color: C.mute }}>time →</div>
        </Card>
      </Pop>
      <Pop at={S.automatically - 0.2} style={{ left: 280, top: G0 + 700 }}>
        <Card style={{ padding: "18px 30px", display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 36, color: C.ink }}>Automatic</div>
          <div style={{ width: 110, height: 60, borderRadius: 30, background: on ? C.green : "#CFC6B6", position: "relative" }}><div style={{ position: "absolute", top: 6, left: on ? 56 : 6, width: 48, height: 48, borderRadius: 24, background: "#fff", boxShadow: "0 4px 10px rgba(0,0,0,.2)" }} /></div>
        </Card>
      </Pop>
    </>
  );
};

// every day: a week of sessions
const Week: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  return (
    <>
      <Pop at={beat("helps2").s} from="up" style={{ left: 60, top: G0 + 10 }}><Kicker>every day</Kicker></Pop>
      {["MON", "TUE", "WED", "THU", "FRI"].map((d, i) => {
        const at = beat("helps2").s + 0.2 + i * 0.25; const tick = t > S.everyday + i * 0.08;
        return <Pop key={d} at={at} from="up" style={{ left: 60 + i * 194, top: G0 + 200 }}>
          <Card style={{ width: 176, height: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-around" }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color: C.mute }}>{d}</div>
            <div style={{ width: 90, height: 90, borderRadius: 45, background: tick ? C.green : C.line, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>{tick ? "✓" : ""}</div>
            <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 22, color: C.mute }}>compact</div>
          </Card>
        </Pop>;
      })}
      <Pop at={beat("helps2").s + 0.4} from="up" style={{ left: 60, top: G0 + 560 }}><Title size={80}>for AI coding agents, <span style={{ color: C.acc }}>every day</span></Title></Pop>
    </>
  );
};

// CTA: comment GOLD (over the full-frame face)
const CTA: React.FC = () => (
  <>
    <Pop at={S.comment - 0.1} style={{ left: 90, top: 1060 }}>
      <div style={{ background: C.acc, borderRadius: 28, padding: "22px 44px", boxShadow: "0 24px 60px rgba(217,104,63,.5)", transform: "rotate(-2deg)" }}>
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 40, color: "#FFE9DF" }}>comment</div>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 130, color: "#fff", letterSpacing: 6, lineHeight: 1 }}>GOLD</div>
      </div>
    </Pop>
    <Pop at={S.repo - 0.2} from="right" style={{ left: 540, top: 1080 }}><Chip size={32}>⎇ GitHub repo</Chip></Pop>
    <Pop at={S.guide - 0.6} from="right" style={{ left: 540, top: 1180 }}><Chip size={32} bg={C.ink} color="#fff">📘 setup guide</Chip></Pop>
  </>
);

// series teaser: GitHub Goldmine
const Series: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  const reveal = interpolate(t, [S.navigate, S.navigate + 1.6], [0, 1], cl);
  const NODES = Array.from({ length: 22 }).map((_, i) => ({ x: 90 + ((i * 137) % 800), y: 470 + ((i * 89) % 300) }));
  const PATH = [0, 5, 9, 14, 3, 17, 21];
  return (
    <>
      <Pop at={S.series} from="up" style={{ left: 60, top: G0 + 10 }}><Kicker>the series</Kicker></Pop>
      <Pop at={S.goldmine - 0.5} style={{ left: 60, top: G0 + 60 }}><Title size={110}>GitHub <span style={{ color: C.acc }}>Goldmine</span></Title></Pop>
      <Pop at={S.goldmine} from="left" style={{ left: 60, top: G0 + 220 }}><Card style={{ width: 440, padding: "20px 26px" }}><Kicker color={C.mute}>find #01</Kicker><div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: C.ink, marginTop: 6 }}>Headroom <span style={{ color: C.green }}>✓</span></div></Card></Pop>
      <Pop at={S.another} from="right" style={{ left: 540, top: G0 + 220 }}><Card style={{ width: 440, padding: "20px 26px", background: C.ink, borderColor: C.ink }}><Kicker color="#B9AFA2">find #02</Kicker><div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: "#fff", marginTop: 6, filter: "blur(9px)" }}>coming soon</div><div style={{ position: "absolute", right: 26, top: 40, fontSize: 44 }}>🔒</div></Card></Pop>
      {t > S.navigate - 0.3 && (
        <svg style={{ position: "absolute", left: 40, top: G0 }} width={1000} height={820}>
          {NODES.map((a, i) => NODES.slice(i + 1, i + 3).map((b, j) => <line key={i + "-" + j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.line} strokeWidth={3} opacity={reveal} />))}
          {NODES.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={14} fill={C.card} stroke={C.mute} strokeWidth={3} opacity={Math.min(1, reveal * 3 - i * 0.1)} />)}
          {PATH.slice(0, Math.floor(reveal * PATH.length)).map((k, i, arr) => i ? <line key={"p" + i} x1={NODES[arr[i - 1]].x} y1={NODES[arr[i - 1]].y} x2={NODES[k].x} y2={NODES[k].y} stroke={C.acc} strokeWidth={8} strokeLinecap="round" /> : null)}
          {PATH.slice(0, Math.floor(reveal * PATH.length)).map((k) => <circle key={"c" + k} cx={NODES[k].x} cy={NODES[k].y} r={16} fill={C.acc} />)}
        </svg>
      )}
    </>
  );
};

// sign-off: follow card on Instagram + YouTube
const Follow: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  return (
    <Pop at={S.follow + 0.2} from="up" style={{ left: 90, top: 1040 }}>
      <Card style={{ width: 900, padding: 30, display: "flex", alignItems: "center", gap: 24 }}>
        <Img src={staticFile("img/r11_avatar.png")} style={{ width: 110, height: 110, borderRadius: 55 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 44, color: C.ink }}>AI with Kalyan</div>
          <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 26, color: C.mute }}>new GitHub finds every week</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: t > S.instagram ? C.line : C.acc, color: t > S.instagram ? C.ink : "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 28, padding: "12px 24px", borderRadius: 18, textAlign: "center" }}>{t > S.instagram ? "Following ✓" : "Follow"}</div>
          <div style={{ background: t > S.youtube ? C.line : "#E5332A", color: t > S.youtube ? C.ink : "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 28, padding: "12px 24px", borderRadius: 18, textAlign: "center" }}>{t > S.youtube ? "Subscribed ✓" : "Subscribe"}</div>
        </div>
      </Card>
    </Pop>
  );
};

/* ---------- the reel ---------- */
// scenes run on the reel's own clock (no frame offset), shown only inside [a, b)
const Seq: React.FC<{ a: number; b: number; children: React.ReactNode }> = ({ a, b, children }) => { const t = useCurrentFrame() / FPS; return t >= a && t < b ? <AbsoluteFill>{children}</AbsoluteFill> : null; };
const Faces: React.FC = () => {
  const frame = useCurrentFrame(); const t = frame / FPS;
  if (isFull(t)) return <FaceFrame x={40} y={isFull(t) && t < beat("problem").s ? 470 : 330} w={1000} h={t < beat("problem").s ? 1180 : 1320} zoom={1.15} faceAt={0.36} />;
  // cutout bottom right while the graphics play
  return <FaceFrame x={640} y={1270} w={390} h={420} zoom={2.1} faceAt={0.48} radius={40} />;
};

export const Reel11: React.FC = () => {
  const b = beat;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Paper />
      <Seq a={b("problem").s} b={S.imagine}><Terminal /></Seq>
      <Seq a={S.imagine} b={S.actually - 0.6}><Imagine /></Seq>
      <Seq a={S.actually - 0.6} b={S.clever}><Reveal /></Seq>
      <Seq a={S.clever} b={S.claudeGets - 0.3}><How /></Seq>
      <Seq a={S.claudeGets - 0.3} b={S.interesting}><Compact /></Seq>
      <Seq a={S.interesting} b={S.scenario}><Interesting /></Seq>
      <Seq a={S.scenario} b={S.helps}><Scenario /></Seq>
      <Seq a={S.helps} b={b("helps2").s}><Helps /></Seq>
      <Seq a={b("helps2").s} b={S.cta}><Week /></Seq>
      <Faces />
      <Seq a={0} b={b("problem").s}><Hook /></Seq>
      <Seq a={S.cta} b={S.series}><CTA /></Seq>
      <Seq a={S.series} b={S.follow}><Series /></Seq>
      <Seq a={S.follow} b={END}><Follow /></Seq>
      <Banner />
      <Captions />
      {/* audio */}
      <Audio src={staticFile("r/r11f_voice.wav")} />
      <Music src="r/r11_music.wav" total={END} base={0.07} boosts={[[END - 1.6, END, 0.16]]} />
      <Sfx at={S.github} name="pop" vol={0.35} /><Sfx at={S.wait} name="impact" vol={0.3} />
      <Sfx at={b("problem").s} name="whoosh" vol={0.3} /><Sfx at={S.ask + 0.4} name="typing" vol={0.25} />
      <Sfx at={S.terminal} name="click" vol={0.3} /><Sfx at={S.logs} name="click" vol={0.3} /><Sfx at={S.repeated} name="pop" vol={0.35} /><Sfx at={S.tokens} name="glitch" vol={0.25} />
      <Sfx at={S.imagine} name="swish" vol={0.3} /><Sfx at={S.clean} name="whoosh" vol={0.3} /><Sfx at={S.before - 0.1} name="pop" vol={0.3} />
      <Sfx at={S.headroom} name="impact" vol={0.35} /><Sfx at={S.headroom + 0.6} name="typing" vol={0.2} />
      <Sfx at={S.clever} name="swish" vol={0.3} /><Sfx at={S.sits} name="pop" vol={0.3} /><Sfx at={S.agent - 0.15} name="click" vol={0.3} /><Sfx at={S.model - 0.15} name="click" vol={0.3} /><Sfx at={S.compressing + 0.6} name="ding" vol={0.25} />
      <Sfx at={S.compact + 0.1} name="impact" vol={0.3} /><Sfx at={S.interesting} name="riser" vol={0.2} />
      <Sfx at={S.huge - 0.3} name="blip" vol={0.25} /><Sfx at={S.tests} name="ding" vol={0.2} /><Sfx at={S.errors} name="glitch" vol={0.2} />
      <Sfx at={S.helps} name="swish" vol={0.3} /><Sfx at={S.automatically} name="click" vol={0.35} /><Sfx at={S.everyday} name="ding" vol={0.25} />
      <Sfx at={S.cta} name="whoosh" vol={0.3} /><Sfx at={S.comment - 0.1} name="notify" vol={0.35} />
      <Sfx at={S.series} name="swish" vol={0.3} /><Sfx at={S.goldmine} name="ding" vol={0.25} /><Sfx at={S.navigate} name="uplink" vol={0.2} />
      <Sfx at={S.follow} name="whoosh" vol={0.3} /><Sfx at={S.instagram} name="click" vol={0.35} /><Sfx at={S.youtube} name="click" vol={0.35} />
    </AbsoluteFill>
  );
};

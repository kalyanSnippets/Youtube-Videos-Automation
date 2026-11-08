import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo, Img } from "remotion";
import data from "../public/r/r6f_words.json";
import { Aroll, Cursor, f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, SubscribeCard, Typewriter, Flash, Glitch, chunkWords, activeChunk } from "./lib";

/* Reel 6: Mo by Momentic. "QA terminal / bug hunt" style: dark terminal green, red alerts, mono type.
   Mixed layout: 60/40 for demos, full-screen face for the punchy lines. */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R6_FRAMES = Math.ceil(END * FPS);

const C = { bg: "#070A08", panel: "#0E1511", line: "rgba(34,197,94,0.08)", green: "#22C55E", lime: "#A3E635", red: "#EF4444", amber: "#F59E0B", ink: "#0F172A", mute: "#6B7F73", white: "#F8FAFC" };
const FACE_Y = 1152;
const TOP = 290; // top of the visual area (below captions)
const MOMENTIC = "Source: momentic.ai";

/* terminal backdrop with scanlines */
const Term: React.FC<{ glow?: string; children?: React.ReactNode }> = ({ glow = "rgba(34,197,94,0.14)", children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: "54px 54px" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, ${glow}, transparent 65%)` }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 5px)", transform: `translateY(${(frame * 2) % 5}px)` }} />
      {children}
    </AbsoluteFill>
  );
};

/* status line at the very top of each demo scene */
const Status: React.FC<{ text: string; color?: string }> = ({ text, color = C.green }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 40, top: TOP - 52, fontFamily: MONO, fontWeight: 800, fontSize: 26, color, letterSpacing: 2 }}>
      <span style={{ opacity: Math.floor(frame / 12) % 2 ? 1 : 0.35 }}>●</span> {text}
    </div>
  );
};

/* ---------- mock shop (all illustration) ---------- */
type ShopMode = "build" | "ok" | "fail" | "plain";
export const Shop: React.FC<{ mode: ShopMode; buildDur?: number; clickAt?: number; failAt?: number; scale?: number; top?: number }> = ({ mode, buildDur = 60, clickAt = 999, failAt = 999, scale = 1.18, top = TOP + 10 }) => {
  const frame = useCurrentFrame();
  const shown = (i: number) => mode !== "build" || frame >= (i * buildDur) / 5;
  const pressed = frame >= clickAt && frame < clickAt + 6;
  const failed = mode === "fail" && frame >= failAt;
  const block = (i: number, el: React.ReactNode) => (
    <div style={{ opacity: shown(i) ? 1 : 0, transform: `translateY(${shown(i) ? 0 : 20}px)` }}>{el}</div>
  );
  return (
    <div style={{ position: "absolute", left: 100, right: 100, top, transform: `scale(${scale})`, transformOrigin: "50% 0%" }}>
      <div style={{ background: "#fff", borderRadius: 26, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", border: failed ? `6px solid ${C.red}` : "6px solid transparent" }}>
        <div style={{ height: 52, background: "#E5E7EB", display: "flex", alignItems: "center", gap: 10, padding: "0 20px" }}>
          {["#EF4444", "#F59E0B", "#22C55E"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <div style={{ marginLeft: 14, flex: 1, height: 32, borderRadius: 16, background: "#fff", fontFamily: MONO, fontSize: 20, color: "#6B7280", display: "flex", alignItems: "center", padding: "0 16px" }}>shopnova.store/checkout</div>
        </div>
        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
          {block(0, <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 44, color: C.ink }}>ShopNova</div><div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 26, color: "#6B7280" }}>🛒 Cart (1)</div></div>)}
          {block(1, (
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <div style={{ width: 220, height: 180, borderRadius: 20, background: "linear-gradient(135deg,#FDE68A,#FCA5A5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110 }}>👟</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 38, color: C.ink }}>Nova Runner</div>
                <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 28, color: "#6B7280" }}>★★★★★ · Free shipping</div>
                <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 42, color: C.ink }}>$89.00</div>
              </div>
            </div>
          ))}
          {block(2, <div style={{ display: "flex", gap: 14 }}>{["Size 9", "Black", "Qty 1"].map((t) => <div key={t} style={{ fontFamily: INTER, fontWeight: 700, fontSize: 26, padding: "10px 20px", borderRadius: 12, border: "2px solid #E5E7EB", color: C.ink }}>{t}</div>)}</div>)}
          {block(3, (
            <div style={{ background: failed ? "#FEE2E2" : "#111827", color: failed ? C.red : "#fff", borderRadius: 16, padding: "20px 0", textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 36, transform: `scale(${pressed ? 0.95 : 1})` }}>
              {failed ? "⚠ Payment failed · error 500" : "Checkout →"}
            </div>
          ))}
        </div>
      </div>
      {mode === "ok" && (
        <div style={{ position: "absolute", right: -20, top: -30, display: "flex", flexDirection: "column", gap: 10 }}>
          {["Design", "Layout", "Mobile"].map((t, i) => (
            <PopIn key={t} delay={4 + i * 5} from="left"><div style={{ background: C.green, color: "#04110a", fontFamily: MONO, fontWeight: 800, fontSize: 28, padding: "8px 18px", borderRadius: 12 }}>✓ {t}</div></PopIn>
          ))}
        </div>
      )}
    </div>
  );
};

const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; delay?: number; top: number; size?: number; mono?: boolean }> = ({ children, bg = C.green, color = "#04110a", delay = 0, top, size = 44, mono }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <PopIn delay={delay}><div style={{ background: bg, color, fontFamily: mono ? MONO : INTER, fontWeight: 900, fontSize: size, padding: "12px 28px", borderRadius: 14, boxShadow: `0 0 30px ${bg}55` }}>{children}</div></PopIn>
  </div>
);

/* ---------- scenes ---------- */
const S = {
  hook: () => (
    <Term>
      <Status text="AI SITE BUILDER · generating…" />
      <Shop mode="build" buildDur={f(2.4)} />
    </Term>
  ),
  perfect: () => (
    <Term>
      <Status text="PREVIEW · looks perfect" />
      <Shop mode="ok" />
    </Term>
  ),
  fail: () => {
    const failAt = f(2.0);
    const frame = useCurrentFrame();
    return (
      <Glitch at={failAt} dur={8}>
        <Term glow={frame >= failAt ? "rgba(239,68,68,0.25)" : undefined}>
          <Status text={frame >= failAt ? "ERROR · checkout failed" : "TESTING · click checkout"} color={frame >= failAt ? C.red : C.green} />
          <Shop mode="fail" clickAt={f(0.75)} failAt={failAt} />
          <Cursor path={[[0, 900, 1000], [f(0.6), 540, 760], [f(1.6), 545, 765]]} clicks={[f(0.75), f(1.3)]} color="#111" />
          {frame >= f(0.9) && frame < failAt && <Chip top={TOP + 560} bg="#374151" color="#fff" mono size={32}>button not responding…</Chip>}
        </Term>
      </Glitch>
    );
  },
  interesting: () => (
    <AbsoluteFill>
      <Aroll data={D} src="r/r6f_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={860} zoom={1.3} alternate={false} offset={f(7.4)} />
      <Flash dur={5} />
      <div style={{ position: "absolute", top: 1320, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn delay={f(0.6)}><div style={{ background: C.green, color: "#04110a", fontFamily: MONO, fontWeight: 900, fontSize: 56, padding: "14px 30px", borderRadius: 14, letterSpacing: 2 }}>&gt; NEW AI TOOL_</div></PopIn>
      </div>
    </AbsoluteFill>
  ),
  intro: () => {
    const frame = useCurrentFrame();
    const z = 1 + interpolate(frame, [0, 150], [0, 0.06]);
    return (
      <Term>
        <div style={{ position: "absolute", left: 50, right: 50, top: TOP, height: 600, borderRadius: 24, overflow: "hidden", boxShadow: `0 0 0 4px ${C.green}, 0 30px 80px rgba(0,0,0,0.6)` }}>
          <Img src={staticFile("img/mo_home.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%", transform: `scale(${z})` }} />
        </div>
        <div style={{ position: "absolute", right: 60, top: TOP + 612, fontFamily: INTER, fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{MOMENTIC}</div>
        <Chip top={TOP + 660} delay={f(0.4)} bg={C.white} color={C.ink}>🤖 Mo · by Momentic</Chip>
        <Chip top={TOP + 760} delay={f(2.6)} bg={C.red} color="#fff" size={40}>🐞 tests apps for bugs</Chip>
      </Term>
    );
  },
  imagine: () => (
    <Term>
      <Status text="YOUR COMPANY'S STORE" />
      <Shop mode="plain" />
    </Term>
  ),
  tell: () => (
    <Term>
      <Status text="MO · new session" />
      <div style={{ position: "absolute", left: 50, right: 50, top: TOP + 10, background: C.panel, borderRadius: 24, border: `3px solid ${C.green}`, padding: 34, boxShadow: `0 0 60px rgba(34,197,94,0.25)` }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 28, color: C.mute }}>target: shopnova.store</div>
        <div style={{ marginTop: 22, fontFamily: MONO, fontWeight: 800, fontSize: 46, color: C.white, lineHeight: 1.35, minHeight: 330 }}>
          <span style={{ color: C.green }}>&gt; </span>
          <Typewriter text="Test the checkout process and find anything that doesn't work." delay={f(0.9)} cps={24} caretColor={C.green} />
        </div>
        <PopIn delay={f(3.3)}><div style={{ marginTop: 10, fontFamily: MONO, fontWeight: 800, fontSize: 30, color: C.lime }}>✓ brief received · planning test cases…</div></PopIn>
      </div>
    </Term>
  ),
  explore: () => {
    const frame = useCurrentFrame();
    const tags = [["guest checkout", 0.3], ["coupon code", 0.9], ["empty cart", 1.5], ["mobile view", 2.1], ["bad card", 2.7]] as const;
    return (
      <Term>
        <Status text="MO · 5 agents running in parallel" />
        <Shop mode="plain" scale={0.95} />
        {[[260, 520, 0], [700, 640, 7], [420, 860, 14]].map(([x, y, d], i) => {
          const dx = Math.sin((frame + d) / 9) * 70, dy = Math.cos((frame + d) / 11) * 50;
          return <div key={i} style={{ position: "absolute", left: x + dx, top: y + dy, fontSize: 54, filter: `drop-shadow(0 0 10px ${C.green})` }}>🖱</div>;
        })}
        <div style={{ position: "absolute", left: 40, right: 40, top: TOP + 600, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
          {tags.map(([t, s]) => <PopIn key={t} delay={f(s)}><div style={{ background: C.panel, border: `2px solid ${C.green}`, color: C.green, fontFamily: MONO, fontWeight: 800, fontSize: 30, padding: "8px 18px", borderRadius: 12 }}>▶ {t}</div></PopIn>)}
        </div>
        {frame >= f(3.3) && <Chip top={TOP + 760} bg={C.red} color="#fff" mono size={36}>🐞 2 problems found</Chip>}
      </Term>
    );
  },
  broken: () => (
    <AbsoluteFill>
      <Aroll data={D} src="r/r6f_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={860} zoom={1.15} alternate={false} offset={f(27.75)} />
      <div style={{ position: "absolute", top: 1240, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn delay={f(1.4)} from="up">
          <div style={{ position: "relative", background: "#fff", borderRadius: 20, padding: "22px 34px", fontFamily: INTER, fontWeight: 800, fontSize: 46, color: C.ink, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
            ❌ "Something is broken."
            <div style={{ position: "absolute", left: 20, right: 20, top: "50%", height: 9, background: C.red, borderRadius: 5, transform: `rotate(-3deg) scaleX(${interpolate(useCurrentFrame(), [f(2.6), f(2.9)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`, transformOrigin: "0 50%" }} />
          </div>
        </PopIn>
      </div>
    </AbsoluteFill>
  ),
  report: () => (
    <Term>
      <div style={{ position: "absolute", left: 0, right: 0, top: TOP - 20, height: 580, overflow: "hidden", boxShadow: `0 0 0 4px ${C.green}` }}>
        <OffthreadVideo src={staticFile("b/mo_hero.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.55)", transformOrigin: "30% 30%" }} />
      </div>
      <div style={{ position: "absolute", right: 20, top: TOP + 566, fontFamily: INTER, fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Real Mo bug report · {MOMENTIC}</div>
      <div style={{ position: "absolute", left: 30, right: 30, top: TOP + 610, display: "flex", justifyContent: "center", gap: 14 }}>
        {[["📸 screenshots", 0.6], ["🎥 recordings", 1.45], ["🪜 repro steps", 2.15]].map(([t, d]) => (
          <PopIn key={t as string} delay={f(d as number)} from="up"><div style={{ background: C.white, color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 38, padding: "12px 20px", borderRadius: 14 }}>{t as string}</div></PopIn>
        ))}
      </div>
    </Term>
  ),
  question: () => (
    <AbsoluteFill>
      <Aroll data={D} src="r/r6f_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={860} zoom={1.2} alternate={false} offset={f(35.2)} />
      <div style={{ position: "absolute", top: 1230, left: 60, right: 60 }}>
        <PopIn delay={4} from="up">
          <div style={{ background: C.panel, border: `4px solid ${C.green}`, borderRadius: 26, padding: "26px 30px", fontFamily: INTER, fontWeight: 900, fontSize: 54, color: "#fff", textAlign: "center", lineHeight: 1.15 }}>
            Would you trust <span style={{ color: C.green }}>AI</span> to test your site before launch?
          </div>
        </PopIn>
      </div>
    </AbsoluteFill>
  ),
  vote: () => {
    const frame = useCurrentFrame();
    const pick = frame >= f(0.35);
    return (
      <Term>
        <div style={{ position: "absolute", left: 60, right: 60, top: TOP + 20, display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 34, color: C.mute, textAlign: "center" }}>💬 COMMENT ONE WORD</div>
          {[["🤖 AI", C.green, 0], ["🧑 HUMAN", C.amber, 6]].map(([t, c, d]) => (
            <PopIn key={t as string} delay={d as number} from="left">
              <div style={{ background: C.panel, border: `4px solid ${c}`, borderRadius: 24, padding: "26px 36px", fontFamily: INTER, fontWeight: 900, fontSize: 80, color: c as string, boxShadow: pick ? `0 0 40px ${c}55` : undefined }}>{t as string}</div>
            </PopIn>
          ))}
        </div>
      </Term>
    );
  },
  subscribe: () => (
    <Term>
      <div style={{ position: "absolute", top: TOP + 10, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn from="up"><SubscribeCard clickAt={f(1.4)} dark accent={C.red} sub="AI tools tested on real problems" avatarSrc="img/ch_BEp74aewRSA.jpg" /></PopIn>
      </div>
      <Cursor path={[[0, 900, 1250], [f(1.1), 560, 850], [f(1.9), 580, 860]]} clicks={[f(1.4)]} color="#fff" />
      <Chip top={TOP + 560} delay={f(3.6)} bg={C.panel} color={C.green} mono size={34}>✓ what actually works</Chip>
    </Term>
  ),
};

type Scene = { a: number; b: number; body: React.FC; face?: boolean };
const SCENES: Scene[] = [
  { a: 0.0, b: 3.0, body: S.hook, face: true },
  { a: 3.0, b: 4.35, body: S.perfect, face: true },
  { a: 4.35, b: 7.4, body: S.fail, face: true },
  { a: 7.4, b: 10.75, body: S.interesting },
  { a: 10.75, b: 15.8, body: S.intro, face: true },
  { a: 15.8, b: 19.95, body: S.imagine, face: true },
  { a: 19.95, b: 23.9, body: S.tell, face: true },
  { a: 23.9, b: 27.75, body: S.explore, face: true },
  { a: 27.75, b: 31.25, body: S.broken },
  { a: 31.25, b: 35.2, body: S.report, face: true },
  { a: 35.2, b: 38.3, body: S.question },
  { a: 38.3, b: 39.7, body: S.vote, face: true },
  { a: 39.7, b: END, body: S.subscribe, face: true },
];

/* captions: mono, boxed terminal style; full-face scenes get them lower */
const chunks = chunkWords(D.words, 3, 18);
const FULL = SCENES.filter((s) => !s.face);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const full = FULL.some((s) => t >= s.a && t < s.b);
  return (
    <div style={{ position: "absolute", top: full ? 180 : 130, left: 40, right: 40, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 16px", background: "rgba(0,0,0,0.75)", border: `2px solid ${C.green}`, borderRadius: 14, padding: "6px 22px" }}>
        {c.words.map((w, i) => {
          const on = t >= w.s - 0.03;
          const hot = /^(Mo|Momentic|bugs|broken|checkout|fails|AI|human|recordings|screenshots)/i.test(w.w);
          return (
            <span key={i} style={{ fontFamily: MONO, fontWeight: 800, fontSize: 64, textTransform: "uppercase", color: on ? (hot ? (/broken|fails|bugs/i.test(w.w) ? C.red : C.green) : "#fff") : "rgba(255,255,255,0.35)" }}>
              {w.w.replace(/[,.?]$/, "")}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const Reel6: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "typing", 0.35], [0.5, "pop", 0.3], [1.0, "pop", 0.3], [1.5, "pop", 0.3], [2.0, "pop", 0.3], [3.0, "swish", 0.3], [3.15, "ding", 0.25],
    [5.1, "click", 0.6], [5.65, "click", 0.6], [6.35, "glitch", 0.5], [6.4, "impact", 0.4], [7.4, "impact", 0.45], [8.0, "blip", 0.4],
    [10.75, "whoosh", 0.3], [11.15, "pop"], [13.35, "pop"], [15.8, "swish", 0.3], [19.95, "whoosh", 0.3], [20.85, "typing", 0.4], [23.25, "ding", 0.25],
    [23.9, "whoosh", 0.3], [24.2, "blip", 0.3], [24.8, "blip", 0.3], [25.4, "blip", 0.3], [26.0, "blip", 0.3], [26.6, "blip", 0.3], [27.2, "glitch", 0.35],
    [29.15, "pop"], [30.35, "swish", 0.4], [31.25, "whoosh", 0.3], [31.85, "shutter", 0.4], [32.7, "pop"], [33.4, "pop"],
    [35.2, "riser", 0.3], [38.3, "pop"], [38.5, "pop"], [39.7, "whoosh", 0.3], [41.1, "click", 0.6], [41.16, "notify", 0.35], [43.3, "ding", 0.25],
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
                <Aroll data={D} src="r/r6f_aroll.mp4" box={{ x: 0, y: FACE_Y, w: 1080, h: 1920 - FACE_Y }} focusY={740} zoom={1.0} offset={from} />
                <div style={{ position: "absolute", left: 0, right: 0, top: FACE_Y - 3, height: 6, background: C.green, boxShadow: `0 0 20px ${C.green}` }} />
              </>
            )}
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("r/r6f_aroll.mp4")} />
      <Music src="r/r6_music.wav" total={END} base={0.12} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

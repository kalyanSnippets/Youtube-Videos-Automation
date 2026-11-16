import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo } from "remotion";
import data from "../public/r/r10f_words.json";
import face from "../public/r/r10f_face.json";
import { f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, Flash, chunkWords, Typewriter, Cursor } from "./lib";
import { K, ease, clamp, Split, ItemHeader, Banner, Chip, Captions, CommentPanel, Follow, FaceTrack, Float3D, Screen3D } from "./split";

/* Reel 10: "5 Claude Code skills to try before you blame the AI".
   Each skill gets one split-screen panel that shows what the skill does, in the order Kalyan says it.
   Hook, bridges and the closing line stay full-face. Times are seconds on the final cut (r10f_aroll). */
const D = data as unknown as ReelData;
const FT = face as FaceTrack;
const VID = "r/r10f_aroll.mp4";
const END = D.duration + 0.6;
export const R10_FRAMES = Math.ceil(END * FPS);

/* frames since the panel started, for an event at absolute time `abs` in a panel that starts at `a` */
const L = (abs: number, a: number) => f(abs) - f(a);

const IMAG = "b/r10_designed.mp4", STAT = "b/r10_static.mp4", DSGN = "b/r10_designed.mp4";
const Label: React.FC<{ children: React.ReactNode; bg: string; size?: number }> = ({ children, bg, size = 40 }) => (
  <div style={{ background: bg, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: size, padding: "6px 22px", borderRadius: 12, boxShadow: "0 10px 26px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{children}</div>
);
const Term: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; size?: number }> = ({ children, style, size = 34 }) => (
  <div style={{ background: "#0B0D10", border: `2px solid ${K.line}`, borderRadius: 22, padding: "22px 28px", fontFamily: MONO, fontSize: size, color: "#E5E7EB", boxShadow: "0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset", ...style }}>
    <div style={{ color: K.orange, fontWeight: 800 }}>✻ Claude Code</div>
    {children}
  </div>
);

/* 0.0 hook: the awesome page you imagined, then the normal generic page you got.
   Both are real pages built for this reel with free stock media (demo/ASSETS.md) and recorded in a browser. */
const HookPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const got = L(2.83, 0);
  const k = interpolate(frame, [got, got + 10], [0, 1], { ...clamp, easing: ease });
  const push = interpolate(frame, [0, got], [0.93, 1.0], clamp);
  const slam = interpolate(frame, [got, got + 8], [2.4, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const shake = frame >= got + 8 && frame < got + 16 ? Math.sin(frame * 2.4) * 8 : 0;
  return (
    <>
      <div style={{ position: "absolute", left: 90 - k * 60, top: 170 - k * 30, transform: `scale(${push * (1 - k * 0.45)})`, transformOrigin: "0 0", filter: `brightness(${1 - k * 0.35})` }}>
        <Screen3D src={IMAG} w={900} url="aura-headphones.com" rotY={-10 - k * 10} rotX={5} glow={K.violet} dark />
      </div>
      <PopIn delay={8} style={{ position: "absolute", left: interpolate(k, [0, 1], [300, 40]), top: interpolate(k, [0, 1], [800, 505]) }}><Label bg={K.violet} size={interpolate(k, [0, 1], [44, 32])}>What you imagined ✨</Label></PopIn>
      {frame >= got && (
        <>
          <div style={{ position: "absolute", left: 400 + shake, top: 300, transform: `scale(${slam})`, opacity: interpolate(frame, [got, got + 5], [0, 1], clamp) }}>
            <Screen3D src={STAT} w={640} url="localhost:3000" at={got} rotY={9} rotX={3} sway={2} glow={K.red} />
          </div>
          <PopIn delay={got + 9} style={{ position: "absolute", left: 560, top: 790 }}><Label bg={K.red} size={44}>What you got 😬</Label></PopIn>
        </>
      )}
    </>
  );
};

/* 11.57 find-skills: describe what you're building, it suggests skills */
const FindPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 11.57;
  const rows: [string, string][] = [["frontend-design", K.pink], ["agent-browser", K.green], ["brainstorming", K.violet]];
  return (
    <>
      <ItemHeader n={1} of={5} kind="SKILL" name="find-skills" color={K.blue} nameAt={L(12.69, a)} />
      <Float3D delay={L(13.46, a)} spin={-70} sway={4} tilt={7} style={{ position: "absolute", left: 50, top: 370, width: 640 }}>
        <Term style={{ height: 490 }}>
          <div style={{ marginTop: 14, color: K.blue }}>&gt; /find-skills</div>
          <div style={{ marginTop: 10, color: "#fff", lineHeight: 1.35 }}>{frame >= L(15.84, a) ? <Typewriter text="I'm building a landing page for wireless headphones" delay={L(15.84, a)} cps={30} caret={frame < L(17.6, a)} /> : <span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0 }}>▍</span>}</div>
          {frame >= L(17.48, a) && <div style={{ marginTop: 20, color: K.mute, fontSize: 28 }}>🔎 searching skills… 3 matches</div>}
        </Term>
      </Float3D>
      {rows.map(([r, c], i) => (
        <Float3D key={r} delay={L(17.74, a) + i * 7} spin={100} sway={7} tilt={-10} style={{ position: "absolute", left: 640 - i * 16, top: 420 + i * 140 }}>
          <div style={{ background: K.panel, border: `4px solid ${c}`, borderRadius: 18, padding: "16px 22px", width: 400, boxShadow: `0 20px 50px ${c}55` }}>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 22, color: c, letterSpacing: 2 }}>SKILL MATCH</div>
            <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 36, color: "#fff" }}>{r}</div>
          </div>
        </Float3D>
      ))}
    </>
  );
};

/* 20.23 frontend-design: the real static page flips into a real designed page (both built for this reel and recorded) */
const FrontendPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 20.23;
  const sw = L(25.97, a);
  const k = interpolate(frame, [sw, sw + 14], [0, 1], { ...clamp, easing: ease });
  const chips: [string, number, string, number, number][] = [["📐 Layouts", 27.63, K.blue, 20, 380], ["🎨 Colors", 28.07, K.pink, 800, 470], ["🔤 Typography", 28.57, K.yellow, 690, 800]];
  const w = 640 + k * 120;
  return (
    <>
      <ItemHeader n={2} of={5} kind="SKILL" name="frontend-design" color={K.pink} nameAt={L(21.33, a)} />
      {frame >= L(22.25, a) && (
        <div style={{ position: "absolute", left: 60 + k * 100, top: 365 - k * 5, perspective: 1600 }}>
          <div style={{ transformStyle: "preserve-3d", transform: `rotateY(${k * 180}deg) scale(${interpolate(frame - L(22.25, a), [0, 8], [0.7, 1], clamp)})`, width: w }}>
            <div style={{ backfaceVisibility: "hidden" }}><Screen3D src={STAT} w={w} url="localhost:3000" at={L(22.25, a) + 12} rotY={k ? 0 : 8} sway={k ? 0 : 3} glow="#6B7280" /></div>
            <div style={{ position: "absolute", left: 0, top: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}><Screen3D src={DSGN} w={w} url="localhost:3000" at={sw - 4} rotY={k < 1 ? 0 : -6} sway={k < 1 ? 0 : 4} glow={K.pink} dark /></div>
          </div>
        </div>
      )}
      {frame >= L(22.83, a) && frame < sw && <Float3D delay={L(22.83, a)} style={{ position: "absolute", left: 740, top: 470 }}><Chip bg="#E5E7EB" size={48}>😴 boring</Chip></Float3D>}
      {frame >= L(23.33, a) && frame < sw && <Float3D delay={L(23.33, a)} spin={-80} style={{ position: "absolute", left: 715, top: 590 }}><Chip bg="#E5E7EB" size={42}>basic-looking</Chip></Float3D>}
      {chips.map(([t, at, c, x, y], i) => <Float3D key={t} delay={L(at, a)} spin={i % 2 ? -110 : 110} sway={8} style={{ position: "absolute", left: x, top: y, zIndex: 5 }}><Chip bg={c} size={40}>{t}</Chip></Float3D>)}
    </>
  );
};

/* 29.43 agent-browser: the agent opens the page, clicks around and checks it */
const BrowserPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 29.43;
  const open = L(34.73, a);
  const log: [string, number, string][] = [["$ agent-browser open localhost:3000", 34.73, "#E5E7EB"], ["$ agent-browser click @e3", 35.61, "#E5E7EB"], ["$ agent-browser click @e7", 35.93, "#E5E7EB"], ["✓ page loads", 36.49, K.green], ["✓ buttons work", 37.01, K.green], ["✓ no errors", 37.43, K.green]];
  return (
    <>
      <ItemHeader n={3} of={5} kind="SKILL" name="agent-browser" color={K.green} nameAt={L(30.92, a)} />
      <Float3D delay={L(33.31, a)} spin={-60} sway={0} style={{ position: "absolute", left: 40, top: 370 }}>
        <Screen3D src={DSGN} w={540} url="localhost:3000" at={open} startFrom={75} rotY={10} sway={3} glow={K.green} dark>
          {frame < open + 8 && <div style={{ position: "absolute", left: 0, right: 0, top: 33, bottom: 0, background: "#0B0D10", opacity: interpolate(frame, [open, open + 8], [1, 0], clamp) }} />}
        </Screen3D>
        {frame >= open + 8 && <Cursor path={[[open + 8, 470, 340], [L(35.61, a), 110, 255], [L(35.93, a), 455, 50], [L(36.6, a), 300, 200]]} clicks={[L(35.61, a), L(35.93, a)]} color="#fff" size={70} />}
      </Float3D>
      <Float3D delay={L(33.53, a)} spin={70} sway={4} tilt={-8} style={{ position: "absolute", left: 575, top: 400, width: 480 }}>
        <Term size={25} style={{ padding: "18px 18px", height: 440 }}>
          {log.map(([t, at, c]) => frame >= L(at, a) && <PopIn key={t} delay={L(at, a)} from="left" dist={30} style={{ marginTop: 14, color: c, fontWeight: c === K.green ? 800 : 500, fontSize: c === K.green ? 32 : 20, whiteSpace: "nowrap" }}>{t}</PopIn>)}
        </Term>
      </Float3D>
    </>
  );
};

/* 39.9 brainstorming: idea, then plan, then code, as three cards stepping back in depth */
const BrainstormPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 39.9;
  const steps: [string, string, number, string, string[]][] = [
    ["💡", "IDEA", 41.41, K.yellow, ["headphones", "landing page"]],
    ["📋", "PLAN", 42.65, K.violet, ["✓ 3D hero", "✓ features", "✓ pre-order CTA"]],
    ["⌨️", "CODE", 44.09, K.green, ["only after", "the plan"]],
  ];
  return (
    <>
      <ItemHeader n={4} of={5} kind="SKILL" name="brainstorming" color={K.violet} nameAt={L(39.99, a)} />
      {steps.map(([ic, t, at, c, lines], i) => (
        <React.Fragment key={t}>
          {i > 0 && frame >= L(at, a) && <div style={{ position: "absolute", left: 322 + (i - 1) * 345, top: 560, width: interpolate(frame - L(at, a), [0, 8], [0, 62], clamp), height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${steps[i - 1][3]}, ${c})`, boxShadow: `0 0 20px ${c}` }} />}
          <Float3D delay={L(at, a)} spin={i % 2 ? -100 : 100} sway={7} tilt={(1 - i) * 12} style={{ position: "absolute", left: 40 + i * 345, top: 390 }}>
            <div style={{ width: 290, height: 400, background: `linear-gradient(160deg, ${K.panel}, #0B0D10)`, border: `4px solid ${c}`, borderRadius: 26, padding: "22px 16px", textAlign: "center", boxShadow: `0 30px 60px rgba(0,0,0,0.55), 0 0 50px ${c}44` }}>
              <div style={{ fontSize: 100, lineHeight: 1.1, transform: `translateY(${Math.sin(frame / 10 + i) * 6}px)` }}>{ic}</div>
              <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 54, color: c }}>{t}</div>
              {lines.map((l) => <div key={l} style={{ fontFamily: INTER, fontWeight: 700, fontSize: 30, color: "#E5E7EB", marginTop: 8 }}>{l}</div>)}
            </div>
          </Float3D>
        </React.Fragment>
      ))}
    </>
  );
};

/* 44.83 grill-me: it asks instead of guessing */
const GrillPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 44.83;
  const qs: [string, number][] = [["Who is buying these headphones?", 47.83], ["What's the #1 action on the page?", 48.25], ["Premium or budget feel?", 48.79]];
  const clear = L(49.93, a);
  const guessing = frame >= L(46.69, a) && frame < L(47.67, a);
  return (
    <>
      <ItemHeader n={5} of={5} kind="SKILL" name="grill-me" color={K.orange} nameAt={L(45.65, a)} />
      {guessing && <Float3D delay={L(46.69, a)} style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", justifyContent: "center" }}><div style={{ position: "relative" }}><Chip bg="#E5E7EB" size={64}>🎲 guessing</Chip><div style={{ position: "absolute", left: -10, right: -10, top: "50%", height: 10, background: K.red, transform: `rotate(-6deg) scaleX(${interpolate(frame - L(46.99, a), [0, 6], [0, 1], clamp)})`, transformOrigin: "0 50%" }} /></div></Float3D>}
      {qs.map(([q, at], i) => (
        <Float3D key={q} delay={L(at, a)} spin={-90} sway={5} tilt={6 - i * 6} style={{ position: "absolute", left: 50 + i * 40, top: 370 + i * 120 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 74, height: 74, borderRadius: 37, background: K.orange, color: K.ink, fontFamily: INTER, fontWeight: 900, fontSize: 42, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${K.orange}` }}>✻</div>
            <div style={{ background: "#fff", color: K.ink, fontFamily: INTER, fontWeight: 800, fontSize: 40, padding: "14px 26px", borderRadius: "8px 28px 28px 28px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{q}</div>
          </div>
        </Float3D>
      ))}
      {frame >= L(49.27, a) && (
        <PopIn delay={L(49.27, a)} from="up" style={{ position: "absolute", left: 60, right: 60, top: 760 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, fontFamily: INTER, fontWeight: 900, fontSize: 48 }}>
            <span style={{ color: "#fff" }}>Requirements:</span>
            <span style={{ color: K.mute, filter: "blur(3px)", textDecoration: frame >= clear ? "line-through" : "none" }}>vague</span>
            {frame >= clear && <><span style={{ color: "#fff" }}>→</span><PopIn delay={clear}><Chip bg={K.green} size={48}>CLEAR ✓</Chip></PopIn></>}
          </div>
        </PopIn>
      )}
    </>
  );
};

/* 8.47 five chips stack up above the head while he says "try these five skills" */
const FiveChips: React.FC = () => {
  const names: [string, string][] = [["find-skills", K.blue], ["frontend-design", K.pink], ["agent-browser", K.green], ["brainstorming", K.violet], ["grill-me", K.orange]];
  return (
    <>
      <Banner text="TRY THESE 5 SKILLS" top={250} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 390, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
        {names.map(([n, c], i) => <PopIn key={n} delay={14 + i * 7}><div style={{ background: "rgba(14,17,22,0.88)", border: `3px solid ${c}`, color: c, fontFamily: MONO, fontWeight: 800, fontSize: 36, padding: "8px 18px", borderRadius: 12 }}>{n}</div></PopIn>)}
      </div>
    </>
  );
};

type Seg = { a: number; b: number; split?: React.FC; accent?: string; over?: React.ReactNode };
const SEGS: Seg[] = [
  { a: 0, b: 4.9, split: HookPanel, accent: K.violet },
  { a: 8.47, b: 11.57, over: <FiveChips /> },
  { a: 11.57, b: 19.17, split: FindPanel, accent: K.blue },
  { a: 20.23, b: 29.43, split: FrontendPanel, accent: K.pink },
  { a: 29.43, b: 37.9, split: BrowserPanel, accent: K.green },
  { a: 38.59, b: 39.9, over: <Banner text="⭐ MY 2 FAVOURITES" color={K.yellow} /> },
  { a: 39.9, b: 44.83, split: BrainstormPanel, accent: K.violet },
  { a: 44.83, b: 50.77, split: GrillPanel, accent: K.orange },
  { a: 54.41, b: 56.33, over: <Banner text="RIGHT SKILLS > SMARTER AI" size={62} /> },
  { a: 56.33, b: 58.93, split: () => <CommentPanel word="SKILLS" title="💬 Comment to get all 5" typeAt={L(56.9, 56.33)} sentAt={L(57.7, 56.33)} replyAt={L(58.36, 56.33)} reply="📩 aiwithkalyan: sent you all 5 links!" />, accent: K.yellow },
  { a: 59.48, b: END, over: <Follow /> },
];
const isSplit = (t: number) => SEGS.some((s) => s.split && t >= s.a && t < s.b);
const chunks = chunkWords(D.words, 3, 16);

export const Reel10: React.FC = () => {
  /* one small sound family, each tied to something that appears: swish = panel in, pop = item in, click = cursor / key, ding = result */
  const sfx: [number, string, number?][] = [
    [0.0, "swish", 0.3], [2.83, "impact", 0.4], [8.47, "swish", 0.28],
    [11.57, "swish", 0.28], [12.69, "pop", 0.3], [15.84, "typing", 0.25], [17.74, "ding", 0.25],
    [20.23, "swish", 0.28], [21.33, "pop", 0.3], [25.97, "whoosh", 0.3], [28.57, "ding", 0.22],
    [29.43, "swish", 0.28], [30.92, "pop", 0.3], [35.61, "click", 0.45], [35.93, "click", 0.45], [37.43, "ding", 0.25],
    [38.59, "swish", 0.28], [39.9, "swish", 0.28], [42.11, "pop", 0.3], [42.65, "pop", 0.3], [44.09, "pop", 0.3],
    [44.83, "swish", 0.28], [45.65, "pop", 0.3], [47.83, "pop", 0.28], [49.93, "ding", 0.28],
    [54.41, "swish", 0.28], [56.33, "swish", 0.28], [56.9, "typing", 0.25], [57.7, "pop", 0.3], [58.36, "notify", 0.3], [60.2, "click", 0.45],
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
      <Music src="r/r10_music.wav" total={END} base={0.07} boosts={[[38.0, 39.8, 0.11], [59.0, END, 0.12]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.3} />)}
    </AbsoluteFill>
  );
};

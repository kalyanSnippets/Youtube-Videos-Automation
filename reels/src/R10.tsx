import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo } from "remotion";
import data from "../public/r/r10f_words.json";
import face from "../public/r/r10f_face.json";
import { f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, Flash, chunkWords, Typewriter, Cursor } from "./lib";
import { K, ease, clamp, Split, ItemHeader, Banner, Chip, Captions, SiteMock, CommentPanel, Follow, FaceTrack } from "./split";

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

const Card: React.FC<{ label: string; labelBg: string; labelColor?: string; children: React.ReactNode; rot?: number }> = ({ label, labelBg, labelColor = "#fff", children, rot = 0 }) => (
  <div style={{ transform: `rotate(${rot}deg)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <div style={{ boxShadow: "0 30px 60px rgba(0,0,0,0.6)", borderRadius: 18 }}>{children}</div>
    <div style={{ background: labelBg, color: labelColor, fontFamily: INTER, fontWeight: 900, fontSize: 40, padding: "6px 22px", borderRadius: 12 }}>{label}</div>
  </div>
);

/* 0.0 hook: what you imagined vs what you got */
const HookPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const got = L(2.83, 0);
  const drop = interpolate(frame - got, [0, 9], [-700, 0], { ...clamp, easing: ease });
  const shake = frame >= got + 9 && frame < got + 17 ? Math.sin(frame * 2.4) * 7 : 0;
  return (
    <>
      <PopIn delay={6} style={{ position: "absolute", left: 60, top: 250 }}><Card label="What you imagined ✨" labelBg={K.violet} rot={-3}><SiteMock variant="nice" w={440} /></Card></PopIn>
      {frame >= got && (
        <div style={{ position: "absolute", left: 560, top: 330 + drop, transform: `translateX(${shake}px)` }}>
          <Card label="What you got 😬" labelBg={K.red} rot={3}><SiteMock variant="ugly" w={440} /></Card>
        </div>
      )}
      {frame >= L(3.47, 0) && <PopIn style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center" }}><Chip bg="#fff">Built with Claude Code… 🤔</Chip></PopIn>}
    </>
  );
};

/* 11.57 find-skills */
const FindPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 11.57;
  const rows = ["frontend-design", "agent-browser", "brainstorming"];
  return (
    <>
      <ItemHeader n={1} of={5} kind="SKILL" name="find-skills" color={K.blue} nameAt={L(12.69, a)} />
      {frame >= L(13.46, a) && (
        <PopIn from="up" style={{ position: "absolute", left: 60, right: 60, top: 370 }}>
          <div style={{ background: "#0B0D10", border: `2px solid ${K.line}`, borderRadius: 22, padding: "26px 30px", fontFamily: MONO, fontSize: 36, color: "#E5E7EB", height: 490, boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
            <div style={{ color: K.orange, fontWeight: 800 }}>✻ Claude Code</div>
            <div style={{ marginTop: 16, color: K.mute }}>&gt; <span style={{ color: "#fff" }}>{frame >= L(15.84, a) ? <Typewriter text="I want to build a landing page" delay={L(15.84, a)} cps={22} caret={frame < L(17.48, a)} /> : <span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0 }}>▍</span>}</span></div>
            {frame >= L(17.48, a) && <div style={{ marginTop: 22, color: K.blue, fontWeight: 700, fontSize: 30 }}>🔎 relevant skills found:</div>}
            {rows.map((r, i) => frame >= L(17.74, a) + i * 8 && (
              <PopIn key={r} delay={L(17.74, a) + i * 8} from="left" style={{ marginTop: 12 }}><span style={{ color: K.green, fontWeight: 800 }}>✓ </span>{r}</PopIn>
            ))}
          </div>
        </PopIn>
      )}
    </>
  );
};

/* 20.23 frontend-design: boring site, then the designed one */
const FrontendPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 20.23;
  const sw = L(25.97, a);
  const k = interpolate(frame, [sw, sw + 12], [0, 1], { ...clamp, easing: ease });
  const chips: [string, number, string][] = [["📐 Layouts", 27.63, K.blue], ["🎨 Colors", 28.07, K.pink], ["🔤 Typography", 28.57, K.yellow]];
  return (
    <>
      <ItemHeader n={2} of={5} kind="SKILL" name="frontend-design" color={K.pink} nameAt={L(21.33, a)} />
      {frame >= L(22.25, a) && (
        <div style={{ position: "absolute", left: 60 + k * 0, top: 370, transform: `perspective(1400px) rotateY(${k * 180}deg)`, transformStyle: "preserve-3d" }}>
          <div style={{ backfaceVisibility: "hidden" }}><PopIn><SiteMock variant="ugly" w={600} /></PopIn></div>
          <div style={{ position: "absolute", left: 0, top: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", boxShadow: "0 30px 70px rgba(124,58,237,0.5)", borderRadius: 26 }}><SiteMock variant="nice" w={600} /></div>
        </div>
      )}
      {frame >= L(22.83, a) && frame < sw && <PopIn style={{ position: "absolute", left: 700, top: 520 }}><Chip bg="#E5E7EB">😴 boring</Chip></PopIn>}
      {frame >= L(23.33, a) && frame < sw && <PopIn style={{ position: "absolute", left: 700, top: 620 }}><Chip bg="#E5E7EB">basic</Chip></PopIn>}
      {chips.map(([t, at, c], i) => frame >= L(at, a) && <PopIn key={t} delay={L(at, a)} from="right" style={{ position: "absolute", left: 690, top: 420 + i * 110 }}><Chip bg={c} size={40}>{t}</Chip></PopIn>)}
    </>
  );
};

/* 29.43 agent-browser: the agent opens the site, clicks around, checks it works */
const BrowserPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 29.43;
  const open = L(34.73, a);
  const checks: [string, number][] = [["page loads", 36.49], ["buttons work", 37.01], ["no errors", 37.43]];
  return (
    <>
      <ItemHeader n={3} of={5} kind="SKILL" name="agent-browser" color={K.green} nameAt={L(30.92, a)} />
      {frame >= L(33.31, a) && (
        <PopIn from="up" style={{ position: "absolute", left: 60, top: 370 }}>
          <div style={{ width: 620, height: 500, background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
            <div style={{ height: 62, background: "#E5E7EB", display: "flex", alignItems: "center", gap: 10, padding: "0 18px" }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
              <div style={{ flex: 1, marginLeft: 10, background: "#fff", borderRadius: 99, fontFamily: MONO, fontSize: 22, color: "#374151", padding: "6px 18px" }}>{frame >= open ? <Typewriter text="localhost:3000" delay={open} cps={30} caret={false} /> : ""}</div>
            </div>
            <div style={{ padding: 22, opacity: interpolate(frame, [open + 12, open + 18], [0, 1], clamp) }}><SiteMock variant="nice" w={576} /></div>
          </div>
          {frame >= open + 16 && <Cursor path={[[open + 16, 560, 420], [L(35.61, a), 500, 120], [L(35.93, a), 300, 330], [L(36.4, a), 120, 250]]} clicks={[L(35.61, a), L(35.93, a)]} color="#111" size={70} />}
        </PopIn>
      )}
      {frame >= L(33.53, a) && frame < L(36.3, a) && <PopIn style={{ position: "absolute", left: 720, top: 470 }}><div style={{ fontSize: 150 }}>🤖</div></PopIn>}
      {checks.map(([t, at], i) => frame >= L(at, a) && <PopIn key={t} delay={L(at, a)} from="right" style={{ position: "absolute", left: 710, top: 440 + i * 110 }}><Chip bg={K.green} size={36}>✓ {t}</Chip></PopIn>)}
    </>
  );
};

/* 39.9 brainstorming: idea, then plan, then code */
const BrainstormPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 39.9;
  const steps: [string, string, number, string, string[]][] = [
    ["💡", "IDEA", 42.11, K.yellow, ["what you want"]],
    ["📋", "PLAN", 42.65, K.violet, ["✓ goals", "✓ steps", "✓ edge cases"]],
    ["⌨️", "CODE", 44.09, K.green, ["only after", "the plan"]],
  ];
  return (
    <>
      <ItemHeader n={4} of={5} kind="SKILL" name="brainstorming" color={K.violet} nameAt={L(39.99, a)} />
      <div style={{ position: "absolute", left: 50, right: 50, top: 400, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {steps.map(([ic, t, at, c, lines], i) => (
          <React.Fragment key={t}>
            {i > 0 && <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 70, color: "#fff", opacity: frame >= L(at, a) ? 1 : 0 }}>→</div>}
            <div style={{ width: 280, opacity: frame >= L(at, a) ? 1 : 0.0 }}>
              {frame >= L(at, a) && (
                <PopIn delay={L(at, a)}>
                  <div style={{ background: K.panel, border: `4px solid ${c}`, borderRadius: 24, padding: "22px 18px", height: 380, textAlign: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
                    <div style={{ fontSize: 96, lineHeight: 1.1 }}>{ic}</div>
                    <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 52, color: c }}>{t}</div>
                    {lines.map((l) => <div key={l} style={{ fontFamily: INTER, fontWeight: 700, fontSize: 30, color: "#E5E7EB", marginTop: 8 }}>{l}</div>)}
                  </div>
                </PopIn>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

/* 44.83 grill-me: it asks instead of guessing */
const GrillPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 44.83;
  const qs: [string, number][] = [["Who is this for?", 47.83], ["What's the main goal?", 48.25], ["Any must-haves?", 48.79]];
  const clear = L(49.93, a);
  const guessing = frame >= L(46.69, a) && frame < L(47.67, a);
  return (
    <>
      <ItemHeader n={5} of={5} kind="SKILL" name="grill-me" color={K.orange} nameAt={L(45.65, a)} />
      {guessing && <PopIn style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", justifyContent: "center" }}><div style={{ position: "relative" }}><Chip bg="#E5E7EB" size={64}>🎲 guessing</Chip><div style={{ position: "absolute", left: -10, right: -10, top: "50%", height: 10, background: K.red, transform: `rotate(-6deg) scaleX(${interpolate(frame - L(46.99, a), [0, 6], [0, 1], clamp)})`, transformOrigin: "0 50%" }} /></div></PopIn>}
      {qs.map(([q, at], i) => frame >= L(at, a) && (
        <PopIn key={q} delay={L(at, a)} from="left" style={{ position: "absolute", left: 60, top: 380 + i * 118 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: K.orange, color: K.ink, fontFamily: INTER, fontWeight: 900, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>✻</div>
            <div style={{ background: "#fff", color: K.ink, fontFamily: INTER, fontWeight: 800, fontSize: 44, padding: "14px 28px", borderRadius: "8px 28px 28px 28px" }}>{q}</div>
          </div>
        </PopIn>
      ))}
      {frame >= L(49.27, a) && (
        <PopIn delay={L(49.27, a)} from="up" style={{ position: "absolute", left: 60, right: 60, top: 750 }}>
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

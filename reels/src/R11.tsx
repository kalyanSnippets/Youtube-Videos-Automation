import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo } from "remotion";
import data from "../public/r/r11f_words.json";
import face from "../public/r/r11f_face.json";
import { f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, Flash, chunkWords, Typewriter, Waveform } from "./lib";
import { K, ease, clamp, Split, ItemHeader, Banner, Chip, Captions, CommentPanel, Follow, FaceTrack } from "./split";

/* Reel 11: "Don't use Claude Code without these 5 AI tools".
   Same system as Reel 10: one split-screen panel per tool that builds in the order Kalyan explains it;
   hook bridge, "but wait" and the closing line stay full-face. Times are seconds on the final cut (r11f_aroll). */
const D = data as unknown as ReelData;
const FT = face as FaceTrack;
const VID = "r/r11f_aroll.mp4";
const END = D.duration + 0.6;
export const R11_FRAMES = Math.ceil(END * FPS);
const L = (abs: number, a: number) => f(abs) - f(a);

const TOOLS: [string, string, string][] = [["🆓", "Free LLM API", K.green], ["🎙️", "ElevenLabs", K.violet], ["🎬", "Remotion", K.blue], ["🌐", "Agent-Reach", K.orange], ["🛡️", "Skill scanner", K.yellow]];

/* 0.0 hook: Claude Code in the middle, five tools land around it on "five AI tools" */
const HookPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const pos: [number, number][] = [[70, 190], [660, 190], [40, 470], [690, 470], [345, 700]];
  return (
    <>
      <PopIn style={{ position: "absolute", left: 0, right: 0, top: 400, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#0B0D10", border: `4px solid ${K.orange}`, borderRadius: 26, padding: "26px 40px", fontFamily: MONO, fontWeight: 800, fontSize: 60, color: K.orange, boxShadow: `0 0 ${50 + Math.sin(frame / 8) * 20}px ${K.orange}66` }}>✻ Claude Code</div>
      </PopIn>
      {TOOLS.map(([ic, n, c], i) => frame >= L(2.3, 0) + i * 5 && (
        <PopIn key={n} delay={L(2.3, 0) + i * 5} style={{ position: "absolute", left: pos[i][0], top: pos[i][1] }}>
          <div style={{ background: K.panel, border: `3px solid ${c}`, borderRadius: 18, padding: "12px 20px", fontFamily: INTER, fontWeight: 900, fontSize: 40, color: "#fff", transform: `translateY(${Math.sin(frame / 14 + i) * 6}px)`, whiteSpace: "nowrap" }}>{ic} {n}</div>
        </PopIn>
      ))}
    </>
  );
};

/* 10.77 free LLM API: calls go up, cost stays at $0, then the honest caveat */
const FreeApiPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 10.77;
  const calls = Math.round(interpolate(frame, [L(15.69, a), L(18.6, a)], [0, 128], { ...clamp, easing: ease }));
  return (
    <>
      <ItemHeader n={1} of={5} kind="TOOL" name="Free LLM API" color={K.green} nameAt={L(11.86, a)} mono={false} />
      {frame >= L(13.73, a) && (
        <PopIn from="up" style={{ position: "absolute", left: 60, right: 60, top: 370 }}>
          <div style={{ background: "#0B0D10", border: `2px solid ${K.line}`, borderRadius: 22, padding: "26px 30px", boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
            <div style={{ fontFamily: MONO, fontSize: 30, color: K.mute }}>POST /v1/chat/completions</div>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {["model A", "model B", "model C"].map((m, i) => frame >= L(14.61, a) + i * 5 && <PopIn key={m} delay={L(14.61, a) + i * 5}><div style={{ border: `2px solid ${K.blue}`, color: K.blue, fontFamily: MONO, fontWeight: 700, fontSize: 30, padding: "6px 16px", borderRadius: 10 }}>{m}</div></PopIn>)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 26 }}>
              <div><div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 30, color: K.mute }}>API CALLS</div><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 96, color: "#fff", lineHeight: 1 }}>{calls}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 30, color: K.mute }}>COST</div><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 96, color: K.green, lineHeight: 1 }}>$0.00</div></div>
            </div>
          </div>
        </PopIn>
      )}
      {frame >= L(19.45, a) && <PopIn style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center" }}><Chip bg={K.yellow} size={44}>⚠️ check the free limits</Chip></PopIn>}
    </>
  );
};

/* 20.57 ElevenLabs: your script goes in, natural speech comes out */
const VoicePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 20.57;
  return (
    <>
      <ItemHeader n={2} of={5} kind="TOOL" name="ElevenLabs" color={K.violet} nameAt={L(21.86, a)} mono={false} />
      {frame >= L(23.57, a) && frame < L(27.12, a) && <PopIn style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}><div style={{ fontSize: 190, lineHeight: 1 }}>🎙️</div><Chip bg="#fff" size={46}>Pro voiceover for your video</Chip></PopIn>}
      {frame >= L(27.12, a) && (
        <>
          <PopIn from="left" style={{ position: "absolute", left: 60, top: 400 }}>
            <div style={{ width: 380, height: 420, background: "#FFFEFA", borderRadius: 18, padding: 26, boxShadow: "0 30px 60px rgba(0,0,0,0.55)", transform: "rotate(-3deg)" }}>
              <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 34, color: K.ink }}>📝 script.txt</div>
              {[0.95, 0.8, 0.9, 0.6, 0.85, 0.7, 0.5].map((k, i) => <div key={i} style={{ height: 16, width: `${k * 100}%`, background: frame >= L(28.48, a) + i * 5 ? K.violet : "#D1D5DB", borderRadius: 8, marginTop: 24 }} />)}
            </div>
          </PopIn>
          {frame >= L(28.84, a) && <PopIn style={{ position: "absolute", left: 468, top: 560, fontFamily: INTER, fontWeight: 900, fontSize: 90, color: "#fff" }}>→</PopIn>}
          {frame >= L(29.16, a) && (
            <PopIn from="right" style={{ position: "absolute", left: 590, top: 430 }}>
              <div style={{ width: 430, background: K.panel, border: `4px solid ${K.violet}`, borderRadius: 24, padding: "30px 24px", boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
                <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 38, color: "#fff", marginBottom: 20 }}>🔊 AI speech</div>
                <Waveform bars={22} color={K.violet} height={170} width={380} seed={3} />
                <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 30, color: K.mute, marginTop: 16 }}>natural-sounding</div>
              </div>
            </PopIn>
          )}
        </>
      )}
    </>
  );
};

/* 30.8 Remotion: prompt, then code, then a rendered video */
const RemotionPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 30.8;
  const code = L(39.39, a), rend = L(42.63, a), vid = L(43.53, a);
  const prog = interpolate(frame, [rend, vid], [0, 100], clamp);
  const lines = ["<Composition id=\"Intro\"", "  fps={30} width={1920}", "  component={Logo3D} />", "rotateY(frame * 4)"];
  return (
    <>
      <ItemHeader n={3} of={5} kind="TOOL" name="Remotion" color={K.blue} nameAt={L(32.35, a)} mono={false} />
      {frame >= L(34.92, a) && frame < code && (
        <PopIn from="up" style={{ position: "absolute", left: 60, right: 60, top: 380 }}>
          <div style={{ background: "#0B0D10", border: `2px solid ${K.line}`, borderRadius: 22, padding: "26px 30px", fontFamily: MONO, fontSize: 40, color: "#fff", minHeight: 330, lineHeight: 1.4, boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
            <div style={{ color: K.orange, fontWeight: 800, fontSize: 34 }}>✻ Claude Code</div>
            <div style={{ marginTop: 14 }}><span style={{ color: K.mute }}>&gt; </span>{frame >= L(35.98, a) && <Typewriter text="Create a 3D-style animated intro for my YouTube video" delay={L(35.98, a)} cps={19} />}</div>
          </div>
        </PopIn>
      )}
      {frame >= code && frame < vid && (
        <PopIn from="up" style={{ position: "absolute", left: 60, right: 60, top: 380 }}>
          <div style={{ background: "#0B0D10", border: `2px solid ${K.line}`, borderRadius: 22, padding: "24px 30px", fontFamily: MONO, fontSize: 34, color: "#9CC3FF", minHeight: 330, boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
            <div style={{ color: K.mute, fontSize: 28 }}>Intro.tsx</div>
            {lines.map((l, i) => frame >= L(40.75, a) + i * 9 && <div key={i} style={{ marginTop: 10, whiteSpace: "pre" }}>{l}</div>)}
            {frame >= rend && (
              <div style={{ marginTop: 22 }}>
                <div style={{ color: "#fff", fontSize: 28 }}>rendering… {Math.round(prog)}%</div>
                <div style={{ height: 18, background: K.line, borderRadius: 9, marginTop: 8 }}><div style={{ height: 18, width: `${prog}%`, background: K.blue, borderRadius: 9 }} /></div>
              </div>
            )}
          </div>
        </PopIn>
      )}
      {frame >= vid && (
        <PopIn style={{ position: "absolute", left: 140, right: 140, top: 370 }}>
          <div style={{ height: 450, borderRadius: 24, background: "linear-gradient(135deg,#0B1B3A,#1D4ED8 60%,#60A5FA)", position: "relative", overflow: "hidden", boxShadow: "0 30px 70px rgba(29,78,216,0.5)", display: "flex", alignItems: "center", justifyContent: "center", perspective: 900 }}>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 110, color: "#fff", letterSpacing: -4, transform: `rotateY(${Math.sin((frame - vid) / 9) * 32}deg) rotateX(12deg)`, textShadow: "6px 6px 0 #0B1B3A, 12px 12px 0 rgba(0,0,0,0.35)" }}>MY INTRO</div>
            <div style={{ position: "absolute", left: 18, bottom: 16, background: "rgba(0,0,0,0.7)", color: "#fff", fontFamily: MONO, fontWeight: 700, fontSize: 28, padding: "4px 14px", borderRadius: 8 }}>▶ intro.mp4</div>
          </div>
        </PopIn>
      )}
    </>
  );
};

/* 47.7 Agent-Reach: three sources feed Claude, instead of searching by hand */
const ReachPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 47.7;
  const src: [string, string, number, number, string][] = [["▶", "YouTube", 52.07, 60, "#FF4D4D"], ["👽", "Reddit", 52.59, 390, "#FF7A45"], ["🐙", "GitHub", 53.21, 720, "#E5E7EB"]];
  const manual = frame >= L(53.65, a);
  return (
    <>
      <ItemHeader n={4} of={5} kind="TOOL" name="Agent-Reach" color={K.orange} nameAt={L(48.84, a)} mono={false} />
      {src.map(([ic, n, at, x, c]) => frame >= L(at, a) && (
        <React.Fragment key={n}>
          <PopIn delay={L(at, a)} style={{ position: "absolute", left: x, top: 380 }}>
            <div style={{ width: 300, background: K.panel, border: `4px solid ${c}`, borderRadius: 20, padding: "16px 0", textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 42, color: "#fff" }}><span style={{ color: c }}>{ic}</span> {n}</div>
          </PopIn>
          <div style={{ position: "absolute", left: x + 146, top: 480, width: 8, height: interpolate(frame - L(at, a), [4, 14], [0, 120], clamp), background: `repeating-linear-gradient(${c} 0 14px, transparent 14px 24px)`, backgroundPositionY: frame * 3 }} />
        </React.Fragment>
      ))}
      {frame >= L(50.47, a) && (
        <PopIn delay={L(50.47, a)} style={{ position: "absolute", left: 0, right: 0, top: 610, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "#0B0D10", border: `4px solid ${K.orange}`, borderRadius: 22, padding: "18px 44px", fontFamily: MONO, fontWeight: 800, fontSize: 50, color: K.orange }}>✻ Claude gathers it</div>
        </PopIn>
      )}
      {manual && (
        <PopIn delay={L(53.65, a)} style={{ position: "absolute", left: 0, right: 0, top: 770, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}><Chip bg="#E5E7EB" size={44}>🔍 searching manually</Chip><div style={{ position: "absolute", left: -10, right: -10, top: "50%", height: 9, background: K.red, transform: `rotate(-3deg) scaleX(${interpolate(frame - L(54.85, a), [0, 6], [0, 1], clamp)})`, transformOrigin: "0 50%" }} /></div>
        </PopIn>
      )}
    </>
  );
};

/* 57.53 NVIDIA's skill scanner: scan skills before you install them */
const ScanPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 57.53;
  const list = L(63.08, a);
  const rows: [string, boolean][] = [["pdf-helper", true], ["free-credits-hack", false], ["ui-designer", true]];
  const scanY = interpolate(frame, [L(65.34, a), L(67.1, a)], [0, 330], clamp);
  return (
    <>
      <ItemHeader n={5} of={5} kind="TOOL" name="Skill security scanner" color={K.yellow} nameAt={L(58.64, a)} mono={false} />
      {frame >= L(60.58, a) && <PopIn delay={L(60.58, a)} style={{ position: "absolute", left: 60, top: 340 }}><Chip bg="#76B900" color="#fff" size={40}>from NVIDIA · SkillSpector</Chip></PopIn>}
      {frame >= list && (
        <PopIn from="up" style={{ position: "absolute", left: 60, right: 60, top: 450 }}>
          <div style={{ position: "relative", background: "#0B0D10", border: `2px solid ${K.line}`, borderRadius: 22, padding: "16px 26px", height: 330, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
            {rows.map(([n, ok], i) => {
              const done = scanY > 70 + i * 100;
              return (
                <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 100, borderBottom: i < 2 ? `2px solid ${K.line}` : "none", fontFamily: MONO, fontWeight: 700, fontSize: 40, color: "#E5E7EB" }}>
                  <span>📦 {n}</span>
                  <span style={{ fontFamily: INTER, fontWeight: 900, fontSize: 36, color: !done ? K.mute : ok ? K.green : K.red }}>{!done ? "?" : ok ? "✓ SAFE" : "⚠ RISKY"}</span>
                </div>
              );
            })}
            {frame >= L(65.34, a) && scanY < 330 && <div style={{ position: "absolute", left: 0, right: 0, top: scanY, height: 6, background: K.yellow, boxShadow: `0 0 30px 8px ${K.yellow}` }} />}
          </div>
        </PopIn>
      )}
    </>
  );
};

/* 70.81 closing line: the three uses pop above the head as he lists them */
const Uses: React.FC = () => {
  const a = 70.6;
  const u: [string, number, string][] = [["🎙️ Voiceovers", 70.81, K.violet], ["🎬 Animations", 71.57, K.blue], ["🔎 Research", 72.27, K.orange], ["+ more", 73.03, K.yellow]];
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top: 170, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
      {u.map(([t, at, c]) => frame >= L(at, a) && <PopIn key={t} delay={L(at, a)}><Chip bg={c} size={44}>{t}</Chip></PopIn>)}
    </div>
  );
};

type Seg = { a: number; b: number; split?: React.FC; accent?: string; over?: React.ReactNode };
const SEGS: Seg[] = [
  { a: 0, b: 3.47, split: HookPanel, accent: K.orange },
  { a: 5.85, b: 8.47, over: <Banner text="NOT JUST FOR CODING" top={170} /> },
  { a: 10.77, b: 20.57, split: FreeApiPanel, accent: K.green },
  { a: 20.57, b: 30.8, split: VoicePanel, accent: K.violet },
  { a: 30.8, b: 44.47, split: RemotionPanel, accent: K.blue },
  { a: 45.23, b: 47.7, over: <Banner text="⏱ SAVES HOURS OF RESEARCH" color={K.yellow} top={170} size={60} /> },
  { a: 47.7, b: 57.53, split: ReachPanel, accent: K.orange },
  { a: 57.53, b: 67.53, split: ScanPanel, accent: K.yellow },
  { a: 70.6, b: 73.77, over: <Uses /> },
  { a: 73.77, b: 76.03, split: () => <CommentPanel word="PLUGIN" title="💬 Comment to get the links" typeAt={L(74.21, 73.77)} sentAt={L(74.9, 73.77)} replyAt={L(75.41, 73.77)} reply="📩 aiwithkalyan: sent you all the links!" />, accent: K.yellow },
  { a: 76.3, b: END, over: <Follow top={170} /> },
];
const isSplit = (t: number) => SEGS.some((s) => s.split && t >= s.a && t < s.b);
/* "this one's is really cool": the stray "is" is a slip of the tongue, so it is left out of the captions */
const chunks = chunkWords(D.words.filter((w) => !(w.w === "is" && Math.abs(w.s - 33.91) < 0.05)), 3, 16);

export const Reel11: React.FC = () => {
  /* same sound family as Reel 10: swish = panel in, pop = item in, typing / click = input, ding = result */
  const sfx: [number, string, number?][] = [
    [0.0, "swish", 0.3], [2.3, "pop", 0.3], [5.85, "swish", 0.28],
    [10.77, "swish", 0.28], [11.86, "pop", 0.3], [15.69, "typing", 0.22], [18.6, "ding", 0.25], [19.45, "pop", 0.28],
    [20.57, "swish", 0.28], [21.86, "pop", 0.3], [27.12, "pop", 0.28], [29.16, "ding", 0.25],
    [30.8, "swish", 0.28], [32.35, "pop", 0.3], [35.98, "typing", 0.25], [39.39, "pop", 0.28], [43.53, "ding", 0.28],
    [45.23, "swish", 0.28], [47.7, "swish", 0.28], [48.84, "pop", 0.3], [52.07, "pop", 0.28], [52.59, "pop", 0.28], [53.21, "pop", 0.28],
    [57.53, "swish", 0.28], [58.64, "pop", 0.3], [63.08, "pop", 0.28], [65.9, "ding", 0.22], [66.25, "glitch", 0.22], [66.9, "ding", 0.22],
    [70.81, "pop", 0.28], [71.57, "pop", 0.28], [72.27, "pop", 0.28],
    [73.77, "swish", 0.28], [74.21, "typing", 0.25], [74.9, "pop", 0.3], [75.41, "notify", 0.3], [77.03, "click", 0.45],
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
      <Music src="r/r11_music.wav" total={END} base={0.07} boosts={[[44.4, 47.5, 0.11], [76.0, END, 0.12]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.3} />)}
    </AbsoluteFill>
  );
};

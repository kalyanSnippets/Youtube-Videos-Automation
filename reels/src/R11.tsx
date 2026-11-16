import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo } from "remotion";
import data from "../public/r/r11f_words.json";
import face from "../public/r/r11f_face.json";
import tmap from "../public/r/r11_timemap.json";
import { f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, Flash, chunkWords, Typewriter, Waveform } from "./lib";
import { K, ease, clamp, Split, ItemHeader, Banner, Chip, Captions, CommentPanel, Follow, FaceTrack, Float3D, Screen3D } from "./split";

/* Reel 11: "Don't use Claude Code without these 5 AI tools" (v2: faster cut, real sites, built 3D intro).
   Hook keeps the five tools locked so they are revealed one by one. Each tool shows its real site, recorded
   live in a browser, on a floating 3D screen, then a short visual of what it does.
   Graphic times below are written on the first cut; T() maps them onto the faster cut (tighter pauses, 1.07x). */
const D = data as unknown as ReelData;
const FT = face as FaceTrack;
const VID = "r/r11f_aroll.mp4";
const END = D.duration + 0.6;
export const R11_FRAMES = Math.ceil(END * FPS);
const TM = tmap as { old: number[]; new: number[] };
const T = (x: number) => {
  const o = TM.old, n = TM.new;
  if (x <= o[0]) return n[0] + (x - o[0]);
  for (let i = 1; i < o.length; i++) if (x <= o[i]) return n[i - 1] + ((x - o[i - 1]) / (o[i] - o[i - 1])) * (n[i] - n[i - 1]);
  return n[n.length - 1] + (x - o[o.length - 1]);
};
const L = (abs: number, a: number) => f(T(abs)) - f(Math.max(0, T(a)));

const SITE = { free: "b/r11_site_free.mp4", el: "b/r11_site_elevenlabs.mp4", rem: "b/r11_site_remotion.mp4", reach: "b/r11_site_agentreach.mp4", spec: "b/r11_site_skillspector.mp4" };

const Term: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; size?: number }> = ({ children, style, size = 34 }) => (
  <div style={{ background: "#0B0D10", border: `2px solid ${K.line}`, borderRadius: 22, padding: "22px 28px", fontFamily: MONO, fontSize: size, color: "#E5E7EB", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", ...style }}>
    <div style={{ color: K.orange, fontWeight: 800 }}>✻ Claude Code</div>
    {children}
  </div>
);

/* 0.0 hook: five locked mystery tools around Claude Code; nothing is named yet */
const HookPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const show = L(2.49, 0);
  const pos: [number, number][] = [[70, 200], [700, 200], [40, 560], [740, 560], [395, 740]];
  const cols = [K.green, K.violet, K.blue, K.orange, K.yellow];
  return (
    <>
      <Float3D spin={60} sway={5} style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#0B0D10", border: `4px solid ${K.orange}`, borderRadius: 26, padding: "24px 40px", fontFamily: MONO, fontWeight: 800, fontSize: 60, color: K.orange, boxShadow: `0 0 ${50 + Math.sin(frame / 6) * 20}px ${K.orange}88` }}>✻ Claude Code</div>
      </Float3D>
      {pos.map(([x, y], i) => (
        <Float3D key={i} delay={show + i * 3} spin={i % 2 ? -120 : 120} sway={8} style={{ position: "absolute", left: x, top: y }}>
          <div style={{ width: 270, height: 120, borderRadius: 20, background: "rgba(21,26,34,0.9)", border: `3px dashed ${cols[i]}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: INTER, fontWeight: 900, fontSize: 56, color: cols[i], boxShadow: `0 0 40px ${cols[i]}44`, filter: `blur(${Math.max(0, 1.5 + Math.sin(frame / 7 + i) * 1.5)}px)` }}>🔒 ?</div>
        </Float3D>
      ))}
      {frame >= show + 16 && <PopIn delay={show + 16} style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center" }}><Chip bg={K.yellow} size={46}>5 tools · 0 / 5 unlocked</Chip></PopIn>}
    </>
  );
};

/* one tool's real site on a 3D screen; slides aside (or away) when the explainer takes over */
const SiteShot: React.FC<{ src: string; url: string; glow: string; away: number; mode?: "aside" | "out"; w?: number }> = ({ src, url, glow, away, mode = "aside", w = 900 }) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [away, away + 12], [0, 1], { ...clamp, easing: ease });
  if (mode === "out" && k >= 1) return null;
  const left = mode === "aside" ? 90 - k * 60 : 90 - k * 1100;
  const sc = mode === "aside" ? 1 - k * 0.48 : 1;
  return (
    <Float3D spin={-70} sway={0} style={{ position: "absolute", left, top: 350 - k * 20 }}>
      <div style={{ transform: `scale(${sc})`, transformOrigin: "0 0", filter: `brightness(${1 - k * 0.25})` }}>
        <Screen3D src={src} w={w} url={url} rotY={-8} rotX={4} sway={3} glow={glow} />
      </div>
    </Float3D>
  );
};
const Unlock: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 4, 16], [0, 1, 0], clamp);
  return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${color}88, transparent 60%)`, opacity: o, pointerEvents: "none" }} />;
};

/* 10.77 free LLM API list */
const FreeApiPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 10.77;
  const calls = Math.round(interpolate(frame, [L(15.69, a), L(18.6, a)], [0, 128], { ...clamp, easing: ease }));
  return (
    <>
      <Unlock color={K.green} />
      <ItemHeader n={1} of={5} kind="TOOL" name="Free LLM API list" color={K.green} nameAt={L(11.86, a)} mono={false} />
      <SiteShot src={SITE.free} url="github.com/…/free-llm-api-resources" glow={K.green} away={L(13.73, a)} />
      <Float3D delay={L(13.73, a)} spin={90} sway={6} tilt={-8} style={{ position: "absolute", left: 520, top: 380, width: 520 }}>
        <div style={{ background: "#0B0D10", border: `2px solid ${K.line}`, borderRadius: 22, padding: "24px 26px", boxShadow: `0 30px 60px rgba(0,0,0,0.55), 0 0 50px ${K.green}33` }}>
          <div style={{ fontFamily: MONO, fontSize: 24, color: K.mute }}>POST /v1/chat/completions</div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {["Llama", "Gemini", "Mistral"].map((m, i) => frame >= L(14.61, a) + i * 4 && <PopIn key={m} delay={L(14.61, a) + i * 4}><div style={{ border: `2px solid ${K.blue}`, color: K.blue, fontFamily: MONO, fontWeight: 700, fontSize: 26, padding: "4px 12px", borderRadius: 10 }}>{m}</div></PopIn>)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 }}>
            <div><div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 24, color: K.mute }}>API CALLS</div><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 78, color: "#fff", lineHeight: 1 }}>{calls}</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 24, color: K.mute }}>COST</div><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 78, color: K.green, lineHeight: 1 }}>$0.00</div></div>
          </div>
        </div>
      </Float3D>
      {frame >= L(19.45, a) && <Float3D delay={L(19.45, a)} style={{ position: "absolute", left: 540, top: 760 }}><Chip bg={K.yellow} size={42}>⚠️ check the free limits</Chip></Float3D>}
    </>
  );
};

/* 20.57 ElevenLabs: real site, then script → natural speech */
const VoicePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 20.57;
  const conv = L(27.12, a);
  return (
    <>
      <Unlock color={K.violet} />
      <ItemHeader n={2} of={5} kind="TOOL" name="ElevenLabs" color={K.violet} nameAt={L(21.86, a)} mono={false} />
      <SiteShot src={SITE.el} url="elevenlabs.io" glow={K.violet} away={conv} mode="out" />
      {frame >= L(23.57, a) && frame < conv && <Float3D delay={L(23.57, a)} style={{ position: "absolute", left: 560, top: 800 }}><Chip bg="#fff" size={40}>🎙️ pro voiceover, no mic</Chip></Float3D>}
      {frame >= conv && (
        <>
          <Float3D delay={conv} spin={-100} sway={6} tilt={10} style={{ position: "absolute", left: 50, top: 380 }}>
            <div style={{ width: 380, height: 430, background: "#FFFEFA", borderRadius: 18, padding: 26, boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
              <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 32, color: K.ink }}>📝 script.txt</div>
              {[0.95, 0.8, 0.9, 0.6, 0.85, 0.7, 0.5].map((k, i) => <div key={i} style={{ height: 16, width: `${k * 100}%`, background: frame >= L(28.48, a) + i * 3 ? K.violet : "#D1D5DB", borderRadius: 8, marginTop: 26 }} />)}
            </div>
          </Float3D>
          {frame >= L(28.84, a) && <div style={{ position: "absolute", left: 445, top: 560, width: interpolate(frame - L(28.84, a), [0, 8], [0, 140], clamp), height: 10, borderRadius: 5, background: `linear-gradient(90deg, #fff, ${K.violet})`, boxShadow: `0 0 20px ${K.violet}` }} />}
          <Float3D delay={L(29.16, a)} spin={100} sway={6} tilt={-10} style={{ position: "absolute", left: 600, top: 400 }}>
            <div style={{ width: 430, background: K.panel, border: `4px solid ${K.violet}`, borderRadius: 24, padding: "28px 24px", boxShadow: `0 30px 60px rgba(0,0,0,0.55), 0 0 60px ${K.violet}55` }}>
              <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 36, color: "#fff", marginBottom: 18 }}>🔊 AI speech</div>
              <Waveform bars={22} color={K.violet} height={170} width={380} seed={3} />
              <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 28, color: K.mute, marginTop: 14 }}>natural-sounding</div>
            </div>
          </Float3D>
        </>
      )}
    </>
  );
};

/* 30.8 Remotion: real remotion.dev, the prompt, then a real 3D intro rendered with Remotion for this reel */
const RemotionPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 30.8;
  const ask = L(34.92, a), code = L(39.0, a), out = L(40.75, a);
  const lines = ["<ThreeCanvas>", "  <Text3D>AI WITH KALYAN</Text3D>", "  <Ring glow spin={frame/40} />", "</ThreeCanvas>"];
  const z = interpolate(frame, [out, out + 14], [0, 1], { ...clamp, easing: ease });
  return (
    <>
      <Unlock color={K.blue} />
      <ItemHeader n={3} of={5} kind="TOOL" name="Remotion" color={K.blue} nameAt={L(32.35, a)} mono={false} />
      <SiteShot src={SITE.rem} url="remotion.dev" glow={K.blue} away={ask} mode="out" />
      {frame >= ask && frame < out && (
        <Float3D delay={ask} spin={-80} sway={4} tilt={6} style={{ position: "absolute", left: 60, right: 60, top: 370 }}>
          <Term size={34} style={{ minHeight: 470 }}>
            <div style={{ marginTop: 14 }}><span style={{ color: K.mute }}>&gt; </span><Typewriter text="Create a 3D-style animated intro for my YouTube video" delay={L(35.98, a)} cps={26} caret={frame < code} /></div>
            {frame >= code && (
              <div style={{ marginTop: 18, color: "#9CC3FF", fontSize: 28 }}>
                <div style={{ color: K.mute, fontSize: 24 }}>Intro.tsx · @remotion/three</div>
                {lines.map((l, i) => frame >= code + 2 + i * 3 && <div key={i} style={{ marginTop: 6, whiteSpace: "pre" }}>{l}</div>)}
                {frame >= code + 18 && <div style={{ marginTop: 14, color: "#fff" }}>rendering… <span style={{ color: K.blue }}>{Math.round(interpolate(frame, [code + 18, out], [0, 100], clamp))}%</span></div>}
              </div>
            )}
          </Term>
        </Float3D>
      )}
      {frame >= out && (
        <>
          <div style={{ position: "absolute", left: 60 + (1 - z) * 200, top: 300 + (1 - z) * 120, transform: `scale(${0.6 + z * 0.4})`, transformOrigin: "50% 50%" }}>
            <Screen3D src="b/r11_intro3d.mp4" at={out} startFrom={42} w={960} url="intro.mp4 · rendered with Remotion" rotY={-5} rotX={4} sway={3} glow={K.blue} dark />
          </div>
          <Float3D delay={out + 14} style={{ position: "absolute", left: 560, top: 860 }}><Chip bg={K.green} size={38}>✓ real 3D, made in code</Chip></Float3D>
        </>
      )}
    </>
  );
};

/* 47.7 Agent-Reach: real repo, then three sources feed Claude */
const ReachPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 47.7;
  const go = L(50.47, a);
  const src: [string, string, number, number, string][] = [["▶", "YouTube", 52.07, 60, "#FF4D4D"], ["👽", "Reddit", 52.59, 390, "#FF7A45"], ["🐙", "GitHub", 53.21, 720, "#E5E7EB"]];
  return (
    <>
      <Unlock color={K.orange} />
      <ItemHeader n={4} of={5} kind="TOOL" name="Agent-Reach" color={K.orange} nameAt={L(48.84, a)} mono={false} />
      <SiteShot src={SITE.reach} url="github.com/Panniantong/Agent-Reach" glow={K.orange} away={go} mode="out" />
      {frame >= go && (
        <>
          {src.map(([ic, n, at, x, c]) => (
            <React.Fragment key={n}>
              <Float3D delay={L(at, a)} spin={110} sway={6} style={{ position: "absolute", left: x, top: 390 }}>
                <div style={{ width: 300, background: K.panel, border: `4px solid ${c}`, borderRadius: 20, padding: "16px 0", textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 42, color: "#fff", boxShadow: `0 0 40px ${c}44` }}><span style={{ color: c }}>{ic}</span> {n}</div>
              </Float3D>
              {frame >= L(at, a) && <div style={{ position: "absolute", left: x + 146, top: 490, width: 8, height: interpolate(frame - L(at, a), [4, 12], [0, 120], clamp), background: `repeating-linear-gradient(${c} 0 14px, transparent 14px 24px)`, backgroundPositionY: frame * 4 }} />}
            </React.Fragment>
          ))}
          <Float3D delay={go} spin={-60} style={{ position: "absolute", left: 0, right: 0, top: 620, display: "flex", justifyContent: "center" }}>
            <div style={{ background: "#0B0D10", border: `4px solid ${K.orange}`, borderRadius: 22, padding: "18px 44px", fontFamily: MONO, fontWeight: 800, fontSize: 48, color: K.orange, boxShadow: `0 0 50px ${K.orange}55` }}>✻ Claude gathers it</div>
          </Float3D>
          {frame >= L(53.65, a) && (
            <PopIn delay={L(53.65, a)} style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative" }}><Chip bg="#E5E7EB" size={42}>🔍 searching manually</Chip><div style={{ position: "absolute", left: -10, right: -10, top: "50%", height: 9, background: K.red, transform: `rotate(-3deg) scaleX(${interpolate(frame - L(54.85, a), [0, 5], [0, 1], clamp)})`, transformOrigin: "0 50%" }} /></div>
            </PopIn>
          )}
        </>
      )}
    </>
  );
};

/* 57.53 NVIDIA SkillSpector: real repo, then a scan of skills before install */
const ScanPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 57.53;
  const list = L(63.08, a);
  const rows: [string, boolean][] = [["pdf-helper", true], ["free-credits-hack", false], ["ui-designer", true]];
  const scanY = interpolate(frame, [L(65.34, a), L(67.1, a)], [0, 330], clamp);
  return (
    <>
      <Unlock color={K.yellow} />
      <ItemHeader n={5} of={5} kind="TOOL" name="NVIDIA SkillSpector" color={K.yellow} nameAt={L(58.64, a)} mono={false} />
      <SiteShot src={SITE.spec} url="github.com/NVIDIA/SkillSpector" glow="#76B900" away={list} mode="out" />
      {frame >= list && (
        <Float3D delay={list} spin={-80} sway={4} tilt={5} style={{ position: "absolute", left: 60, right: 60, top: 400 }}>
          <div style={{ position: "relative", background: "#0B0D10", border: `2px solid ${K.line}`, borderRadius: 22, padding: "16px 26px", height: 360, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: K.mute, marginBottom: 4 }}>$ skillspector scan ./skills</div>
            {rows.map(([n, ok], i) => {
              const done = scanY > 70 + i * 100;
              return (
                <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 100, borderBottom: i < 2 ? `2px solid ${K.line}` : "none", fontFamily: MONO, fontWeight: 700, fontSize: 40, color: "#E5E7EB" }}>
                  <span>📦 {n}</span>
                  <span style={{ fontFamily: INTER, fontWeight: 900, fontSize: 36, color: !done ? K.mute : ok ? K.green : K.red }}>{!done ? "…" : ok ? "✓ SAFE" : "⚠ RISKY"}</span>
                </div>
              );
            })}
            {frame >= L(65.34, a) && scanY < 330 && <div style={{ position: "absolute", left: 0, right: 0, top: 40 + scanY, height: 6, background: K.yellow, boxShadow: `0 0 30px 8px ${K.yellow}` }} />}
          </div>
        </Float3D>
      )}
    </>
  );
};

/* 70.6 closing line: the uses pop above the head as he lists them */
const Uses: React.FC = () => {
  const a = 70.6;
  const u: [string, number, string][] = [["🎙️ Voiceovers", 70.81, K.violet], ["🎬 Animations", 71.57, K.blue], ["🔎 Research", 72.27, K.orange], ["+ more", 73.03, K.yellow]];
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top: 170, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
      {u.map(([t, at, c]) => <Float3D key={t} delay={L(at, a)}><Chip bg={c} size={44}>{t}</Chip></Float3D>)}
    </div>
  );
};

type Seg = { a: number; b: number; split?: React.FC; accent?: string; over?: React.ReactNode };
const RAW: Seg[] = [
  { a: 0, b: 3.47, split: HookPanel, accent: K.orange },
  { a: 5.85, b: 8.47, over: <Banner text="NOT JUST FOR CODING" top={170} /> },
  { a: 8.56, b: 10.77, over: <Banner text="🔓 LET'S UNLOCK THEM" color={K.yellow} top={170} size={62} /> },
  { a: 10.77, b: 20.57, split: FreeApiPanel, accent: K.green },
  { a: 20.57, b: 30.8, split: VoicePanel, accent: K.violet },
  { a: 30.8, b: 44.47, split: RemotionPanel, accent: K.blue },
  { a: 45.23, b: 47.7, over: <Banner text="⏱ SAVES HOURS OF RESEARCH" color={K.yellow} top={170} size={60} /> },
  { a: 47.7, b: 57.53, split: ReachPanel, accent: K.orange },
  { a: 57.53, b: 67.53, split: ScanPanel, accent: K.yellow },
  { a: 70.6, b: 73.77, over: <Uses /> },
  { a: 73.77, b: 76.03, split: () => <CommentPanel word="PLUGIN" title="💬 Comment to get the links" typeAt={L(74.21, 73.77)} sentAt={L(74.9, 73.77)} replyAt={L(75.41, 73.77)} reply="📩 aiwithkalyan: sent you all the links!" />, accent: K.yellow },
  { a: 76.3, b: 1e9, over: <Follow top={170} /> },
];
const SEGS = RAW.map((s) => ({ ...s, a: Math.max(0, T(s.a)), b: s.b >= 1e9 ? END : T(s.b) }));
const isSplit = (t: number) => SEGS.some((s) => s.split && t >= s.a && t < s.b);
/* "this one's is really cool": the stray "is" is a slip of the tongue, so it is left out of the captions */
const chunks = chunkWords(D.words.filter((w) => !(w.w === "is" && Math.abs(w.s - T(33.91)) < 0.05)), 3, 16);

export const Reel11: React.FC = () => {
  /* same sound family as Reel 10: swish = panel in, pop = item in, typing / click = input, ding = result */
  const sfx: [number, string, number?][] = [
    [0.0, "swish", 0.3], [2.49, "pop", 0.3], [5.85, "swish", 0.28], [8.56, "swish", 0.28],
    [10.77, "glitch", 0.2], [11.86, "pop", 0.3], [13.73, "swish", 0.25], [18.6, "ding", 0.25], [19.45, "pop", 0.28],
    [20.57, "glitch", 0.2], [21.86, "pop", 0.3], [27.12, "swish", 0.25], [29.16, "ding", 0.25],
    [30.8, "glitch", 0.2], [32.35, "pop", 0.3], [34.92, "swish", 0.25], [35.98, "typing", 0.25], [40.75, "impact", 0.3], [41.3, "ding", 0.25],
    [45.23, "swish", 0.28], [47.7, "glitch", 0.2], [48.84, "pop", 0.3], [52.07, "pop", 0.28], [52.59, "pop", 0.28], [53.21, "pop", 0.28],
    [57.53, "glitch", 0.2], [58.64, "pop", 0.3], [63.08, "swish", 0.25], [65.9, "ding", 0.22], [66.25, "glitch", 0.2], [66.9, "ding", 0.22],
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
      <Music src="r/r11_music.wav" total={END} base={0.07} boosts={[[T(44.4), T(47.5), 0.11], [T(76.0), END, 0.12]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={T(t)} name={n} vol={v ?? 0.3} />)}
    </AbsoluteFill>
  );
};

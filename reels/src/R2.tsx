import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, Easing, OffthreadVideo } from "remotion";
import data from "../public/r/r2f_words.json";
import {
  Aroll, Cursor, f, FPS, GridBg, INTER, MONO, Music, Pic, PopIn, ReelData, Sfx, SubscribeCard, Typewriter, Credit,
  Flash, Waveform, Glitch, chunkWords, activeChunk,
} from "./lib";

/* Reel 2 v2: every line is matched to a Genie 4 demo that shows exactly that thing,
   with the prompt Google typed shown big on screen. Voice at 1.1x. */
const D = data as ReelData;
const END = D.duration + 0.8; // short tail so the last word is never clipped
export const R2_FRAMES = Math.ceil(END * FPS);

const C = { dark: "#0D0D0D", darkLine: "rgba(255,255,255,0.06)", light: "#FAFAFA", lightLine: "#ECECEC", blue: "#3B82F6", green: "#22C55E", coral: "#EF4444", ink: "#111", gray: "#8A8F98" };
const DM = "Genie 4 demo · Google DeepMind";
const VY = 500; // top of the 16:9 footage window
const VH = 608;

/* ---------- footage window: sharp 16:9 on a blurred fill of itself ---------- */
const Footage: React.FC<{ src: string; at?: number; rate?: number; label?: string; credit?: string; gray?: boolean; children?: React.ReactNode }> = ({ src, at = 0, rate = 1, label, credit = DM, gray, children }) => {
  const frame = useCurrentFrame();
  const z = 1 + interpolate(frame, [0, 120], [0, 0.05], { extrapolateRight: "clamp" });
  const v = (style: React.CSSProperties) => (
    <OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(at * FPS)} playbackRate={rate} style={style} />
  );
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: `blur(40px) brightness(0.45)${gray ? " grayscale(1)" : ""}`, transform: "scale(1.2)" }}>
        {v({ width: "100%", height: "100%", objectFit: "cover" })}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: VY, width: 1080, height: VH, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ width: "100%", height: "100%", transform: `scale(${z})`, filter: gray ? "grayscale(1) brightness(0.85)" : undefined }}>
          {v({ width: "100%", height: "100%", objectFit: "cover" })}
        </div>
        {children}
      </div>
      {label && (
        <div style={{ position: "absolute", left: 24, top: VY + 20 }}>
          <div style={{ background: "rgba(0,0,0,0.7)", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 30, padding: "8px 16px", borderRadius: 12 }}>{label}</div>
        </div>
      )}
      <div style={{ position: "absolute", right: 20, top: VY + VH + 10, fontFamily: INTER, fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{credit}</div>
    </AbsoluteFill>
  );
};

/* Prompt bar that types in time with the voice. */
const PromptBar: React.FC<{ text: string; delay?: number; cps?: number; top?: number; big?: boolean; placeholder?: string }> = ({ text, delay = 0, cps = 30, top = VY + VH + 60, big, placeholder }) => {
  const frame = useCurrentFrame();
  const sent = frame - delay > (text.length / cps) * FPS + 6;
  return (
    <div style={{ position: "absolute", top, left: 40, right: 40 }}>
      <PopIn delay={Math.max(0, delay - 4)} from="up" dist={40}>
        <div style={{ borderRadius: 30, background: "rgba(24,24,27,0.94)", border: `3px solid ${sent ? C.blue : "rgba(255,255,255,0.18)"}`, padding: big ? "30px 34px" : "22px 28px", display: "flex", gap: 18, alignItems: "center", boxShadow: sent ? `0 0 40px ${C.blue}` : "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: big ? 52 : 40 }}>✨</div>
          <div style={{ flex: 1, fontFamily: INTER, fontWeight: 700, fontSize: big ? 52 : 40, color: "#fff", lineHeight: 1.2 }}>
            {text ? <Typewriter text={text} delay={delay} cps={cps} caretColor={C.blue} /> : <span style={{ color: C.gray }}>{placeholder}<Typewriter text="" /></span>}
          </div>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: sent ? C.blue : "#3f3f46", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 36, fontWeight: 800 }}>↑</div>
        </div>
      </PopIn>
    </div>
  );
};

const Key: React.FC<{ k: string; on: boolean }> = ({ k, on }) => (
  <div style={{ width: 92, height: 92, borderRadius: 18, background: on ? C.blue : "rgba(20,20,20,0.8)", border: `3px solid ${on ? "#93c5fd" : "rgba(255,255,255,0.35)"}`, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 42, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${on ? 6 : 0}px)`, boxShadow: on ? `0 0 30px ${C.blue}` : "0 8px 0 rgba(0,0,0,0.5)" }}>{k}</div>
);
const WASD: React.FC<{ delay?: number; top?: number }> = ({ delay = 0, top = VY + VH + 50 }) => {
  const frame = useCurrentFrame() - delay;
  const seq = ["W", "W", "D", "W", "A", "W", "S", "W"];
  const cur = frame < 0 ? "" : seq[Math.floor(frame / 8) % seq.length];
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <PopIn delay={delay}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Key k="W" on={cur === "W"} />
          <div style={{ display: "flex", gap: 10 }}>{["A", "S", "D"].map((k) => <Key key={k} k={k} on={cur === k} />)}</div>
        </div>
      </PopIn>
    </div>
  );
};
const Chip: React.FC<{ children: React.ReactNode; bg?: string; delay?: number; top?: number }> = ({ children, bg = C.blue, delay = 0, top = VY + VH + 60 }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <PopIn delay={delay}><div style={{ background: bg, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 50, padding: "16px 34px", borderRadius: 999 }}>{children}</div></PopIn>
  </div>
);

/* ---------- scenes (local frames) ---------- */
const S = {
  world: () => <><Footage src="b/g_mirage.mp4" at={1} rate={1.5} label="Real Genie 4 demo" /><Chip delay={f(1.4)}>🌍 a whole world</Chip></>,
  prompt: () => <><Footage src="b/g_city.mp4" at={0} label="Typed prompt → world" /><PromptBar text="People in varied outfits walk the street" delay={3} cps={32} /></>,
  walk: () => <><Footage src="b/g_walk.mp4" at={0.5} rate={1.2} label="Walking inside a Genie 4 world" /><WASD delay={4} /></>,
  announce: () => {
    const frame = useCurrentFrame();
    return (
      <AbsoluteFill>
        <GridBg bg={C.light} line={C.lightLine} />
        <div style={{ position: "absolute", top: 470, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <PopIn from="up"><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 150, color: C.ink, letterSpacing: -4, lineHeight: 1 }}>Genie <span style={{ color: C.blue }}>4</span></div></PopIn>
          <PopIn delay={6}><div style={{ width: 900, borderRadius: 28, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", transform: `rotate(${interpolate(frame, [0, 120], [-2, 0])}deg)` }}><Pic src="img/tc_head.png" style={{ height: 470 }} pos="50% 40%" /></div></PopIn>
          <div style={{ display: "flex", gap: 16 }}>
            <PopIn delay={18}><div style={{ background: C.ink, color: "#fff", fontFamily: INTER, fontWeight: 700, fontSize: 32, padding: "12px 22px", borderRadius: 999 }}>Google DeepMind</div></PopIn>
            <PopIn delay={24}><div style={{ background: "#fff", border: "2px solid #e5e5e5", color: C.ink, fontFamily: INTER, fontWeight: 700, fontSize: 32, padding: "12px 22px", borderRadius: 999 }}>Oct 27, 2026</div></PopIn>
          </div>
        </div>
        <Credit text="Source: TechCrunch" top={1300} color="#fff" />
      </AbsoluteFill>
    );
  },
  regular: () => <><Footage src="b/g_maple.mp4" gray label="Regular AI video" credit="" /><Chip bg="#52525b">▶ you can only watch</Chip></>,
  explore: () => <><Footage src="b/g_fox.mp4" at={1} label="Genie 4 · interactive" /><WASD delay={3} /></>,
  cityPrompt: () => {
    const frame = useCurrentFrame();
    const show = frame >= f(2.4); // "flying cars"
    const phase = frame < f(5.1) ? 0 : frame < f(6.9) ? 1 : 2; // typing -> generated -> exploring
    return (
      <AbsoluteFill style={{ background: C.dark }}>
        <GridBg bg={C.dark} line={C.darkLine} glow="rgba(59,130,246,0.2)" />
        {show && (
          <Sequence from={f(2.4)}>
            <Footage src="b/gen_city.mp4" rate={0.77} label={phase < 2 ? "AI illustration · not Genie 4 footage" : "Exploring the world you created (illustration)"} credit="Illustration generated for this reel" />
          </Sequence>
        )}
        {show && <Sequence from={f(2.4)} durationInFrames={6}><Flash dur={5} /></Sequence>}
        {phase === 0 && <PromptBar text="create a futuristic city with flying cars, skyscrapers and neon lights" delay={f(0.85)} cps={17.5} top={show ? VY + VH + 50 : 760} big />}
        {phase === 1 && <Sequence from={f(5.1)}><Chip>⚡ world generated from your prompt</Chip></Sequence>}
        {phase === 2 && <Sequence from={f(6.9)}><WASD delay={0} /></Sequence>}
      </AbsoluteFill>
    );
  },
  weather: () => <><Footage src="b/g_snow.mp4" at={4.5} rate={1.5} label="Weather change · real demo" /><PromptBar text="It starts to snow ❄️" delay={0} cps={40} /></>,
  character: () => <><Footage src="b/g_deer.mp4" at={4.6} rate={1.5} label="New character · real demo" /><PromptBar text="A stained-glass deer walks through the river" delay={0} cps={40} /></>,
  crazy: () => (
    <AbsoluteFill>
      <Glitch at={0} dur={7}>
        <Aroll data={D} src="r/r2f_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={920} zoom={1.3} alternate={false} offset={f(28.75)} />
      </Glitch>
      <div style={{ position: "absolute", top: 1240, width: "100%", display: "flex", justifyContent: "center" }}>
        <PopIn delay={3}><div style={{ background: C.coral, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 64, padding: "14px 34px", borderRadius: 20, transform: "rotate(-3deg)" }}>THE CRAZY PART 🤯</div></PopIn>
      </div>
    </AbsoluteFill>
  ),
  sound: () => (
    <>
      <Footage src="b/g_opera.mp4" at={1} label="Sound is generated too" />
      <div style={{ position: "absolute", top: VY + VH + 50, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Waveform color={C.blue} width={900} height={110} />
        <PopIn delay={10}><div style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 40, padding: "12px 24px", borderRadius: 999 }}>🔊 applause · music · ambience</div></PopIn>
      </div>
    </>
  ),
  talk: () => <><Footage src="b/g_moto2.mp4" at={1.4} rate={1.6} label="Characters talk back · real demo" /><PromptBar text="He looks back. She asks him if he thinks they'll make it." delay={0} cps={34} /></>,
  preview: () => {
    const frame = useCurrentFrame();
    const stamp = interpolate(frame, [4, 12], [2.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return (
      <>
        <Footage src="b/g_crane.mp4" at={2} label="Genie 4" credit="Limits per Google DeepMind's Genie 4 post" />
        <div style={{ position: "absolute", top: VY + VH / 2, left: "50%", transform: `translate(-50%,-50%) rotate(-8deg) scale(${stamp})`, opacity: frame > 4 ? 1 : 0, border: `8px solid ${C.coral}`, color: C.coral, background: "rgba(255,255,255,0.94)", fontFamily: MONO, fontWeight: 800, fontSize: 70, padding: "10px 30px", borderRadius: 18, whiteSpace: "nowrap" }}>EXPERIMENTAL</div>
        <Chip bg="#27272a" delay={14}>research preview · waitlist</Chip>
      </>
    );
  },
  gaming: () => <><Footage src="b/g_dragon.mp4" at={5} label="The future of gaming?" /><Chip delay={6}>🎮 games you can just describe</Chip></>,
  dream: () => {
    const frame = useCurrentFrame();
    const clips: [string, number][] = [["b/g_magic.mp4", 2], ["b/g_balloon.mp4", 3], ["b/g_ski.mp4", 4], ["b/g_train.mp4", 1]];
    const i = Math.min(3, Math.floor(frame / 28));
    return (
      <>
        <Sequence from={i * 28} key={i}><Footage src={clips[i][0]} at={clips[i][1]} /></Sequence>
        <PromptBar text="my dream game…" delay={f(1.2)} cps={10} />
      </>
    );
  },
  whatType: () => (
    <AbsoluteFill style={{ background: C.dark }}>
      <GridBg bg={C.dark} line={C.darkLine} glow="rgba(59,130,246,0.25)" />
      <PromptBar text="" placeholder="What would you type? " top={760} big />
    </AbsoluteFill>
  ),
  cta: () => (
    <AbsoluteFill>
      <GridBg bg={C.light} line={C.lightLine} />
      <div style={{ position: "absolute", top: 440, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <PopIn from="up">
          <div style={{ width: 900, background: "#fff", borderRadius: 30, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,0.12)", display: "flex", gap: 20 }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: C.blue, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 30, color: C.ink }}>you · now</div>
              <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 38, color: C.ink, marginTop: 6 }}><Typewriter text="a floating pirate city in the clouds 🏴‍☠️" delay={8} cps={22} caretColor={C.blue} /></div>
            </div>
          </div>
        </PopIn>
        <PopIn delay={f(1.2)} from="up"><SubscribeCard clickAt={f(2.1)} accent={C.blue} sub="Mind-blowing AI tools, explained" /></PopIn>
      </div>
      <Cursor path={[[f(1.2), 900, 1300], [f(1.9), 560, 1030], [f(2.7), 580, 1040]]} clicks={[f(2.1)]} />
    </AbsoluteFill>
  ),
};

type Scene = { a: number; b: number; body: React.FC; face?: boolean; light?: boolean };
const SCENES: Scene[] = [
  { a: 0, b: 2.95, body: S.world, face: true },
  { a: 2.95, b: 4.7, body: S.prompt, face: true },
  { a: 4.7, b: 6.65, body: S.walk, face: true },
  { a: 6.65, b: 10.85, body: S.announce, face: true, light: true },
  { a: 10.85, b: 12.95, body: S.regular, face: true },
  { a: 12.95, b: 16.0, body: S.explore, face: true },
  { a: 16.0, b: 25.0, body: S.cityPrompt, face: true },
  { a: 25.0, b: 26.45, body: S.weather, face: true },
  { a: 26.45, b: 28.75, body: S.character, face: true },
  { a: 28.75, b: 31.9, body: S.crazy },
  { a: 31.9, b: 33.95, body: S.sound, face: true },
  { a: 33.95, b: 36.6, body: S.talk, face: true },
  { a: 36.6, b: 38.45, body: S.preview, face: true },
  { a: 38.45, b: 41.1, body: S.gaming, face: true },
  { a: 41.1, b: 44.8, body: S.dream, face: true },
  { a: 44.8, b: 46.2, body: S.whatType, face: true },
  { a: 46.2, b: END, body: S.cta, face: true, light: true },
];

/* ---------- captions: upper third, grey base, white active, blue box on keywords ---------- */
const KEY = new Set(["world", "prompt", "inside", "genie 4", "impressive", "interactive", "explore", "futuristic", "flying", "neon", "keyboard", "weather", "ask", "characters", "crazy", "visuals", "sounds", "conversations", "real", "experimental", "gaming", "dream", "type", "comments", "subscribe"]);
const chunks = chunkWords(D.words, 5, 26);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const sc = SCENES.find((s) => t >= s.a && t < s.b);
  const light = sc?.light;
  return (
    <div style={{ position: "absolute", top: 150, left: 50, right: 50, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 18px" }}>
      {c.words.map((w, i) => {
        const active = t >= w.s - 0.03;
        const core = w.w.replace(/[,.?!]$/, "");
        const isKey = KEY.has(core.toLowerCase());
        const col = active ? (light ? C.ink : "#fff") : light ? "#B5B9C0" : "#7B808A";
        return (
          <div key={i} style={{ position: "relative", fontFamily: INTER, fontWeight: 800, fontSize: 68, color: col, letterSpacing: -1, padding: isKey && active ? "0 10px" : 0, textShadow: light ? undefined : "0 4px 20px rgba(0,0,0,0.7)" }}>
            {core}
            {isKey && active && (
              <>
                <div style={{ position: "absolute", inset: -4, border: `4px solid ${C.blue}`, borderRadius: 4 }} />
                {[[-12, -12], [-12, "r"], ["b", -12], ["b", "r"]].map(([y, x], k) => (
                  <div key={k} style={{ position: "absolute", width: 16, height: 16, background: "#fff", border: `4px solid ${C.blue}`, top: y === "b" ? undefined : (y as number), bottom: y === "b" ? -12 : undefined, left: x === "r" ? undefined : (x as number), right: x === "r" ? -12 : undefined }} />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const Reel2: React.FC = () => {
  const cuts = SCENES.map((s) => s.a);
  const sfx: [number, string, number?][] = [
    ...cuts.map((c, i) => [c, i % 2 ? "swish" : "whoosh", 0.35] as [number, string, number]),
    [0, "impact", 0.45], [1.4, "pop"], [3.05, "typing", 0.3], [4.8, "blip", 0.3], [5.1, "blip", 0.3], [5.4, "blip", 0.3], [6.85, "pop"], [7.2, "shutter", 0.35],
    [10.85, "glitch", 0.25], [13.05, "blip", 0.3], [13.35, "blip", 0.3], [16.6, "typing", 0.35], [17.9, "typing", 0.3], [18.4, "impact", 0.45], [21.25, "pop"],
    [23.0, "blip", 0.3], [23.3, "blip", 0.3], [25.0, "typing", 0.35], [26.45, "typing", 0.35], [28.75, "glitch", 0.5], [28.8, "impact", 0.5],
    [32.2, "pop", 0.3], [33.95, "typing", 0.35], [36.75, "impact", 0.4], [38.6, "pop"], [41.1, "riser", 0.35], [42.0, "whoosh", 0.3], [42.9, "whoosh", 0.3],
    [43.8, "whoosh", 0.3], [44.8, "impact", 0.35], [46.6, "typing", 0.3], [48.3, "click", 0.6], [48.35, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: C.dark }}>
      {SCENES.map((s, i) => {
        const from = f(s.a);
        const dur = Math.max(1, f(s.b) - from);
        const Body = s.body;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Body />
            {s.face && (
              <Aroll data={D} src="r/r2f_aroll.mp4" box={{ x: 350, y: 1450, w: 380, h: 430, r: 40 }} focusY={900} zoom={1.5} offset={from} border="5px solid rgba(255,255,255,0.92)" shadow />
            )}
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("r/r2f_aroll.mp4")} />
      <Music src="r/r2_music.wav" total={END} base={0.13} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

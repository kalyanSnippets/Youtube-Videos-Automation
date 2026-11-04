import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, Easing } from "remotion";
import data from "../public/r/r2_words.json";
import {
  Aroll, Clip, Cursor, f, FPS, GridBg, INTER, MONO, Music, Pic, PopIn, ReelData, Sfx, SubscribeCard, Typewriter, Credit,
  Flash, Waveform, Glitch, chunkWords, activeChunk,
} from "./lib";

const D = data as ReelData;
export const R2_FRAMES = Math.ceil(D.duration * FPS);

const C = { dark: "#0D0D0D", darkLine: "rgba(255,255,255,0.06)", light: "#FAFAFA", lightLine: "#ECECEC", blue: "#3B82F6", green: "#22C55E", coral: "#EF4444", ink: "#111", gray: "#8A8F98" };
const CREDIT = "Genie 4 demo footage: Google DeepMind";

type Theme = "dark" | "light" | "bleed";
type Scene = { a: number; b: number; theme: Theme; body: React.FC; face?: "card" | "full" | "none" };

/* ---------- pieces ---------- */
const Key: React.FC<{ k: string; on: boolean }> = ({ k, on }) => (
  <div style={{ width: 96, height: 96, borderRadius: 18, background: on ? C.blue : "rgba(20,20,20,0.75)", border: `3px solid ${on ? "#93c5fd" : "rgba(255,255,255,0.35)"}`, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 44, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${on ? 6 : 0}px)`, boxShadow: on ? `0 0 30px ${C.blue}` : "0 8px 0 rgba(0,0,0,0.5)" }}>{k}</div>
);
const WASD: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame() - delay;
  const seq = ["W", "W", "D", "W", "A", "W", "S", "W"];
  const cur = frame < 0 ? "" : seq[Math.floor(frame / 9) % seq.length];
  return (
    <PopIn delay={delay}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Key k="W" on={cur === "W"} />
        <div style={{ display: "flex", gap: 10 }}>{["A", "S", "D"].map((k) => <Key key={k} k={k} on={cur === k} />)}</div>
      </div>
    </PopIn>
  );
};
const PromptBar: React.FC<{ text: string; delay?: number; cps?: number; dark?: boolean; width?: number; placeholder?: string }> = ({ text, delay = 0, cps = 22, dark = true, width = 940, placeholder }) => (
  <div style={{ width, borderRadius: 30, background: dark ? "rgba(24,24,27,0.92)" : "#fff", border: `2px solid ${dark ? "rgba(255,255,255,0.14)" : "#e5e5e5"}`, padding: "22px 28px", display: "flex", gap: 18, alignItems: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}>
    <div style={{ fontSize: 40 }}>✨</div>
    <div style={{ flex: 1, fontFamily: INTER, fontWeight: 600, fontSize: 36, color: dark ? "#fff" : C.ink, lineHeight: 1.25 }}>
      {text ? <Typewriter text={text} delay={delay} cps={cps} caretColor={C.blue} /> : <span style={{ color: C.gray }}>{placeholder}<Typewriter text="" /></span>}
    </div>
    <div style={{ width: 64, height: 64, borderRadius: 32, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 34, fontWeight: 800 }}>↑</div>
  </div>
);
const VCard: React.FC<{ src: string; start?: number; w?: number; label?: string; gray?: boolean; children?: React.ReactNode; dur?: number }> = ({ src, start = 0, w = 980, label, gray, children, dur = 150 }) => (
  <div style={{ width: w, height: (w * 9) / 16, borderRadius: 32, overflow: "hidden", position: "relative", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", border: "2px solid rgba(255,255,255,0.12)" }}>
    <Clip src={src} startFrom={start} durFrames={dur} style={{ width: "100%", height: "100%", filter: gray ? "grayscale(1) brightness(0.8)" : undefined }} />
    {label && <div style={{ position: "absolute", left: 20, top: 20, background: "rgba(0,0,0,0.65)", color: "#fff", fontFamily: INTER, fontWeight: 700, fontSize: 28, padding: "8px 16px", borderRadius: 12 }}>{label}</div>}
    {children}
  </div>
);
const Bleed: React.FC<{ src: string; start?: number; pos?: string; dur?: number }> = ({ src, start = 0, pos = "50% 50%", dur = 150 }) => (
  <AbsoluteFill>
    <Clip src={src} startFrom={start} durFrames={dur} kenBurns={0.1} style={{ width: 1080, height: 1920 }} />
    <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.7) 100%)" }} />
  </AbsoluteFill>
);

/* ---------- scenes ---------- */
const Hook: React.FC = () => (
  <AbsoluteFill>
    <Bleed src="b/g_mirage.mp4" dur={220} />
    <div style={{ position: "absolute", top: 760, width: "100%", display: "flex", justifyContent: "center" }}>
      <PopIn delay={f(3.9)}><div style={{ background: C.blue, color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 44, padding: "14px 30px", borderRadius: 999 }}>✨ ONE PROMPT</div></PopIn>
    </div>
    <div style={{ position: "absolute", top: 900, width: "100%", display: "flex", justifyContent: "center" }}>
      <WASD delay={f(5.5)} />
    </div>
    <Credit text={CREDIT} top={1260} />
  </AbsoluteFill>
);

const Announce: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 470, gap: 34 }}>
      <PopIn from="up"><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 150, color: C.ink, letterSpacing: -4, lineHeight: 1 }}>Genie <span style={{ color: C.blue }}>4</span></div></PopIn>
      <PopIn delay={6}>
        <div style={{ width: 900, borderRadius: 28, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", transform: `rotate(${interpolate(frame, [0, 120], [-2, 0])}deg)` }}>
          <Pic src="img/tc_head.png" style={{ height: 520 }} pos="50% 40%" />
        </div>
      </PopIn>
      <div style={{ display: "flex", gap: 16 }}>
        <PopIn delay={18}><div style={{ background: C.ink, color: "#fff", fontFamily: INTER, fontWeight: 700, fontSize: 30, padding: "12px 22px", borderRadius: 999 }}>Google DeepMind</div></PopIn>
        <PopIn delay={24}><div style={{ background: "#fff", border: "2px solid #e5e5e5", color: C.ink, fontFamily: INTER, fontWeight: 700, fontSize: 30, padding: "12px 22px", borderRadius: 999 }}>Oct 27, 2026</div></PopIn>
      </div>
      <Credit text="Source: TechCrunch" top={1270} color="#fff" />
    </AbsoluteFill>
  );
};

const Compare: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: 400, gap: 18 }}>
    <PopIn from="left" dist={300}>
      <VCard src="b/g_glass.mp4" w={780} gray label="Regular AI video">
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 46, padding: "16px 30px", borderRadius: 20 }}>▶ you just watch</div>
        </div>
      </VCard>
    </PopIn>
    <PopIn from="right" dist={300} delay={f(2.2)}>
      <VCard src="b/g_fox.mp4" w={780} label="Genie 4">
        <div style={{ position: "absolute", right: 24, bottom: 24, transform: "scale(0.7)", transformOrigin: "100% 100%" }}><WASD delay={f(2.6)} /></div>
        <div style={{ position: "absolute", left: 24, bottom: 24, background: C.green, color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 40, padding: "12px 24px", borderRadius: 16 }}>🎮 you explore</div>
      </VCard>
    </PopIn>
    <Credit text={CREDIT} top={1290} />
  </AbsoluteFill>
);

const CityPrompt: React.FC = () => {
  const frame = useCurrentFrame();
  const swap = frame > f(3.5);
  return (
    <AbsoluteFill>
      {swap ? <Bleed src="b/g_alley.mp4" dur={60} /> : <GridBg bg={C.dark} line={C.darkLine} glow="rgba(59,130,246,0.18)" />}
      {!swap && (
        <div style={{ position: "absolute", top: 640, width: "100%", display: "flex", justifyContent: "center" }}>
          <PopIn delay={10}><VCard src="b/g_city.mp4" w={900} /></PopIn>
        </div>
      )}
      <div style={{ position: "absolute", top: 440, width: "100%", display: "flex", justifyContent: "center" }}>
        <PopIn from="up"><PromptBar text="create a futuristic city with flying cars, skyscrapers and neon lights" delay={8} cps={19} /></PopIn>
      </div>
      {swap && <Flash dur={6} />}
      <Credit text={CREDIT} top={1270} />
    </AbsoluteFill>
  );
};

const Keyboard: React.FC = () => (
  <AbsoluteFill>
    <Bleed src="b/g_moto.mp4" start={2} dur={140} />
    <div style={{ position: "absolute", top: 860, width: "100%", display: "flex", justifyContent: "center" }}><WASD delay={f(2.4)} /></div>
    <Credit text={CREDIT} top={1270} />
  </AbsoluteFill>
);

const Weather: React.FC = () => {
  const frame = useCurrentFrame();
  const icons = ["☀️", "🌧", "❄️"];
  const i = Math.min(2, Math.floor(frame / 14));
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 440, gap: 30 }}>
      <PopIn><VCard src="b/g_balloon.mp4" w={900} label="Genie 4 demo" /></PopIn>
      <div style={{ display: "flex", gap: 24 }}>
        {icons.map((ic, k) => (
          <div key={k} style={{ width: 150, height: 150, borderRadius: 40, background: k === i ? C.blue : "#fff", border: "2px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, transform: `scale(${k === i ? 1.12 : 1})`, boxShadow: k === i ? `0 0 40px ${C.blue}` : undefined }}>{ic}</div>
        ))}
      </div>
      <PopIn delay={30}><div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 46, color: C.ink }}>“change the weather” → just ask</div></PopIn>
    </AbsoluteFill>
  );
};

const Characters: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: 460, gap: 30 }}>
    <PopIn><VCard src="b/g_train.mp4" w={960} dur={80} /></PopIn>
    <PopIn delay={10}><div style={{ background: C.green, color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 46, padding: "16px 30px", borderRadius: 999 }}>＋ new character</div></PopIn>
    <Credit text={CREDIT} top={1270} />
  </AbsoluteFill>
);

const CrazyPart: React.FC = () => (
  <AbsoluteFill>
    <Glitch at={0} dur={7}>
      <Aroll data={D} src="r/r2_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={920} zoom={1.3} alternate={false} offset={f(31.53)} />
    </Glitch>
    <div style={{ position: "absolute", top: 1230, width: "100%", display: "flex", justifyContent: "center" }}>
      <PopIn delay={3}><div style={{ background: C.coral, color: "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 64, padding: "14px 34px", borderRadius: 20, transform: "rotate(-3deg)" }}>THE CRAZY PART 🤯</div></PopIn>
    </div>
  </AbsoluteFill>
);

const Audio3: React.FC = () => {
  const chips = [["🔊", "ambient sound", 6], ["🎷", "music", 26], ["💬", "dialogue", 50], ["⚡", "in real time", 110]] as const;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 440, gap: 26 }}>
      <PopIn><VCard src="b/g_piano.mp4" w={940} dur={160} /></PopIn>
      <Waveform color={C.blue} width={900} height={110} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, width: 940, justifyContent: "center" }}>
        {chips.map(([e, t, d]) => (
          <PopIn key={t} delay={d}><div style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.18)", color: "#fff", fontFamily: INTER, fontWeight: 700, fontSize: 34, padding: "12px 22px", borderRadius: 999 }}>{e} {t}</div></PopIn>
        ))}
      </div>
      <Credit text={CREDIT} top={1290} />
    </AbsoluteFill>
  );
};

const Preview: React.FC = () => {
  const frame = useCurrentFrame();
  const stamp = interpolate(frame, [6, 14], [2.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 450, gap: 30 }}>
      <div style={{ position: "relative" }}>
        <VCard src="b/g_dragon.mp4" w={920} dur={150} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) rotate(-8deg) scale(${stamp})`, opacity: frame > 6 ? 1 : 0, border: `8px solid ${C.coral}`, color: C.coral, background: "rgba(255,255,255,0.92)", fontFamily: MONO, fontWeight: 800, fontSize: 64, padding: "10px 30px", borderRadius: 18 }}>RESEARCH PREVIEW</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 920 }}>
        {["Trusted testers only (waitlist open)", "Details can drift in longer sessions"].map((t, i) => (
          <PopIn key={t} delay={20 + i * 10} from="left"><div style={{ background: "#fff", border: "2px solid #e5e5e5", borderRadius: 18, padding: "16px 22px", fontFamily: INTER, fontWeight: 700, fontSize: 34, color: C.ink }}>• {t}</div></PopIn>
        ))}
      </div>
      <Credit text="Limits per Google DeepMind's Genie 4 post" top={1290} color="#fff" />
    </AbsoluteFill>
  );
};

const DreamMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const clips = ["b/g_fox.mp4", "b/g_dragon.mp4", "b/g_ski.mp4", "b/g_magic.mp4"];
  const i = Math.min(3, Math.floor(frame / 30));
  return (
    <AbsoluteFill>
      <Sequence from={i * 30} key={i}><Bleed src={clips[i]} start={3} dur={30} /></Sequence>
      <div style={{ position: "absolute", top: 1000, width: "100%", display: "flex", justifyContent: "center" }}>
        <PromptBar text="my dream game…" delay={6} cps={10} />
      </div>
      <Credit text={CREDIT} top={1270} />
    </AbsoluteFill>
  );
};

const WhatType: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <PopIn><PromptBar text="" placeholder="What would you type? " /></PopIn>
  </AbsoluteFill>
);

const CTA: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: 420, gap: 34 }}>
    <PopIn from="up">
      <div style={{ width: 900, background: "#fff", borderRadius: 30, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,0.12)", display: "flex", gap: 20 }}>
        <div style={{ width: 70, height: 70, borderRadius: 35, background: C.blue, flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 30, color: C.ink }}>you · now</div>
          <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 36, color: C.ink, marginTop: 6 }}><Typewriter text="a floating pirate city in the clouds 🏴‍☠️" delay={10} cps={20} caretColor={C.blue} /></div>
        </div>
      </div>
    </PopIn>
    <PopIn delay={f(1.4)} from="up"><SubscribeCard clickAt={f(2.4)} accent={C.blue} sub="Mind-blowing AI tools, explained" /></PopIn>
    <Cursor path={[[f(1.4), 900, 1300], [f(2.2), 560, 1010], [f(3), 580, 1020]]} clicks={[f(2.4)]} />
  </AbsoluteFill>
);

const SCENES: Scene[] = [
  { a: 0, b: 7.3, theme: "bleed", body: Hook, face: "card" },
  { a: 7.3, b: 11.9, theme: "light", body: Announce, face: "card" },
  { a: 11.9, b: 17.5, theme: "dark", body: Compare, face: "card" },
  { a: 17.5, b: 22.85, theme: "dark", body: CityPrompt, face: "card" },
  { a: 22.85, b: 27.4, theme: "bleed", body: Keyboard, face: "card" },
  { a: 27.4, b: 29.1, theme: "light", body: Weather, face: "card" },
  { a: 29.1, b: 31.53, theme: "dark", body: Characters, face: "card" },
  { a: 31.53, b: 35.1, theme: "dark", body: CrazyPart, face: "none" },
  { a: 35.1, b: 40.2, theme: "dark", body: Audio3, face: "card" },
  { a: 40.2, b: 45.18, theme: "light", body: Preview, face: "card" },
  { a: 45.18, b: 49.28, theme: "bleed", body: DreamMontage, face: "card" },
  { a: 49.28, b: 50.8, theme: "dark", body: WhatType, face: "card" },
  { a: 50.8, b: D.duration, theme: "light", body: CTA, face: "card" },
];

/* ---------- captions: upper third, grey base, white active, blue box on keywords ---------- */
const KEY = new Set(["world", "prompt", "inside", "genie 4", "impressive", "interactive", "explore", "futuristic", "neon", "keyboard", "weather", "ask", "characters", "crazy", "visuals", "sounds", "conversations", "real", "experimental", "gaming", "dream", "type", "comments", "subscribe"]);
const chunks = chunkWords(D.words, 5, 26);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const sc = SCENES.find((s) => t >= s.a && t < s.b);
  const light = sc?.theme === "light";
  return (
    <div style={{ position: "absolute", top: 170, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 18px" }}>
      {c.words.map((w, i) => {
        const active = t >= w.s - 0.03;
        const core = w.w.replace(/[,.?!]$/, "");
        const isKey = KEY.has(core.toLowerCase());
        const col = active ? (light ? C.ink : "#fff") : light ? "#B5B9C0" : "#6B7079";
        return (
          <div key={i} style={{ position: "relative", fontFamily: INTER, fontWeight: 800, fontSize: 70, color: col, letterSpacing: -1, padding: isKey && active ? "0 10px" : 0, textShadow: light ? undefined : "0 4px 20px rgba(0,0,0,0.6)" }}>
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
  const sfx: [number, string, number?][] = [
    [0, "impact", 0.45], [0.1, "whoosh"], [3.9, "pop"], [5.5, "blip", 0.3], [5.8, "blip", 0.3], [6.1, "blip", 0.3], [7.3, "whoosh"], [7.5, "pop"], [7.9, "shutter", 0.35],
    [11.9, "swish"], [14.1, "whoosh"], [17.5, "whoosh"], [17.8, "typing", 0.3], [19.2, "typing", 0.3], [21.0, "impact", 0.45], [22.85, "whoosh"], [25.3, "blip", 0.3], [25.6, "blip", 0.3],
    [27.4, "swish"], [27.9, "pop", 0.3], [28.4, "pop", 0.3], [29.1, "whoosh"], [29.5, "pop"], [31.53, "glitch", 0.5], [31.6, "impact", 0.5],
    [35.1, "whoosh"], [35.4, "pop", 0.3], [36.0, "pop", 0.3], [36.8, "pop", 0.3], [38.8, "pop", 0.3], [40.2, "swish"], [40.45, "impact", 0.4],
    [45.18, "riser", 0.35], [46.2, "whoosh", 0.3], [47.2, "whoosh", 0.3], [48.2, "whoosh", 0.3], [49.28, "impact", 0.4], [50.8, "whoosh"], [51.2, "typing", 0.3], [53.2, "click", 0.6], [53.25, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: C.dark }}>
      {SCENES.map((s, i) => {
        const from = f(s.a);
        const dur = Math.max(1, f(s.b) - from);
        const Body = s.body;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {s.theme === "dark" && <GridBg bg={C.dark} line={C.darkLine} glow="rgba(59,130,246,0.14)" />}
            {s.theme === "light" && <GridBg bg={C.light} line={C.lightLine} />}
            <Body />
            {s.face === "card" && (
              <PopIn from="up" dist={60}>
                <Aroll data={D} src="r/r2_aroll.mp4" box={{ x: 300, y: 1340, w: 480, h: 540, r: 44 }} focusY={900} zoom={1.45} offset={from} border="5px solid rgba(255,255,255,0.9)" shadow />
              </PopIn>
            )}
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("r/r2_aroll.mp4")} />
      <Music src="r/r2_music.wav" total={D.duration} base={0.14} boosts={[[45.18, 49.28, 0.3]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

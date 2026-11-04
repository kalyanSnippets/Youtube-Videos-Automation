import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, Easing } from "remotion";
import data from "../public/r/r3_words.json";
import {
  Aroll, Clip, Cursor, f, FPS, INTER, MONO, SERIF, Music, Pic, PopIn, ReelData, Sfx, SubscribeCard, Typewriter, Credit, Flash,
  chunkWords, activeChunk,
} from "./lib";

const D = data as ReelData;
export const R3_FRAMES = Math.ceil(D.duration * FPS);

const C = { navy: "#070B14", sage: "#4D7A5E", sageDark: "#2F4D3B", amber: "#F2B84B", white: "#FFFFFF", mute: "#9FB0A6" };
const TOP_H = 1344;
const NASA = "Footage: NASA (public domain)";

const Stars: React.FC<{ n?: number }> = ({ n = 140 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 120%, #10203a, ${C.navy} 60%)` }}>
      {new Array(n).fill(0).map((_, i) => {
        const x = (i * 739) % 1080, y = (i * 1171) % TOP_H, s = (i % 3) + 1;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / 20 + i));
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: s, background: "#fff", opacity: tw }} />;
      })}
    </AbsoluteFill>
  );
};

const SerifTitle: React.FC<{ children: React.ReactNode; delay?: number; size?: number; top?: number }> = ({ children, delay = 0, size = 92, top = 120 }) => (
  <div style={{ position: "absolute", top, left: 60, right: 60, textAlign: "center" }}>
    <PopIn delay={delay} from="up" dist={40}>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: size, color: "#fff", lineHeight: 1.08, textShadow: "0 6px 30px rgba(0,0,0,0.7)" }}>{children}</div>
    </PopIn>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string }> = ({ children, bg = "rgba(255,255,255,0.12)", color = "#fff" }) => (
  <div style={{ background: bg, color, border: "1.5px solid rgba(255,255,255,0.25)", backdropFilter: "blur(6px)", fontFamily: INTER, fontWeight: 700, fontSize: 34, padding: "12px 24px", borderRadius: 999 }}>{children}</div>
);

/* ---------- scenes ---------- */
const Open: React.FC = () => {
  const frame = useCurrentFrame();
  const punch = frame >= f(2.52);
  return (
    <AbsoluteFill>
      <div style={{ transform: `scale(${punch ? 1.25 : 1})`, width: 1080, height: TOP_H }}>
        <Clip src="b/n_window.mp4" pos="78% 35%" durFrames={120} kenBurns={0.12} style={{ width: 1080, height: TOP_H }} />
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0) 40%)" }} />
      {!punch && <SerifTitle delay={4}>Google just made AI<br />work in space.</SerifTitle>}
      {punch && <SerifTitle size={120} top={160}>Yes, <span style={{ color: C.amber }}>actual</span> space.</SerifTitle>}
      {punch && <Sequence from={f(2.52)}><Flash dur={5} /></Sequence>}
      <Credit text={NASA} top={TOP_H - 70} />
    </AbsoluteFill>
  );
};

const Launch: React.FC = () => {
  const frame = useCurrentFrame();
  const hw = frame >= f(2.0);
  return (
    <AbsoluteFill>
      <Clip src="b/n_launchset.mp4" startFrom={44} durFrames={120} kenBurns={0.15} style={{ width: 1080, height: TOP_H }} />
      <AbsoluteFill style={{ background: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0) 35%)" }} />
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <PopIn><Chip bg="rgba(77,122,94,0.85)">🛰 Project Suncatcher</Chip></PopIn>
        <PopIn delay={6}><Chip>Prototype launched Oct 1, 2026</Chip></PopIn>
      </div>
      {hw && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 470 }}>
          <PopIn from="up" dist={120}>
            <div style={{ borderRadius: 30, overflow: "hidden", border: "3px solid rgba(255,255,255,0.8)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", position: "relative" }}>
              <Pic src="img/suncatcher_hero.png" style={{ height: 500 }} pos="50% 50%" />
              <div style={{ position: "absolute", left: 20, bottom: 20, background: C.amber, color: "#111", fontFamily: INTER, fontWeight: 800, fontSize: 36, padding: "10px 20px", borderRadius: 14 }}>4 × Google TPU AI chips on board</div>
            </div>
          </PopIn>
        </div>
      )}
      <Credit text={hw ? "Image: Google · Launch: NASA archive (not the Suncatcher launch)" : "Archival launch footage: NASA (not the Suncatcher launch)"} top={TOP_H - 70} />
    </AbsoluteFill>
  );
};

const Earth: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <Stars />
    <div style={{ position: "absolute", left: -360, top: 860, width: 1800, height: 1800, borderRadius: 900, background: "radial-gradient(circle at 50% 20%, #4aa3ff, #1b4f9c 45%, #0b2147 70%)", boxShadow: "0 0 120px rgba(80,160,255,0.55)" }} />
    {children}
  </AbsoluteFill>
);

const Uplink: React.FC = () => {
  const frame = useCurrentFrame();
  const ang = interpolate(frame, [0, 190], [-30, 15]);
  const sx = 540 + Math.sin((ang * Math.PI) / 180) * 820;
  const sy = 1760 - Math.cos((ang * Math.PI) / 180) * 1300;
  const gx = 540, gy = 870;
  const pulse = interpolate(frame, [f(1.4), f(2.8)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Earth>
      <svg width={1080} height={TOP_H} style={{ position: "absolute" }}>
        <ellipse cx={540} cy={1760} rx={820} ry={1300} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={3} strokeDasharray="10 14" />
        <line x1={gx} y1={gy} x2={sx} y2={sy} stroke={C.amber} strokeWidth={5} strokeDasharray="14 12" opacity={pulse > 0 ? 0.9 : 0} />
        {pulse > 0 && pulse < 1 && <circle cx={gx + (sx - gx) * pulse} cy={gy + (sy - gy) * pulse} r={18} fill={C.amber} />}
      </svg>
      <div style={{ position: "absolute", left: gx - 26, top: gy - 26, width: 52, height: 52, borderRadius: 26, background: C.amber, border: "6px solid #fff" }} />
      <div style={{ position: "absolute", left: gx - 140, top: gy + 40, width: 280, textAlign: "center", fontFamily: INTER, fontWeight: 700, fontSize: 30, color: "#fff" }}>Ground station · Earth</div>
      <div style={{ position: "absolute", left: sx - 70, top: sy - 40, fontSize: 90 }}>🛰</div>
      <div style={{ position: "absolute", left: Math.min(760, sx + 40), top: sy - 40 }}>
        <PopIn delay={f(4.0)}><div style={{ background: C.sage, color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 34, padding: "10px 18px", borderRadius: 14 }}>Gemma 4<br /><span style={{ fontWeight: 500, fontSize: 26 }}>running on board</span></div></PopIn>
      </div>
      <SerifTitle size={76} top={120}>A prompt, sent<br />from Earth to orbit</SerifTitle>
    </Earth>
  );
};

const PromptCard: React.FC = () => (
  <AbsoluteFill style={{ background: C.sage, alignItems: "center", justifyContent: "center" }}>
    <div style={{ position: "absolute", top: 140, fontFamily: MONO, fontWeight: 800, fontSize: 40, color: "#E6F0E9", letterSpacing: 4 }}>▲ UPLINK</div>
    <PopIn>
      <div style={{ width: 900, background: "#0f1a14", borderRadius: 30, padding: 44, boxShadow: "0 30px 70px rgba(0,0,0,0.35)" }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.mute }}>PROMPT → Gemma 4 (in orbit)</div>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 52, color: "#fff", marginTop: 26, lineHeight: 1.3 }}>
          <Typewriter text="Write a haiku about being in space." delay={f(1.0)} cps={20} caretColor={C.amber} />
        </div>
      </div>
    </PopIn>
    <Credit text="Prompt as described on blog.google" top={TOP_H - 70} />
  </AbsoluteFill>
);

const Haiku: React.FC = () => {
  const lines = ["Blue marble below", "Data streams in silent grace", "Starlight feeds my core."];
  return (
    <AbsoluteFill>
      <Clip src="b/n_airglow.mp4" pos="78% 35%" durFrames={130} kenBurns={0.06} style={{ width: 1080, height: TOP_H, filter: "brightness(0.55)" }} />
      <div style={{ position: "absolute", top: 120, width: "100%", textAlign: "center", fontFamily: MONO, fontWeight: 800, fontSize: 40, color: C.amber, letterSpacing: 4 }}>▼ DOWNLINK · RECEIVED</div>
      <div style={{ position: "absolute", top: 330, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 30 }}>
        {lines.map((l, i) => (
          <div key={l} style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 84, color: "#fff", textShadow: "0 6px 30px rgba(0,0,0,0.8)", lineHeight: 1.1 }}>
            <Typewriter text={l} delay={f(0.5 + i * 1.15)} cps={24} caret={false} />
          </div>
        ))}
        <PopIn delay={f(3.6)}><div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 32, color: C.mute, marginTop: 20 }}>— Gemma 4, written in orbit · received as the satellite passed Svalbard, Norway</div></PopIn>
      </div>
      <Credit text="Haiku: blog.google (Project Suncatcher) · Footage: NASA" top={TOP_H - 70} />
    </AbsoluteFill>
  );
};

const Constellation: React.FC = () => {
  const frame = useCurrentFrame();
  const sats = new Array(9).fill(0).map((_, i) => ({ x: 200 + (i % 3) * 340, y: 470 + Math.floor(i / 3) * 230 }));
  return (
    <AbsoluteFill>
      <Clip src="b/n_nz.mp4" pos="78% 35%" durFrames={140} kenBurns={0.05} style={{ width: 1080, height: TOP_H, filter: "brightness(0.45)" }} />
      <SerifTitle size={82}>AI data centers…<br /><span style={{ color: C.amber }}>in orbit?</span></SerifTitle>
      <svg width={1080} height={TOP_H} style={{ position: "absolute" }}>
        {sats.map((a, i) => sats.slice(i + 1).filter((b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 400).map((b, k) => (
          <line key={`${i}-${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.amber} strokeWidth={3} opacity={frame > 20 + i * 4 ? 0.7 : 0} strokeDasharray="8 8" />
        )))}
      </svg>
      {sats.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x - 70, top: s.y - 26 }}>
          <PopIn delay={4 + i * 4}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 46, height: 30, background: "linear-gradient(135deg,#2c5fd6,#163a8c)", border: "2px solid #9cc0ff" }} />
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "#ddd" }} />
              <div style={{ width: 46, height: 30, background: "linear-gradient(135deg,#2c5fd6,#163a8c)", border: "2px solid #9cc0ff" }} />
            </div>
          </PopIn>
        </div>
      ))}
      <div style={{ position: "absolute", top: 1010, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn delay={50}><Chip bg="rgba(77,122,94,0.85)">☀️ solar-powered TPU satellites</Chip></PopIn>
      </div>
      <Credit text={NASA} top={TOP_H - 70} />
    </AbsoluteFill>
  );
};

const Article: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.sage, alignItems: "center", paddingTop: 200 }}>
      <PopIn>
        <div style={{ width: 960, borderRadius: 26, overflow: "hidden", background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,0.3)", transform: `scale(${interpolate(frame, [0, 80], [1, 1.06])})` }}>
          <Pic src="img/sun_head.png" fit="contain" style={{ height: 260 }} />
        </div>
      </PopIn>
      <PopIn delay={14} from="up" style={{ marginTop: 40 }}>
        <div style={{ width: 960, borderRadius: 26, overflow: "hidden", background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,0.3)", height: 620 }}>
          <Pic src="img/sun_haiku.png" pos="0% 0%" />
        </div>
      </PopIn>
      <Credit text="Source: blog.google · Google Research" top={TOP_H - 70} />
    </AbsoluteFill>
  );
};

const Roadmap: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = [["Oct 2026", "First AI response from orbit", "✓", "#22C55E"], ["2027", "Two linked satellites (planned)", "…", C.amber], ["Future", "Data centers in space?", "?", "#94a3b8"]];
  const stamp = interpolate(frame, [f(1.6), f(1.9)], [2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Stars />
      <SerifTitle size={80}>Still experimental</SerifTitle>
      <div style={{ position: "absolute", top: 400, left: 110, right: 110, display: "flex", flexDirection: "column", gap: 34 }}>
        {steps.map(([d, t, ic, c], i) => (
          <PopIn key={d} delay={4 + i * 10} from="left" dist={200}>
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <div style={{ width: 90, height: 90, borderRadius: 45, background: c, color: "#111", fontFamily: INTER, fontWeight: 900, fontSize: 46, display: "flex", alignItems: "center", justifyContent: "center" }}>{ic}</div>
              <div>
                <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 34, color: c }}>{d}</div>
                <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 42, color: "#fff" }}>{t}</div>
              </div>
            </div>
          </PopIn>
        ))}
      </div>
      {frame > f(1.6) && (
        <div style={{ position: "absolute", top: 1010, width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ transform: `rotate(-6deg) scale(${stamp})`, border: `6px solid ${C.amber}`, color: C.amber, fontFamily: SERIF, fontStyle: "italic", fontWeight: 800, fontSize: 70, padding: "6px 30px", borderRadius: 14 }}>fascinating idea</div>
        </div>
      )}
      <Credit text="Plans per blog.google / The Next Web" top={TOP_H - 70} />
    </AbsoluteFill>
  );
};

const Poll: React.FC = () => {
  const frame = useCurrentFrame();
  const g = interpolate(frame, [f(1.8), f(2.6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const u = interpolate(frame, [f(2.9), f(3.7)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Clip src="b/n_earthmoon.mp4" pos="78% 35%" durFrames={140} kenBurns={0.05} style={{ width: 1080, height: TOP_H, filter: "brightness(0.4) blur(2px)" }} />
      <SerifTitle size={84}>Genius… or<br />completely unnecessary?</SerifTitle>
      <div style={{ position: "absolute", top: 520, left: 110, right: 110, display: "flex", flexDirection: "column", gap: 34 }}>
        {[["🚀  Genius", g, C.amber], ["🙄  Unnecessary", u, "#94a3b8"]].map(([t, p, c]) => (
          <div key={t as string} style={{ height: 130, borderRadius: 26, background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.25)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, width: `${(p as number) * 100}%`, background: c as string, opacity: 0.85 }} />
            <div style={{ position: "absolute", left: 30, top: 0, bottom: 0, display: "flex", alignItems: "center", fontFamily: INTER, fontWeight: 800, fontSize: 52, color: "#fff" }}>{t as string}</div>
            <div style={{ position: "absolute", right: 30, top: 0, bottom: 0, display: "flex", alignItems: "center", fontFamily: INTER, fontWeight: 800, fontSize: 52, color: "#fff" }}>?</div>
          </div>
        ))}
      </div>
      <Credit text={NASA} top={TOP_H - 70} />
    </AbsoluteFill>
  );
};

const Engage: React.FC = () => {
  const frame = useCurrentFrame();
  const heart = frame >= f(1.6);
  const hs = heart ? interpolate(frame - f(1.6), [0, 6, 12], [0.6, 1.35, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill>
      <Clip src="b/n_moonrise.mp4" pos="78% 35%" durFrames={160} kenBurns={0.06} style={{ width: 1080, height: TOP_H, filter: "brightness(0.55)" }} />
      <div style={{ position: "absolute", top: 260, left: 90, right: 90 }}>
        <PopIn from="up">
          <div style={{ background: "#fff", borderRadius: 30, padding: 30, display: "flex", gap: 22 }}>
            <div style={{ width: 76, height: 76, borderRadius: 38, background: C.sage, flexShrink: 0 }} />
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 40, color: "#111" }}><Typewriter text="Honestly? Genius, because…" delay={8} cps={16} caretColor={C.sage} /></div>
          </div>
        </PopIn>
      </div>
      <div style={{ position: "absolute", top: 640, width: "100%", display: "flex", justifyContent: "center", gap: 60 }}>
        <div style={{ width: 220, height: 220, borderRadius: 110, background: heart ? "#ff2d55" : "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120, transform: `scale(${hs})` }}>♥</div>
      </div>
      <SerifTitle size={70} top={980}>More space × AI discoveries</SerifTitle>
      <Credit text={NASA} top={TOP_H - 70} />
    </AbsoluteFill>
  );
};

const End: React.FC = () => (
  <AbsoluteFill>
    <Clip src="b/n_earthmoon.mp4" pos="78% 35%" startFrom={2} durFrames={140} kenBurns={0.08} style={{ width: 1080, height: TOP_H, filter: "brightness(0.5)" }} />
    <div style={{ position: "absolute", top: 330, width: "100%", display: "flex", justifyContent: "center" }}>
      <PopIn from="up"><SubscribeCard clickAt={f(1.2)} dark accent={C.sage} sub="The biggest AI updates, explained simply" /></PopIn>
    </div>
    <Cursor path={[[0, 900, 1100], [f(1.0), 560, 760], [f(1.6), 580, 770]]} clicks={[f(1.2)]} color="#fff" />
    <Credit text={NASA} top={TOP_H - 70} />
  </AbsoluteFill>
);

const SCENES: { a: number; b: number; body: React.FC }[] = [
  { a: 0, b: 3.75, body: Open },
  { a: 3.75, b: 7.45, body: Launch },
  { a: 7.45, b: 13.91, body: Uplink },
  { a: 13.91, b: 17.07, body: PromptCard },
  { a: 17.07, b: 21.6, body: Haiku },
  { a: 21.6, b: 25.8, body: Constellation },
  { a: 25.8, b: 28.45, body: Article },
  { a: 28.45, b: 32.27, body: Roadmap },
  { a: 32.27, b: 36.7, body: Poll },
  { a: 36.7, b: 42.0, body: Engage },
  { a: 42.0, b: D.duration, body: End },
];

const chunks = chunkWords(D.words, 4, 22);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t >= 17.07 && t < 21.0) return null; // haiku on screen
  const c = activeChunk(chunks, t);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", top: TOP_H - 190, left: 50, right: 50, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 16px" }}>
      {c.words.map((w, i) => (
        <span key={i} style={{ fontFamily: INTER, fontWeight: 800, fontSize: 60, color: t >= w.s - 0.03 ? (i === c.words.map((x) => t >= x.s - 0.03).lastIndexOf(true) ? C.amber : "#fff") : "rgba(255,255,255,0.55)", textShadow: "0 4px 24px rgba(0,0,0,0.85)" }}>
          {w.w.replace(/[,.]$/, "")}
        </span>
      ))}
    </div>
  );
};

export const Reel3: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0, "impact", 0.5], [0.15, "whoosh", 0.35], [2.52, "impact", 0.6], [3.75, "whoosh"], [3.9, "pop", 0.3], [4.1, "pop", 0.3], [5.75, "whoosh"], [6.0, "shutter", 0.3],
    [7.45, "riser", 0.35], [8.85, "uplink", 0.4], [11.45, "pop"], [13.91, "whoosh"], [14.2, "uplink", 0.4], [14.9, "typing", 0.35], [16.0, "typing", 0.3],
    [17.07, "impact", 0.45], [17.4, "uplink", 0.35], [17.6, "typing", 0.2], [18.75, "typing", 0.2], [19.9, "typing", 0.2], [21.6, "whoosh"], [22.0, "blip", 0.2], [22.3, "blip", 0.2], [22.6, "blip", 0.2],
    [25.8, "swish"], [26.2, "shutter", 0.35], [28.45, "whoosh"], [28.6, "pop"], [28.9, "pop"], [29.2, "pop"], [30.1, "impact", 0.45],
    [32.27, "whoosh"], [34.1, "pop"], [35.2, "pop"], [36.7, "swish"], [38.3, "pop", 0.6], [38.3, "ding", 0.25], [42.0, "whoosh"], [43.2, "click", 0.6], [43.25, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: C.navy }}>
      {SCENES.map((s, i) => {
        const from = f(s.a);
        const Body = s.body;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, f(s.b) - from)}>
            <AbsoluteFill style={{ height: TOP_H, overflow: "hidden" }}><Body /></AbsoluteFill>
          </Sequence>
        );
      })}
      <div style={{ position: "absolute", top: TOP_H, left: 0, right: 0, height: 6, background: C.amber, zIndex: 5 }} />
      <Aroll data={D} src="r/r3_aroll.mp4" box={{ x: 0, y: TOP_H + 6, w: 1080, h: 1920 - TOP_H - 6 }} focusY={820} zoom={1.0} />
      <Captions />
      <Audio src={staticFile("r/r3_aroll.mp4")} />
      <Music src="r/r3_music.wav" total={D.duration} base={0.18} boosts={[[17.07, 21.0, 0.32]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

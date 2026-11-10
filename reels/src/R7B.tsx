import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, OffthreadVideo, Img, Easing } from "remotion";
import data from "../public/r/r7f_words.json";
import { Aroll, Cursor, f, FPS, INTER, MONO, SERIF, Music, PopIn, ReelData, Sfx, SubscribeCard, Typewriter, chunkWords, activeChunk } from "./lib";
import { C, FACE_Y, TOP, Canvas, Robot, Chip, Site, Node } from "./R7";

/* Reel 7 v3: Tripo Agentic Canvas, built around 11 effects:
   dot-reveal, backdrop-word, digital-zoom, reject-stamp, rabbit-hole, claude-ui, the-bill,
   giant-captions, shortcut-rain, shadow-puppet, tier-list. */
const D = data as ReelData;
const END = D.duration + 0.8;
export const R7B_FRAMES = Math.ceil(END * FPS);
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* full uncropped footage, offset = scene start frame */
const FullFace: React.FC<{ offset: number; style?: React.CSSProperties }> = ({ offset }) => (
  <Aroll data={D} src="r/r7f_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={960} zoom={1} alternate={false} offset={offset} />
);

/* 1 · /dot-reveal: halftone dots shrink away to reveal the drawing */
const DotReveal: React.FC<{ at: number; dur?: number; w: number; h: number; color: string; cell?: number }> = ({ at, dur = 22, w, h, color, cell = 46 }) => {
  const frame = useCurrentFrame();
  const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
  const maxD = Math.hypot(w / 2, h / 2);
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = c * cell, y = r * cell, d = Math.hypot(x - w / 2, y - h / 2) / maxD;
    const p = interpolate(frame, [at + d * dur * 0.7, at + d * dur * 0.7 + dur * 0.5], [1, 0], clamp);
    if (p <= 0.01) continue;
    dots.push(<circle key={`${r}-${c}`} cx={x} cy={y} r={cell * 0.75 * p} fill={color} />);
  }
  return <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>{dots}</svg>;
};

/* 5 · /rabbit-hole: nested screens, the camera dives through each */
const RabbitHole: React.FC<{ imgs: string[]; dur: number }> = ({ imgs, dur }) => {
  const frame = useCurrentFrame();
  const W = 1000, H = 640, K = 4.2; // each inner screen is 1/K the size
  const depth = interpolate(frame, [6, dur], [0, imgs.length - 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const scale = Math.pow(K, depth);
  const layer = (i: number): React.ReactNode => (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, borderRadius: 18 / Math.pow(K, i), overflow: "hidden", background: "#0B0B0F", boxShadow: i ? "0 0 0 6px #FF6A2B" : undefined }}>
      <Img src={staticFile(imgs[i])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {i < imgs.length - 1 && (
        <div style={{ position: "absolute", left: (W - W / K) / 2, top: (H - H / K) / 2, width: W / K, height: H / K, transform: `scale(${1 / K})`, transformOrigin: "0 0" }}>
          <div style={{ width: W, height: H, transform: `scale(${1})` }}>{layer(i + 1)}</div>
        </div>
      )}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 40, top: TOP + 20, width: W, height: H, overflow: "hidden", borderRadius: 22, boxShadow: "0 30px 60px rgba(0,0,0,0.25)" }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "50% 50%" }}>{layer(0)}</div>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${0.15 + 0.25 * Math.abs(Math.sin(depth * Math.PI))}) 100%)` }} />
    </div>
  );
};

/* ---------- scenes (local frames) ---------- */
const S = {
  /* 1 · dot-reveal */
  dots: () => (
    <Canvas>
      <div style={{ position: "absolute", left: 290, top: TOP + 30, width: 500, height: 640, background: "#fff", borderRadius: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.12)", transform: "rotate(-2deg)", overflow: "hidden", backgroundImage: "repeating-linear-gradient(0deg, transparent 0 38px, rgba(59,130,246,0.15) 38px 40px)" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Robot stage="sketch" size={380} /></div>
        <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 34, color: C.mute }}>my drawing ✏️</div>
        <DotReveal at={f(0.9)} dur={24} w={500} h={640} color={C.orange} />
      </div>
    </Canvas>
  ),
  /* 2 · backdrop-word: giant "3D" behind the cut-out presenter */
  backdrop: () => {
    const frame = useCurrentFrame();
    const s = interpolate(frame, [f(0.25), f(0.6)], [1.6, 1], { ...clamp, easing: ease });
    const o = interpolate(frame, [f(0.25), f(0.45)], [0, 1], clamp);
    return (
      <AbsoluteFill>
        <FullFace offset={f(2.5)} />
        <AbsoluteFill style={{ background: "rgba(10,10,14,0.45)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 640, lineHeight: 1, letterSpacing: -50, color: C.orange, opacity: o, transform: `scale(${s})`, textShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>3D</div>
        <OffthreadVideo src={staticFile("r/r7_cut_a.webm")} transparent muted startFrom={6} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
        <PopIn delay={f(1.9)} style={{ position: "absolute", left: 0, right: 0, top: 1330, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "#fff", color: C.ink, fontFamily: INTER, fontWeight: 900, fontSize: 60, padding: "12px 34px", borderRadius: 999 }}>🎮 game character</div>
        </PopIn>
      </AbsoluteFill>
    );
  },
  /* 3 · digital-zoom: stepped, crunchy punch-ins with a camera HUD */
  zoom: () => {
    const frame = useCurrentFrame();
    const steps = [0, 9, 18];
    const lvl = steps.filter((s) => frame >= s).length - 1;
    const z = [1.0, 1.45, 2.0][lvl];
    const since = frame - steps[lvl];
    const crunch = since < 4 ? 1 : 0;
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 44%", filter: crunch ? "contrast(1.6) saturate(1.6) blur(1.5px)" : undefined }}>
          <FullFace offset={f(5.4)} />
        </AbsoluteFill>
        {crunch === 1 && (
          <>
            <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 3px, transparent 3px 7px)" }} />
            <AbsoluteFill style={{ mixBlendMode: "screen", background: "linear-gradient(90deg, rgba(255,0,0,0.18), rgba(0,255,255,0.18))", transform: "translateX(14px)" }} />
          </>
        )}
        {[[60, 260, "0 0"], [960, 260, "90deg"], [60, 1560, "-90deg"], [960, 1560, "180deg"]].map(([x, y, r], i) => (
          <div key={i} style={{ position: "absolute", left: x as number, top: y as number, width: 70, height: 70, borderTop: "8px solid #fff", borderLeft: "8px solid #fff", transform: `rotate(${r === "0 0" ? "0deg" : r})` }} />
        ))}
        <div style={{ position: "absolute", left: 70, top: 1680, fontFamily: MONO, fontWeight: 800, fontSize: 40, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "6px 16px", borderRadius: 10 }}>● REC  ZOOM {z.toFixed(1)}x</div>
      </AbsoluteFill>
    );
  },
  intro: () => (
    <Canvas><Site img="img/tripo_hero.png" srcH={1560} boxes={[{ x: 120, y: 520, w: 960, h: 180, at: f(8.5 - 6.5), label: "NEW" }]} /></Canvas>
  ),
  /* 4 · reject-stamp */
  reject: () => {
    const frame = useCurrentFrame();
    const at = f(11.5 - 9.3);
    const s = interpolate(frame, [at, at + 5], [3.2, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    const shake = frame >= at + 5 && frame < at + 11 ? Math.sin(frame * 4) * 10 : 0;
    return (
      <Canvas>
        <div style={{ position: "absolute", left: 0, right: 0, top: TOP + 200, display: "flex", justifyContent: "center", transform: `translateX(${shake}px)` }}>
          <PopIn delay={f(0.4)}>
            <div style={{ transform: "scale(1.5)", opacity: frame >= at + 5 ? 0.55 : 1 }}><Node icon="🧊" title="Just one 3D object" state="done" w={600} /></div>
          </PopIn>
        </div>
        {frame >= at && (
          <div style={{ position: "absolute", left: 0, right: 0, top: TOP + 330, display: "flex", justifyContent: "center" }}>
            <div style={{ transform: `rotate(-12deg) scale(${s})`, border: "14px solid #DC2626", color: "#DC2626", borderRadius: 26, padding: "10px 46px", fontFamily: INTER, fontWeight: 900, fontSize: 150, letterSpacing: 6, background: "rgba(254,226,226,0.6)", maskImage: "repeating-radial-gradient(circle at 30% 40%, #000 0 6px, rgba(0,0,0,0.75) 7px 9px)" }}>REJECTED</div>
          </div>
        )}
      </Canvas>
    );
  },
  /* 5 · rabbit-hole into Tripo's workflow screens */
  hole: () => (
    <Canvas>
      <RabbitHole imgs={["img/tripo_hero.png", "img/tripo_steps.png", "img/tripo_nodes.png"]} dur={f(2.1)} />
      <div style={{ position: "absolute", right: 50, top: TOP + 670, fontFamily: INTER, fontWeight: 600, fontSize: 20, color: C.mute }}>Source: tripo3d.ai</div>
      <Chip top={TOP + 720} delay={f(1.0)} bg={C.orange}>the ENTIRE workflow</Chip>
    </Canvas>
  ),
  /* 6 · claude-ui: an AI chat where the robot drawing gets uploaded */
  chat: () => {
    const frame = useCurrentFrame();
    const sent = f(1.25);
    return (
      <AbsoluteFill style={{ background: "#F5F0E8" }}>
        <div style={{ position: "absolute", left: 50, right: 50, top: TOP - 10, height: 820, background: "#FAF8F3", borderRadius: 28, border: "2px solid #E7E1D6", boxShadow: "0 20px 50px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ height: 70, borderBottom: "2px solid #E7E1D6", display: "flex", alignItems: "center", padding: "0 26px", gap: 12, fontFamily: SERIF, fontSize: 32, color: "#3D3929" }}>
            <span style={{ color: "#D97757", fontSize: 38 }}>✳</span> New chat · 3D character
          </div>
          {frame >= sent && (
            <PopIn from="up" style={{ position: "absolute", right: 28, top: 100 }}>
              <div style={{ background: "#EDE7DC", borderRadius: 22, padding: "16px 22px", maxWidth: 640 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 120, height: 150, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}><Robot stage="sketch" size={110} /></div>
                  <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 32, color: "#3D3929", lineHeight: 1.3 }}>Turn my robot drawing into a 3D game character</div>
                </div>
              </div>
            </PopIn>
          )}
          {frame >= sent + 14 && (
            <PopIn from="up" style={{ position: "absolute", left: 28, right: 60, top: 330 }}>
              <div style={{ fontFamily: SERIF, fontSize: 34, color: "#3D3929", lineHeight: 1.45 }}>
                <span style={{ color: "#D97757" }}>✳ </span><Typewriter text="On it. Plan: 3D model → textures → geometry → rig for animation." delay={0} cps={30} caretColor="#D97757" />
              </div>
            </PopIn>
          )}
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 22, background: "#fff", borderRadius: 22, border: "2px solid #E7E1D6", padding: "14px 18px" }}>
            {frame < sent && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <PopIn delay={f(0.2)}><div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F5F0E8", borderRadius: 12, padding: "6px 12px", fontFamily: MONO, fontSize: 24, color: "#3D3929" }}>🖼 robot.png <span style={{ color: "#16A34A" }}>✓</span></div></PopIn>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: INTER, fontSize: 28, color: "#9C9686" }}>{frame < sent ? "Turn my robot drawing into a 3D…" : "Reply…"}</div>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: "#D97757", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, transform: `scale(${frame >= sent - 3 && frame < sent + 3 ? 0.85 : 1})` }}>↑</div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", right: 60, top: TOP + 818, fontFamily: INTER, fontWeight: 600, fontSize: 20, color: C.mute }}>illustration</div>
      </AbsoluteFill>
    );
  },
  /* 7 · the-bill: a receipt prints each step as it's said */
  bill: () => {
    const frame = useCurrentFrame();
    const L = (t: number) => f(t - 16.4);
    const items: [string, number][] = [["Plan the steps", 16.98], ["3D model", 17.86], ["Textures", 19.26], ["Geometry", 20.08], ["Rig for animation", 21.36]];
    const shown = items.filter(([, t]) => frame >= L(t)).length;
    const total = frame >= L(22.1);
    const paper = 170 + shown * 74 + (total ? 150 : 0);
    const stage = shown >= 5 ? "rig" : shown >= 3 ? "tex" : shown >= 2 ? "mesh" : "sketch";
    return (
      <Canvas>
        <div style={{ position: "absolute", left: 40, top: TOP, width: 560, height: 40, background: "#2A2A2E", borderRadius: 14 }} />
        <div style={{ position: "absolute", left: 60, top: TOP + 24, width: 520, height: Math.min(paper, 820), overflow: "hidden", transition: "none" }}>
          <div style={{ background: "#FFFEFA", padding: "26px 30px 40px", fontFamily: MONO, color: C.ink, boxShadow: "0 16px 30px rgba(0,0,0,0.12)", clipPath: "polygon(0 0,100% 0,100% calc(100% - 14px),95% 100%,90% calc(100% - 14px),85% 100%,80% calc(100% - 14px),75% 100%,70% calc(100% - 14px),65% 100%,60% calc(100% - 14px),55% 100%,50% calc(100% - 14px),45% 100%,40% calc(100% - 14px),35% 100%,30% calc(100% - 14px),25% 100%,20% calc(100% - 14px),15% 100%,10% calc(100% - 14px),5% 100%,0 calc(100% - 14px))" }}>
            <div style={{ textAlign: "center", fontWeight: 800, fontSize: 30 }}>AGENTIC CANVAS</div>
            <div style={{ textAlign: "center", fontSize: 20, color: C.mute }}>order #3D-001 · 1 drawing</div>
            <div style={{ borderTop: "3px dashed #999", margin: "16px 0" }} />
            {items.slice(0, shown).map(([n]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: 30, fontWeight: 700, height: 74, alignItems: "center" }}><span>{n}</span><span style={{ color: C.teal }}>✓ AI</span></div>
            ))}
            {total && (
              <>
                <div style={{ borderTop: "3px dashed #999", margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 36, fontWeight: 900 }}><span>TOTAL</span><span style={{ color: C.orange }}>1 drawing</span></div>
              </>
            )}
          </div>
        </div>
        <div style={{ position: "absolute", left: 620, top: TOP + 60, width: 420, height: 640, borderRadius: 28, background: "linear-gradient(160deg,#fff,#ECE8DF)", border: `3px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Robot stage={stage} size={300} wave={stage === "rig"} />
        </div>
      </Canvas>
    );
  },
  /* 8 · giant-captions */
  giant: () => {
    const frame = useCurrentFrame();
    const t = 22.8 + frame / FPS;
    const ws: [string, number, string][] = [["AND THE", 22.86, "#fff"], ["INTERESTING", 23.18, C.yellow], ["PART", 23.54, "#fff"], ["IS…", 23.84, C.orange]];
    const cur = ws.filter(([, s]) => t >= s - 0.03);
    return (
      <AbsoluteFill style={{ background: C.ink }}>
        <AbsoluteFill style={{ opacity: 0.35 }}><FullFace offset={f(22.8)} /></AbsoluteFill>
        <div style={{ position: "absolute", left: 30, right: 30, top: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {cur.map(([w, s, c], i) => {
            const p = interpolate(t - s, [0, 0.12], [1.5, 1], clamp);
            const size = w.length > 8 ? 150 : 250;
            return <div key={w} style={{ fontFamily: INTER, fontWeight: 900, fontSize: size, lineHeight: 0.95, letterSpacing: -8, color: c, transform: `scale(${p})`, opacity: i === cur.length - 1 ? 1 : 0.85 }}>{w}</div>;
          })}
        </div>
      </AbsoluteFill>
    );
  },
  /* 9 · shortcut-rain over the "review the plan" step */
  rain: () => {
    const frame = useCurrentFrame();
    const keys = ["⌘Z", "⌘Z", "Ctrl+Z", "⌘Z", "↻", "⌘Z", "Ctrl+Z", "⌘Z", "↻", "⌘Z", "⌘Z", "Ctrl+Z"];
    const cross = frame >= f(27.06 - 24.35);
    return (
      <Canvas>
        <Site img="img/tripo_steps.png" srcH={1500} boxes={[{ x: 0, y: 740, w: 680, h: 180, at: f(0.5), color: C.violet, label: "change just this step" }]} />
        {keys.map((k, i) => {
          const start = f(1.2) + i * 4;
          if (frame < start) return null;
          const y = TOP - 120 + (frame - start) * 22;
          const x = 60 + ((i * 263) % 900);
          return (
            <div key={i} style={{ position: "absolute", left: x, top: Math.min(y, TOP + 640 + (i % 3) * 30), transform: `rotate(${((i * 37) % 30) - 15}deg)`, background: "#fff", border: "3px solid #D4D4D8", borderBottomWidth: 9, borderRadius: 18, padding: "10px 20px", fontFamily: INTER, fontWeight: 800, fontSize: 40, color: C.ink, opacity: cross ? 0.35 : 1, boxShadow: "0 8px 16px rgba(0,0,0,0.15)" }}>{k}</div>
          );
        })}
        {cross && <Chip top={TOP + 420} bg="#DC2626" size={54}>✕ no starting over</Chip>}
      </Canvas>
    );
  },
  /* 10 · shadow-puppet: presenter + a dragon cast as shadows on a lit wall */
  shadow: () => {
    const frame = useCurrentFrame();
    const fly = Math.sin(frame / 6) * 18;
    return (
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 55% 40%, #FFE7B8 0%, #E3B873 45%, #6B4A22 100%)" }}>
        <OffthreadVideo src={staticFile("r/r7_cut_b.webm")} transparent muted startFrom={6} style={{ position: "absolute", left: 160, top: -40, width: 1080, height: 1920, filter: "brightness(0) blur(6px)", opacity: 0.55, transform: "scale(1.08)" }} />
        <div style={{ position: "absolute", left: 640, top: 380 + fly, fontSize: 340, filter: "brightness(0) blur(3px)", opacity: 0.6, transform: "scaleX(-1) rotate(-8deg)" }}>🐉</div>
        <OffthreadVideo src={staticFile("r/r7_cut_b.webm")} transparent muted startFrom={6} style={{ position: "absolute", left: -120, top: 180, width: 1080 * 0.95, height: 1920 * 0.95 }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
      </AbsoluteFill>
    );
  },
  /* 11 · tier-list for the vote */
  tier: () => {
    const frame = useCurrentFrame();
    const L = (t: number) => f(t - 29.8);
    const tiers: [string, string][] = [["S", "#EF4444"], ["A", "#F97316"], ["B", "#FACC15"]];
    const items: [string, string, number][] = [["🤖", "Robot", 30.28], ["🐉", "Dragon", 30.78], ["🦸", "Superhero", 31.3]];
    const exp = frame >= L(32.06);
    return (
      <Canvas>
        <div style={{ position: "absolute", left: 40, right: 40, top: TOP + 10, display: "flex", flexDirection: "column", gap: 10 }}>
          {tiers.map(([t, c], i) => (
            <div key={t} style={{ display: "flex", height: 150, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 18px rgba(0,0,0,0.08)" }}>
              <div style={{ width: 150, background: c, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 900, fontSize: 90, color: "#111" }}>{t}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 24px", fontFamily: INTER, fontWeight: 800, fontSize: 34, color: C.mute }}>
                {i === 0 ? (exp ? <PopIn><span style={{ color: C.ink }}>🧪 winner → real 3D experiment</span></PopIn> : "your vote decides…") : ""}
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 40, right: 40, top: TOP + 500, height: 230, background: "rgba(17,24,39,0.06)", border: `3px dashed ${C.line}`, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
          {items.map(([e, n, t]) => (
            <PopIn key={n} delay={L(t)} from="down" dist={200}>
              <div style={{ width: 260, height: 190, background: "#fff", borderRadius: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.12)" }}>
                <div style={{ fontSize: 100 }}>{e}</div>
                <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 36, color: C.ink }}>{n}</div>
              </div>
            </PopIn>
          ))}
        </div>
        <div style={{ position: "absolute", left: 60, top: TOP + 474, fontFamily: MONO, fontWeight: 800, fontSize: 24, color: C.mute }}>💬 COMMENT YOUR PICK</div>
      </Canvas>
    );
  },
  subscribe: () => (
    <Canvas>
      <div style={{ position: "absolute", top: TOP + 40, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <PopIn from="up"><SubscribeCard clickAt={f(1.0)} accent="#EF4444" sub="Real AI experiments" avatarSrc="img/ch_BEp74aewRSA.jpg" /></PopIn>
      </div>
      <Cursor path={[[0, 900, 1250], [f(0.7), 560, 890], [f(1.4), 580, 900]]} clicks={[f(1.0)]} color={C.ink} />
      <Chip top={TOP + 580} delay={f(3.2)} bg={C.ink}>worth using? 👀 find out</Chip>
    </Canvas>
  ),
};

type Mode = "split" | "full";
type Scene = { a: number; b: number; body: React.FC; mode: Mode; caps?: "top" | "none" };
const SCENES: Scene[] = [
  { a: 0.0, b: 2.5, body: S.dots, mode: "split" },
  { a: 2.5, b: 5.4, body: S.backdrop, mode: "full" },
  { a: 5.4, b: 6.5, body: S.zoom, mode: "full" },
  { a: 6.5, b: 9.3, body: S.intro, mode: "split" },
  { a: 9.3, b: 12.0, body: S.reject, mode: "split" },
  { a: 12.0, b: 14.2, body: S.hole, mode: "split" },
  { a: 14.2, b: 16.4, body: S.chat, mode: "split" },
  { a: 16.4, b: 22.8, body: S.bill, mode: "split" },
  { a: 22.8, b: 24.35, body: S.giant, mode: "full", caps: "none" },
  { a: 24.35, b: 28.0, body: S.rain, mode: "split" },
  { a: 28.0, b: 29.8, body: S.shadow, mode: "full" },
  { a: 29.8, b: 34.6, body: S.tier, mode: "split" },
  { a: 34.6, b: END, body: S.subscribe, mode: "split" },
];

const chunks = chunkWords(D.words, 3, 18);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const sc = SCENES.find((s) => t >= s.a && t < s.b);
  if (sc?.caps === "none") return null;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const full = sc?.mode === "full";
  return (
    <div style={{ position: "absolute", top: full ? 170 : 120, left: 40, right: 40, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const hot = /^(Tripo|Agentic|Canvas|3D|robot|dragon|superhero|textures|geometry|animation|workflow)/i.test(w.w);
        return (
          <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 84, letterSpacing: -2, color: on ? (hot ? C.orange : full ? "#fff" : C.ink) : full ? "rgba(255,255,255,0.45)" : "rgba(17,24,39,0.28)", textShadow: full ? "0 4px 18px rgba(0,0,0,0.8)" : "0 2px 0 rgba(255,255,255,0.8)" }}>
            {w.w.replace(/[,.?]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

export const Reel7B: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.0, "swish", 0.3], [0.9, "shutter", 0.3], [2.5, "impact", 0.45], [2.75, "whoosh", 0.35], [4.4, "pop"],
    [5.4, "glitch", 0.4], [5.7, "glitch", 0.4], [6.0, "glitch", 0.4], [6.5, "whoosh", 0.3], [8.5, "pop"],
    [9.3, "swish", 0.3], [11.5, "impact", 0.55], [12.0, "whoosh", 0.35], [12.6, "riser", 0.3],
    [14.2, "swish", 0.3], [15.45, "click", 0.5], [15.9, "typing", 0.35], [16.4, "swish", 0.3],
    [16.98, "blip", 0.35], [17.86, "blip", 0.35], [19.26, "blip", 0.35], [20.08, "blip", 0.35], [21.36, "blip", 0.35], [22.1, "ding", 0.3],
    [22.8, "impact", 0.4], [23.18, "impact", 0.35], [23.54, "impact", 0.35], [24.35, "whoosh", 0.3], [25.5, "click", 0.4], [25.8, "click", 0.4], [26.1, "click", 0.4], [27.1, "impact", 0.4],
    [28.0, "whoosh", 0.3], [29.8, "swish", 0.3], [30.28, "pop"], [30.78, "pop"], [31.3, "pop"], [32.06, "ding", 0.25],
    [34.6, "whoosh", 0.3], [35.6, "click", 0.6], [35.66, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {SCENES.map((s, i) => {
        const from = f(s.a);
        const Body = s.body;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, f(s.b) - from)}>
            <Body />
            {s.mode === "split" && (
              <>
                <Aroll data={D} src="r/r7f_aroll.mp4" box={{ x: 0, y: FACE_Y, w: 1080, h: 1920 - FACE_Y }} focusY={760} zoom={1.0} offset={from} />
                <div style={{ position: "absolute", left: 0, right: 0, top: FACE_Y - 4, height: 8, background: `linear-gradient(90deg, ${C.orange}, ${C.violet})` }} />
              </>
            )}
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("r/r7f_aroll.mp4")} />
      <Music src="r/r7_music.wav" total={END} base={0.12} boosts={[]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

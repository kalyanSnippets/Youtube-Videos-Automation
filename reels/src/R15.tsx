import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, Img } from "remotion";
import data from "../public/r/r15_words.json";
import face from "../public/r/r15f_face.json";
import { f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, chunkWords, activeChunk } from "./lib";
import { K, ease, clamp, Screen3D, FaceTrack } from "./split";

/* Reel 15: GitHub Goldmine #1, Immich (self-hosted photo library with AI search).
   Style A (approved): relatable problem -> real POV phone demo -> HUD callouts, snap zooms, yellow-highlight captions,
   steady beat with subtle UI clicks, comment CTA. Demo footage is the official public Immich demo (demo.immich.app),
   recorded in a phone-sized browser: real timeline scrolling, a real "beach with red umbrella" context search, the real People page.
   Facts on screen checked 2026-11-25 on github.com/immich-app/immich: "High performance self-hosted photo and video management
   solution", ~120k stars, AGPL-3.0. Times = seconds on the final cut. */
const D = data as unknown as ReelData;
const FT = face as FaceTrack & { cx: number[] };
const BASE = "r/r15fx_aroll.mp4";
const OUTRO = 3.0;
const END = D.duration + OUTRO;
export const R15_FRAMES = Math.ceil(END * FPS);
const Y = "#FFE14D", CY = "#5CF2FF";

const faceAt = (t: number) => { const i = Math.max(0, FT.t.findIndex((x) => x > t) - 1); return { cx: FT.cx?.[i] ?? 540, cy: FT.cy[i] }; };

/* HUD tag: mono label inside corner brackets, slides in */
const Hud: React.FC<{ at: number; x?: number; y: number; color?: string; size?: number; children: React.ReactNode; center?: boolean; out?: number }> = ({ at, x = 50, y, color = CY, size = 40, children, center, out }) => {
  const frame = useCurrentFrame();
  if (frame < at || (out !== undefined && frame >= out)) return null;
  const k = interpolate(frame - at, [0, 7], [0, 1], { ...clamp, easing: ease });
  const b = 22;
  const br = (s: React.CSSProperties) => <div style={{ position: "absolute", width: b, height: b, borderColor: color, borderStyle: "solid", borderWidth: 0, ...s }} />;
  const body = (
    <div style={{ position: "relative", padding: "14px 24px", background: "rgba(6,10,18,0.72)", backdropFilter: "blur(6px)", opacity: k, transform: `translateX(${(1 - k) * -40}px)` }}>
      {br({ left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4 })}{br({ right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4 })}
      {br({ left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4 })}{br({ right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4 })}
      <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: size, color: "#fff", letterSpacing: 1, whiteSpace: "nowrap" }}>{children}</div>
    </div>
  );
  return center ? <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>{body}</div> : <div style={{ position: "absolute", left: x, top: y }}>{body}</div>;
};

/* full-screen phone POV clip with a snap zoom on entry and a face picture-in-picture */
const Pov: React.FC<{ src: string; startFrom?: number; rate?: number; pos?: string; offset: number; children?: React.ReactNode; blur?: number }> = ({ src, startFrom = 0, rate = 1, pos = "50% 0%", offset, children, blur = 0 }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 7], [1.12, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const t = (frame + offset) / FPS; const fa = faceAt(t); const s = 0.42, size = 300;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, filter: blur ? `blur(${blur}px)` : undefined }}>
        <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35), transparent 20%, transparent 70%, rgba(0,0,0,0.55))" }} />
      {children}
    </AbsoluteFill>
  );
};
/* split: graphic on top, face below (for the GitHub page and the next-episode teaser) */
const Split: React.FC<{ offset: number; children: React.ReactNode }> = ({ offset, children }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 7], [1.08, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const t = (frame + offset) / FPS; const s = 0.86, h = 960;
  let top = h * 0.5 - faceAt(t).cy * s; top = Math.min(0, Math.max(h - 1920 * s, top));
  return (
    <AbsoluteFill style={{ background: "#05080f" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 960, overflow: "hidden", background: "radial-gradient(ellipse at 50% 40%, #13233a, #05080f 75%)", transform: `scale(${z})` }}>{children}</div>
      <div style={{ position: "absolute", left: 0, top: 960, width: 1080, height: 960, overflow: "hidden", background: "#000" }}>
        <OffthreadVideo src={staticFile(BASE)} muted startFrom={offset} style={{ position: "absolute", left: (1080 - 1080 * s) / 2, top, width: 1080 * s, height: 1920 * s }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 957, height: 6, background: `linear-gradient(90deg, ${Y}, ${CY})` }} />
    </AbsoluteFill>
  );
};
const L = (abs: number, a: number) => f(abs) - f(a);

/* ---- beats (each clip shows what is being said) ---- */
const Thousands: React.FC<{ offset: number }> = ({ offset }) => (
  <Pov src="b/r15_calm.mp4" offset={offset}>
    <Hud at={L(2.5, 1.7)} y={250} color={Y}>📸 THOUSANDS OF PHOTOS</Hud>
  </Pov>
);
const BackInTime: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const a = 5.4;
  return (
    <Pov src="b/r15_back.mp4" startFrom={f(1.1)} offset={offset}>
      <Hud at={L(5.5, a)} y={250}>⏪ THAT ONE PICTURE…</Hud>
      {frame >= L(7.5, a) && <Hud at={L(7.5, a)} y={370} color={Y} size={52}>📅 2–3 YEARS AGO</Hud>}
    </Pov>
  );
};
const Memory: React.FC = () => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 60], [1.0, 1.12], clamp);
  const k = interpolate(frame, [0, 9], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ background: "#0b1220" }}>
      <AbsoluteFill><Img src={staticFile("img/r15_memory.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(30px) brightness(0.45)", transform: "scale(1.2)" }} /></AbsoluteFill>
      <div style={{ position: "absolute", left: 60, right: 60, top: 520, transform: `scale(${(0.9 + 0.1 * k) * z})`, opacity: k, borderRadius: 28, overflow: "hidden", border: `6px solid ${Y}`, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <Img src={staticFile("img/r15_memory.jpg")} style={{ width: "100%", display: "block" }} />
      </div>
      <Hud at={6} y={300} color="#34D399" size={44}>🧠 YOU REMEMBER: BEACH · RED UMBRELLA</Hud>
    </AbsoluteFill>
  );
};
const NoIdea: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const dates = ["MAR 2023", "AUG 2022", "JUL 2023", "DEC 2022", "MAY 2023", "OCT 2022"];
  return (
    <Pov src="b/r15_back.mp4" startFrom={f(0.2)} offset={offset} blur={3}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 120, color: "#fff", textShadow: "0 10px 40px rgba(0,0,0,0.8)" }}>{dates[Math.floor(frame / 6) % dates.length]}</div>
        <div style={{ fontSize: 160, marginTop: 10 }}>❓</div>
      </div>
      <Hud at={4} y={250} color="#FF5A5A" size={48}>⏱ WHEN DID I TAKE IT?</Hud>
    </Pov>
  );
};
const Scrolling: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const n = Math.floor(interpolate(frame, [0, 130], [12, 148], clamp));
  return (
    <Pov src="b/r15_scroll.mp4" startFrom={15} rate={1.3} offset={offset}>
      <Hud at={2} y={250} color="#FF5A5A" size={48}>SCROLLING… 😩</Hud>
      <Hud at={10} y={370}>SCROLL #{n}</Hud>
    </Pov>
  );
};
const Search: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const a = 18.6;
  return (
    <Pov src="b/r15_type.mp4" offset={offset}>
      <Hud at={L(18.72, a)} y={1150} color={CY}>✨ AI SEARCH: TYPE WHAT YOU REMEMBER</Hud>
      {frame >= L(23.9, a) && <Hud at={L(23.9, a)} y={1270} color="#34D399" size={52}>✓ FOUND IT</Hud>}
    </Pov>
  );
};
const GitHubP: React.FC = () => {
  const a = 24.6;
  return (
    <>
      <div style={{ position: "absolute", left: 40, top: 250 }}>
        <Screen3D src="b/r15_github.mp4" w={1000} url="github.com/immich-app/immich" rotY={-6} rotX={5} sway={3} glow={CY} />
      </div>
      <PopIn delay={L(28.0, a)} from="down" dist={40} style={{ position: "absolute", left: 50, top: 70, display: "flex", alignItems: "center", gap: 22 }}>
        <Img src={staticFile("img/immich_logo.png")} style={{ width: 120, height: 120 }} />
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 120, color: "#fff", letterSpacing: -4, textShadow: "0 10px 40px rgba(0,0,0,0.6)" }}>Immich</div>
      </PopIn>
      <Hud at={L(25.74, a)} x={640} y={110} color={Y}>⭐ ~120K STARS</Hud>
      <div style={{ position: "absolute", left: 40, bottom: 40, fontFamily: INTER, fontWeight: 700, fontSize: 24, color: "rgba(255,255,255,0.75)" }}>Source: github.com/immich-app/immich · checked 25 Nov 2026</div>
    </>
  );
};
const SelfHost: React.FC<{ offset: number }> = ({ offset }) => {
  const a = 29.05;
  return (
    <Pov src="b/r15_calm.mp4" startFrom={f(3)} offset={offset}>
      <Hud at={L(29.9, a)} y={250} color={Y}>📷 PHOTO + VIDEO LIBRARY</Hud>
      <Hud at={L(31.5, a)} y={370}>🏠 HOSTED ON YOUR OWN SERVER</Hud>
      <Hud at={L(33.4, a)} y={490} color="#34D399">≈ YOUR OWN GOOGLE PHOTOS</Hud>
    </Pov>
  );
};
const SearchDesc: React.FC<{ offset: number }> = ({ offset }) => (
  <Pov src="b/r15_type.mp4" startFrom={f(7)} offset={offset}>
    <Hud at={3} y={1150} color={CY}>🔍 SEARCH BY DESCRIPTIONS</Hud>
  </Pov>
);
const Faces: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, 50], [200, 1500], clamp);
  return (
    <Pov src="b/r15_people.mp4" offset={offset}>
      <div style={{ position: "absolute", left: 0, right: 0, top: sweep, height: 6, background: CY, boxShadow: `0 0 30px 10px ${CY}88` }} />
      <Hud at={4} y={1150} color={Y} size={44}>🧑 FACE RECOGNITION</Hud>
    </Pov>
  );
};

/* above-head overlays on full-face beats (the wall above his head is empty) */
const AboveHead: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>{children}</div>;
const NoDates: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 42.0;
  const item = (label: string, at: number) => {
    const k = interpolate(frame - L(at, a), [0, 8], [0, 1], { ...clamp, easing: ease });
    const st = interpolate(frame - L(at, a) - 10, [0, 6], [0, 1], clamp);
    return frame >= L(at, a) && (
      <div style={{ position: "relative", opacity: k, transform: `translateY(${(1 - k) * 30}px)` }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 44, color: K.ink, background: "#fff", padding: "12px 22px", borderRadius: 14, boxShadow: "0 14px 30px rgba(0,0,0,0.3)" }}>{label}</div>
        <div style={{ position: "absolute", left: -8, right: -8, top: "50%", height: 8, background: "#FF3B30", transform: `rotate(-4deg) scaleX(${st})`, transformOrigin: "0 50%" }} />
      </div>
    );
  };
  return <AboveHead>{item("📅 12/03/2023", 44.04)}{item("📁 IMG_4821.jpg", 44.7)}</AboveHead>;
};
const AiSearchTag: React.FC = () => <AboveHead><Hud at={L(36.8, 35.0)} y={0} center color={Y} size={56}>✨ AI SEARCH</Hud></AboveHead>;
const CatchTag: React.FC = () => <AboveHead><Hud at={6} y={0} center color="#FF5A5A" size={56}>⚠️ ONE CATCH</Hud></AboveHead>;
const InstallForget: React.FC = () => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [0, 8], [0, 1], { ...clamp, easing: ease });
  const st = interpolate(frame, [14, 22], [0, 1], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", opacity: k }}>
      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 92, color: "#111", letterSpacing: -3, background: "rgba(255,255,255,0.85)", padding: "6px 26px", borderRadius: 16 }}>INSTALL & FORGET</div>
        <div style={{ position: "absolute", left: -14, right: -14, top: "50%", height: 14, borderRadius: 7, background: "#FF3B30", transform: `rotate(-3deg) scaleX(${st})`, transformOrigin: "0 50%" }} />
      </div>
    </div>
  );
};
const AskTag: React.FC = () => <AboveHead><Hud at={8} y={0} center color={Y} size={44}>💬 WHAT PHOTO ARE YOU HUNTING FOR?</Hud></AboveHead>;
const Badge: React.FC = () => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [2, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <div style={{ position: "absolute", left: 40, top: 140, transform: `scale(${k})`, transformOrigin: "0 50%", display: "flex", alignItems: "center", gap: 0, boxShadow: "0 14px 34px rgba(0,0,0,0.35)" }}>
      <div style={{ background: "#111", color: Y, fontFamily: MONO, fontWeight: 800, fontSize: 36, padding: "12px 18px" }}>⛏ GITHUB GOLDMINE</div>
      <div style={{ background: Y, color: "#111", fontFamily: MONO, fontWeight: 900, fontSize: 36, padding: "12px 18px" }}>EP 1</div>
    </div>
  );
};
const NextEp: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 64.5;
  return (
    <>
      <PopIn delay={2} style={{ position: "absolute", left: 0, right: 0, top: 90, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex" }}>
          <div style={{ background: "#111", color: Y, fontFamily: MONO, fontWeight: 800, fontSize: 40, padding: "12px 20px", border: `3px solid ${Y}` }}>⛏ GITHUB GOLDMINE</div>
          <div style={{ background: Y, color: "#111", fontFamily: MONO, fontWeight: 900, fontSize: 40, padding: "12px 20px" }}>NEXT · EP 2</div>
        </div>
      </PopIn>
      <PopIn delay={10} from="up" style={{ position: "absolute", left: 90, right: 90, top: 270 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28, background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.18)", borderRadius: 28, padding: "34px 34px" }}>
          <div style={{ fontSize: 150, transform: `rotate(${Math.sin(frame / 12) * 4}deg)` }}>📄</div>
          <div>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 56, color: "#fff", lineHeight: 1.05 }}>Ask questions about <span style={{ color: Y }}>your own documents</span></div>
            <div style={{ marginTop: 14, display: "inline-block", background: "#fff", color: "#111", fontFamily: INTER, fontWeight: 800, fontSize: 34, padding: "10px 20px", borderRadius: "8px 22px 22px 22px" }}>💬 "What did my notes say about…?"</div>
          </div>
        </div>
      </PopIn>
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: MONO, fontWeight: 800, fontSize: 34, color: "rgba(255,255,255,0.8)", opacity: Math.floor(frame / 12) % 2 ? 1 : 0.4 }}>🔒 UNLOCKS NEXT EPISODE</div>
    </>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: ease });
  const fadeOut = interpolate(frame, [f(OUTRO) - 20, f(OUTRO)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #13233a, #05080f 75%)", opacity: k, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center", opacity: fadeOut, transform: `scale(${0.94 + 0.06 * k})` }}>
        <div style={{ display: "inline-flex", boxShadow: "0 14px 34px rgba(0,0,0,0.35)" }}>
          <div style={{ background: "#111", color: Y, fontFamily: MONO, fontWeight: 800, fontSize: 48, padding: "14px 22px", border: `3px solid ${Y}` }}>⛏ GITHUB GOLDMINE</div>
          <div style={{ background: Y, color: "#111", fontFamily: MONO, fontWeight: 900, fontSize: 48, padding: "14px 22px" }}>EP 1</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, marginTop: 60 }}>
          <Img src={staticFile("img/immich_logo.png")} style={{ width: 130, height: 130 }} />
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 130, color: "#fff", letterSpacing: -4 }}>Immich</div>
        </div>
        <div style={{ marginTop: 70, display: "inline-block", background: "#fff", color: "#111", fontFamily: INTER, fontWeight: 900, fontSize: 52, padding: "18px 34px", borderRadius: 999 }}>💬 Comment <span style={{ color: "#0a7cff" }}>PHOTO</span> for the link</div>
        <div style={{ marginTop: 30, fontFamily: INTER, fontWeight: 800, fontSize: 42, color: "rgba(255,255,255,0.85)" }}>Follow AI with Kalyan · EP 2 next</div>
      </div>
    </AbsoluteFill>
  );
};

type Seg = { a: number; b: number; pov?: (o: number) => React.ReactNode; split?: React.FC; over?: React.FC };
const SEGS: Seg[] = [
  { a: 0, b: 1.62, over: Badge },
  { a: 1.62, b: 5.4, pov: (o) => <Thousands offset={o} /> },
  { a: 5.4, b: 8.15, pov: (o) => <BackInTime offset={o} /> },
  { a: 8.15, b: 10.05, over: Memory },
  { a: 10.05, b: 12.35, pov: (o) => <NoIdea offset={o} /> },
  { a: 12.35, b: 17.0, pov: (o) => <Scrolling offset={o} /> },
  { a: 18.6, b: 24.55, pov: (o) => <Search offset={o} /> },
  { a: 24.6, b: 29.0, split: GitHubP },
  { a: 29.05, b: 34.7, pov: (o) => <SelfHost offset={o} /> },
  { a: 35.0, b: 37.9, over: AiSearchTag },
  { a: 37.95, b: 39.85, pov: (o) => <SearchDesc offset={o} /> },
  { a: 39.85, b: 41.9, pov: (o) => <Faces offset={o} /> },
  { a: 42.0, b: 45.5, over: NoDates },
  { a: 45.75, b: 47.4, over: CatchTag },
  { a: 51.8, b: 53.35, over: InstallForget },
  { a: 53.4, b: 56.4, over: AskTag },
  { a: 64.5, b: 69.75, split: NextEp },
  { a: 69.75, b: 1e9, over: Outro },
];
const SEGS_E = SEGS.map((x) => ({ ...x, b: Math.min(x.b, END) }));
const isPov = (t: number) => SEGS_E.some((s) => s.pov && t >= s.a && t < s.b);
const isSplit = (t: number) => SEGS_E.some((s) => s.split && t >= s.a && t < s.b);
const chunks = chunkWords(D.words, 3, 16);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if ((t >= 56.6 && t < 61.0) || t >= 69.75) return null; // the comment box shows the keyword; outro has no speech
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const top = isSplit(t) ? 908 : isPov(t) ? 1490 : 1440;
  return (
    <div style={{ position: "absolute", top, left: 30, right: 30, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03; const now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
        const sc = now ? interpolate(t - w.s, [0, 0.1], [1.12, 1], clamp) : 1;
        return <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 76, letterSpacing: -2, textTransform: "uppercase", color: now ? Y : on ? "#fff" : "rgba(255,255,255,0.6)", transform: `scale(${sc})`, display: "inline-block", WebkitTextStroke: "3px #000", paintOrder: "stroke", textShadow: "0 6px 18px rgba(0,0,0,0.8)" }}>{w.w.replace(/[,.?]$/, "")}</span>;
      })}
    </div>
  );
};

export const Reel15: React.FC = () => {
  const frame = useCurrentFrame();
  /* snap zoom on the face whenever we cut back to it */
  const back = SEGS_E.filter((s) => s.pov || s.split).map((s) => f(s.b));
  const since = Math.min(...back.map((b) => (frame >= b ? frame - b : 999)));
  const z = since < 8 ? interpolate(since, [0, 7], [1.1, 1.0], { ...clamp, easing: Easing.out(Easing.cubic) }) : 1;
  const sfx: [number, string, number][] = [
    [0.1, "pop", 0.18], [2.5, "click", 0.16], [7.5, "click", 0.16], [8.15, "swish", 0.12], [10.05, "glitch", 0.12],
    [18.75, "typing", 0.18], [23.9, "ding", 0.2], [28.0, "pop", 0.18], [36.8, "pop", 0.18], [44.2, "click", 0.16], [44.9, "click", 0.16],
    [45.9, "glitch", 0.12], [52.1, "click", 0.18], [64.5, "swish", 0.12], [69.8, "ding", 0.16],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: "50% 35%" }}>
        <OffthreadVideo src={staticFile(BASE)} muted style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      {SEGS_E.map((s, i) => (
        <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}>
          {s.pov ? s.pov(f(s.a)) : s.split ? <Split offset={f(s.a)}><s.split /></Split> : s.over ? <s.over /> : null}
        </Sequence>
      ))}
      <Captions />
      <Audio src={staticFile(BASE)} />
      <Music src="r/r15_music.wav" total={END} base={0.075} boosts={[[64.5, END, 0.12]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v} />)}
    </AbsoluteFill>
  );
};

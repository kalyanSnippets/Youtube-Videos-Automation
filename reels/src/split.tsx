import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { activeChunk, Chunk, FPS, INTER, MONO, PopIn } from "./lib";

/* Shared split-screen kit for the list-style reels (R10, R11): graphic on top, face-tracked A-roll below. */
export const K = { bg: "#0E1116", panel: "#151A22", line: "#232B36", gold: "#E8C77A", orange: "#FF7A45", green: "#34D399", red: "#FF453A", blue: "#60A5FA", violet: "#A78BFA", pink: "#F472B6", ink: "#0A0A0A", mute: "#8B95A5", yellow: "#FFE600" };
export const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const SEAM = 960;
export type FaceTrack = { t: number[]; cy: number[] };

const faceAt = (FT: FaceTrack, t: number) => {
  const i = Math.max(0, FT.t.findIndex((x) => x > t) - 1);
  const j = Math.min(FT.t.length - 1, i + 1);
  const k = FT.t[j] === FT.t[i] ? 0 : Math.min(1, Math.max(0, (t - FT.t[i]) / (FT.t[j] - FT.t[i])));
  return FT.cy[i] + (FT.cy[j] - FT.cy[i]) * k;
};

const FaceBox: React.FC<{ video: string; face: FaceTrack; offset: number; y: number; h: number }> = ({ video, face, offset, y, h }) => {
  const frame = useCurrentFrame();
  const s = 0.86;
  let top = h * 0.5 - faceAt(face, (frame + offset) / FPS) * s;
  top = Math.min(0, Math.max(h - 1920 * s, top));
  const v = (st: React.CSSProperties) => <OffthreadVideo src={staticFile(video)} muted startFrom={offset} style={st} />;
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, height: h, overflow: "hidden", background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, filter: "blur(30px) brightness(0.55)", transform: "scale(1.15)" }}>{v({ width: "100%", height: "100%", objectFit: "cover" })}</div>
      {v({ position: "absolute", left: (1080 - 1080 * s) / 2, top, width: 1080 * s, height: 1920 * s })}
    </div>
  );
};

/* slow floor grid + a few drifting dots: gives the top panel depth without competing with the graphic */
const Stage: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: -600, right: -600, top: 560, height: 900, transform: "perspective(500px) rotateX(72deg)", transformOrigin: "50% 0%", backgroundImage: `linear-gradient(${accent}2E 2px, transparent 2px), linear-gradient(90deg, ${accent}2E 2px, transparent 2px)`, backgroundSize: "90px 90px", backgroundPosition: `0px ${(frame * 2) % 90}px`, maskImage: "linear-gradient(transparent, #000 25%, #000 70%, transparent)" }} />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = (i * 211) % 1080, sp = 0.4 + (i % 5) * 0.2, y = (((i * 137 - frame * sp * 2) % 960) + 960) % 960;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 5 + (i % 3) * 2, height: 5 + (i % 3) * 2, borderRadius: 9, background: accent, opacity: 0.18 + (i % 4) * 0.08 }} />;
      })}
    </AbsoluteFill>
  );
};

export const Split: React.FC<{ video: string; face: FaceTrack; offset: number; accent?: string; children: React.ReactNode }> = ({ video, face, offset, accent = K.gold, children }) => (
  <AbsoluteFill style={{ background: K.bg }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: SEAM, overflow: "hidden", background: `radial-gradient(ellipse at 50% 40%, #1B2330, ${K.bg} 70%)` }}>
      <Stage accent={accent} />
      {children}
    </div>
    <FaceBox video={video} face={face} offset={offset} y={SEAM} h={1920 - SEAM} />
    <div style={{ position: "absolute", left: 0, right: 0, top: SEAM - 4, height: 8, background: `linear-gradient(90deg, ${accent}, ${K.orange})` }} />
  </AbsoluteFill>
);

/* "3 / 5" counter + the item's name: the one header every list item shares */
export const ItemHeader: React.FC<{ n: number; of: number; kind: string; name: string; color: string; nameAt?: number; mono?: boolean }> = ({ n, of, kind, name, color, nameAt = 0, mono = true }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - nameAt, [0, 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <>
      <PopIn style={{ position: "absolute", left: 60, top: 150 }}>
        <div style={{ display: "flex" }}>
          <div style={{ background: color, color: K.ink, fontFamily: INTER, fontWeight: 900, fontSize: 46, padding: "4px 18px" }}>{n}/{of}</div>
          <div style={{ background: "#fff", color: K.ink, fontFamily: INTER, fontWeight: 900, fontSize: 46, padding: "4px 20px" }}>{kind}</div>
        </div>
      </PopIn>
      {frame >= nameAt && (
        <div style={{ position: "absolute", left: 60, top: 232, transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: "0% 50%", opacity: Math.min(1, p * 2), fontFamily: mono ? MONO : INTER, fontWeight: 800, fontSize: name.length > 16 ? 70 : 84, color, letterSpacing: -2, textShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>{name}</div>
      )}
    </>
  );
};

/* banner above the head on full-face shots (the wall behind Kalyan is empty there) */
export const Banner: React.FC<{ text: string; color?: string; top?: number; size?: number }> = ({ text, color = K.gold, top = 400, size = 70 }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 8], [-1100, 0], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateX(${x}px)` }}>
      <div style={{ background: color, color: K.ink, fontFamily: INTER, fontWeight: 900, fontSize: size, padding: "8px 30px", letterSpacing: -2, boxShadow: "0 14px 40px rgba(0,0,0,0.45)", transform: "rotate(-1.5deg)" }}>{text}</div>
    </div>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number }> = ({ children, bg = K.yellow, color = K.ink, size = 42 }) => (
  <div style={{ background: bg, color, fontFamily: INTER, fontWeight: 900, fontSize: size, padding: "10px 24px", borderRadius: 14, boxShadow: "0 10px 26px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{children}</div>
);

/* word-by-word captions: on the seam in split screens, on the chest (below the chin) in full-face shots */
export const Captions: React.FC<{ chunks: Chunk[]; isSplit: (t: number) => boolean; hi?: string; faceTop?: number }> = ({ chunks, isSplit, hi = K.gold, faceTop = 1420 }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const top = isSplit(t) ? SEAM - 52 : faceTop;
  return (
    <div style={{ position: "absolute", top, left: 30, right: 30, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 18px" }}>
      {c.words.map((w, i) => {
        const on = t >= w.s - 0.03;
        const now = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
        const p = now ? interpolate(t - w.s, [0, 0.1], [1.15, 1], clamp) : 1;
        return (
          <span key={i} style={{ fontFamily: INTER, fontWeight: 900, fontSize: 78, letterSpacing: -2, textTransform: "uppercase", color: now ? hi : on ? "#fff" : "rgba(255,255,255,0.6)", transform: `scale(${p})`, display: "inline-block", WebkitTextStroke: "3px #000", paintOrder: "stroke", textShadow: "0 6px 18px rgba(0,0,0,0.8)" }}>
            {w.w.replace(/[,.?]$/, "")}
          </span>
        );
      })}
    </div>
  );
};

/* tiny website mock: "ugly" = what AI gives by default, "nice" = designed */
export const SiteMock: React.FC<{ variant: "ugly" | "nice"; w?: number }> = ({ variant, w = 420 }) => {
  const h = w * 0.74, u = w / 420;
  if (variant === "ugly")
    return (
      <div style={{ width: w, height: h, background: "#fff", border: `${3 * u}px solid #9CA3AF`, padding: 18 * u, fontFamily: "Times New Roman, serif", color: "#111", overflow: "hidden" }}>
        <div style={{ fontSize: 30 * u, fontWeight: 700 }}>Welcome to My Website</div>
        <div style={{ fontSize: 17 * u, marginTop: 6 * u, color: "#00E", textDecoration: "underline" }}>Home | About | Contact</div>
        <div style={{ height: 2 * u, background: "#888", margin: `${10 * u}px 0` }} />
        {[0.95, 0.9, 0.97, 0.6].map((k, i) => <div key={i} style={{ height: 11 * u, width: `${k * 100}%`, background: "#C9CDD3", marginBottom: 9 * u }} />)}
        <div style={{ display: "inline-block", marginTop: 6 * u, border: `${2 * u}px solid #555`, background: "#E5E7EB", fontSize: 17 * u, padding: `${2 * u}px ${10 * u}px` }}>Submit</div>
      </div>
    );
  return (
    <div style={{ width: w, height: h, borderRadius: 18 * u, background: "linear-gradient(135deg,#1E1B4B,#7C3AED 55%,#F472B6)", padding: 20 * u, fontFamily: INTER, color: "#fff", overflow: "hidden", boxShadow: "0 0 0 2px rgba(255,255,255,0.15) inset" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 20 * u }}>◆ nova</div>
        <div style={{ background: "#fff", color: "#4C1D95", fontWeight: 800, fontSize: 13 * u, padding: `${4 * u}px ${12 * u}px`, borderRadius: 99 }}>Get started</div>
      </div>
      <div style={{ fontWeight: 900, fontSize: 38 * u, lineHeight: 1.02, letterSpacing: -1.5 * u, marginTop: 26 * u }}>Ship ideas<br />beautifully.</div>
      <div style={{ display: "flex", gap: 10 * u, marginTop: 22 * u }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ flex: 1, height: 74 * u, borderRadius: 12 * u, background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.3)" }} />)}
      </div>
    </div>
  );
};

/* CTA: a comment box where the keyword gets typed, posted and answered. Times are frames inside the panel. */
export const CommentPanel: React.FC<{ word: string; title: string; typeAt: number; sentAt: number; replyAt: number; reply: string }> = ({ word, title, typeAt, sentAt, replyAt, reply }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor(((frame - typeAt) / FPS) * 16));
  const av: React.CSSProperties = { borderRadius: 99, background: "linear-gradient(135deg,#F472B6,#FF7A45)", color: "#fff", fontFamily: INTER, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" };
  return (
    <>
      <PopIn style={{ position: "absolute", left: 0, right: 0, top: 170, display: "flex", justifyContent: "center" }}><Chip bg={K.yellow} size={60}>{title}</Chip></PopIn>
      <PopIn delay={4} from="up" style={{ position: "absolute", left: 70, right: 70, top: 340 }}>
        <div style={{ background: "#fff", borderRadius: 30, padding: "30px 34px", boxShadow: "0 30px 60px rgba(0,0,0,0.55)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ ...av, width: 84, height: 84, fontSize: 44 }}>Y</div>
            <div style={{ flex: 1, border: "3px solid #D1D5DB", borderRadius: 99, padding: "16px 30px", fontFamily: INTER, fontWeight: 900, fontSize: 60, color: K.ink, letterSpacing: 2, minHeight: 74 }}>
              {frame < sentAt ? <>{word.slice(0, n)}<span style={{ color: K.blue, opacity: Math.floor(frame / 8) % 2 ? 1 : 0 }}>▍</span></> : <span style={{ color: "#9CA3AF", fontWeight: 600, fontSize: 40, letterSpacing: 0 }}>Add a comment…</span>}
            </div>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, color: K.blue }}>Post</div>
          </div>
          {frame >= sentAt && (
            <PopIn delay={sentAt} from="up" style={{ marginTop: 26 }}>
              <div style={{ display: "flex", gap: 18 }}>
                <div style={{ ...av, width: 64, height: 64 }} />
                <div><div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 30, color: "#6B7280" }}>you · now</div><div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 54, color: K.ink }}>{word}</div></div>
              </div>
            </PopIn>
          )}
          {frame >= replyAt && (
            <PopIn delay={replyAt} from="up" style={{ marginTop: 18, marginLeft: 82 }}>
              <div style={{ display: "inline-block", background: "#EEF2FF", borderRadius: 20, padding: "14px 24px", fontFamily: INTER, fontWeight: 800, fontSize: 38, color: "#3730A3" }}>{reply}</div>
            </PopIn>
          )}
        </div>
      </PopIn>
    </>
  );
};

/* end card: follow pill above the head, tapped after `tap` frames */
export const Follow: React.FC<{ tap?: number; top?: number }> = ({ tap = 22, top = 330 }) => {
  const frame = useCurrentFrame();
  const done = frame >= tap;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center" }}>
      <PopIn from="down">
        <div style={{ display: "flex", alignItems: "center", gap: 22, background: "#fff", borderRadius: 99, padding: "16px 22px 16px 16px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ width: 96, height: 96, borderRadius: 48, background: `linear-gradient(135deg, ${K.gold}, ${K.orange})`, color: K.ink, fontFamily: INTER, fontWeight: 900, fontSize: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>AK</div>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 46, color: K.ink }}>AI with Kalyan</div>
          <div style={{ background: done ? "#E5E7EB" : "#0095F6", color: done ? K.ink : "#fff", fontFamily: INTER, fontWeight: 900, fontSize: 40, padding: "14px 30px", borderRadius: 99, transform: `scale(${interpolate(frame, [tap - 3, tap, tap + 5], [1, 0.9, 1], clamp)})` }}>{done ? "Following ✓" : "Follow"}</div>
        </div>
      </PopIn>
    </div>
  );
};

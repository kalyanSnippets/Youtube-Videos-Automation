import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_DATA } from "./fontData";

// Fonts are embedded as base64 so no network fetch is needed while rendering.
if (typeof document !== "undefined" && !(window as any).__reelFonts) {
  (window as any).__reelFonts = true;
  for (const ft of FONT_DATA) {
    const bin = atob(ft.b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const face = new FontFace(ft.family, buf.buffer, { weight: ft.weight, style: ft.style });
    (document.fonts as any).add(face);
  }
}

export const INTER = "Inter, sans-serif";
export const MONO = "'JetBrains Mono', monospace";
export const SERIF = "'Playfair Display', serif";
export const SERIF_UP = "'Playfair Display', serif";
export const GROTESK = "Inter, sans-serif";

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export type Word = { w: string; s: number; e: number };
export type Piece = { src?: number; srcEnd?: number; start: number; gap?: boolean; dur?: number };
export type ReelData = { duration: number; words: Word[]; timeline: Piece[] };

export const f = (sec: number) => Math.round(sec * FPS);

/* ---------- motion helpers ---------- */
export function useSpring(delay = 0, damping = 14, stiffness = 160) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.6 } });
}

export const PopIn: React.FC<{
  delay?: number;
  from?: "scale" | "up" | "down" | "left" | "right";
  children: React.ReactNode;
  style?: React.CSSProperties;
  dist?: number;
}> = ({ delay = 0, from = "scale", children, style, dist = 80 }) => {
  const p = useSpring(delay);
  const frame = useCurrentFrame();
  const visible = frame >= delay;
  let transform = "";
  if (from === "scale") transform = `scale(${interpolate(p, [0, 1], [0.6, 1])})`;
  if (from === "up") transform = `translateY(${interpolate(p, [0, 1], [dist, 0])}px)`;
  if (from === "down") transform = `translateY(${interpolate(p, [0, 1], [-dist, 0])}px)`;
  if (from === "left") transform = `translateX(${interpolate(p, [0, 1], [-dist, 0])}px)`;
  if (from === "right") transform = `translateX(${interpolate(p, [0, 1], [dist, 0])}px)`;
  return (
    <div style={{ opacity: visible ? Math.min(1, p * 1.6) : 0, transform, ...style }}>{children}</div>
  );
};

export const Typewriter: React.FC<{ text: string; delay?: number; cps?: number; caret?: boolean; caretColor?: string }> = ({
  text,
  delay = 0,
  cps = 28,
  caret = true,
  caretColor = "currentColor",
}) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor(((frame - delay) / FPS) * cps));
  const shown = text.slice(0, n);
  const blink = Math.floor(frame / 8) % 2 === 0;
  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {shown}
      {caret && <span style={{ opacity: blink ? 1 : 0, color: caretColor }}>▍</span>}
    </span>
  );
};

export const Counter: React.FC<{ to: number; delay?: number; dur?: number; fmt?: (n: number) => string }> = ({
  to,
  delay = 0,
  dur = 30,
  fmt = (n) => Math.round(n).toLocaleString("en-US"),
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame - delay, [0, dur], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return <>{fmt(v)}</>;
};

/* ---------- backgrounds ---------- */
export const GridBg: React.FC<{ bg: string; line: string; size?: number; glow?: string }> = ({ bg, line, size = 60, glow }) => (
  <AbsoluteFill
    style={{
      backgroundColor: bg,
      backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
    }}
  >
    {glow && (
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${glow}, transparent 60%)` }} />
    )}
  </AbsoluteFill>
);

/* ---------- A-roll framing ---------- */
export function pieceIndexAt(data: ReelData, t: number) {
  let idx = 0;
  data.timeline.forEach((p, i) => {
    if (t >= p.start) idx = i;
  });
  return idx;
}

export const Aroll: React.FC<{
  data: ReelData;
  src: string;
  box: { x: number; y: number; w: number; h: number; r?: number };
  focusY: number; // source pixel y to keep centred
  zoom?: number;
  alternate?: boolean; // alternate punch-in at every internal jump cut
  border?: string;
  shadow?: boolean;
  /** absolute frame offset of the enclosing Sequence so jump-cut zoom stays in sync */
  offset?: number;
}> = ({ data, src, box, focusY, zoom = 1, alternate = true, border, shadow, offset = 0 }) => {
  const frame = useCurrentFrame();
  const t = (frame + offset) / FPS;
  const idx = pieceIndexAt(data, t);
  const z = zoom * (alternate && idx % 2 === 1 ? 1.1 : 1);
  const s = (box.w * z) / 1080;
  const vh = 1920 * s;
  let top = box.h / 2 - focusY * s;
  top = Math.min(0, Math.max(box.h - vh, top));
  const left = (box.w - box.w * z) / 2;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        overflow: "hidden",
        borderRadius: box.r ?? 0,
        border,
        boxShadow: shadow ? "0 30px 80px rgba(0,0,0,0.45)" : undefined,
        background: "#000",
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        muted
        style={{ position: "absolute", left, top, width: box.w * z, height: vh }}
      />
    </div>
  );
};

/* ---------- media ---------- */
export const Clip: React.FC<{
  src: string;
  startFrom?: number; // seconds
  style?: React.CSSProperties;
  fit?: "cover" | "contain";
  kenBurns?: number; // extra zoom over sequence
  durFrames?: number;
  rate?: number;
  pos?: string;
}> = ({ src, startFrom = 0, style, fit = "cover", kenBurns = 0.08, durFrames = 150, rate = 1, pos = "50% 50%" }) => {
  const frame = useCurrentFrame();
  const z = 1 + interpolate(frame, [0, durFrames], [0, kenBurns], { extrapolateRight: "clamp" });
  return (
    <div style={{ overflow: "hidden", position: "relative", ...style }}>
      <OffthreadVideo
        src={staticFile(src)}
        muted
        startFrom={Math.round(startFrom * FPS)}
        playbackRate={rate}
        style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: pos, transform: `scale(${z})` }}
      />
    </div>
  );
};

export const Pic: React.FC<{ src: string; style?: React.CSSProperties; fit?: "cover" | "contain"; pos?: string }> = ({
  src,
  style,
  fit = "cover",
  pos = "top",
}) => <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: pos, ...style }} />;

/* ---------- audio ---------- */
export const Sfx: React.FC<{ at: number; name: string; vol?: number }> = ({ at, name, vol = 0.5 }) => (
  <Sequence from={f(at)} durationInFrames={f(2)} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
  </Sequence>
);

export const Music: React.FC<{ src: string; total: number; base?: number; boosts?: [number, number, number][] }> = ({
  src,
  total,
  base = 0.16,
  boosts = [],
}) => (
  <Audio
    src={staticFile(src)}
    volume={(fr) => {
      const t = fr / FPS;
      let v = base;
      for (const [a, b, lvl] of boosts) {
        if (t >= a - 0.4 && t <= b + 0.4) {
          const k = Math.min(1, (t - (a - 0.4)) / 0.4, (b + 0.4 - t) / 0.4);
          v = Math.max(v, base + (lvl - base) * k);
        }
      }
      const fadeIn = Math.min(1, t / 0.6);
      const fadeOut = Math.min(1, (total - t) / 1.5);
      return v * fadeIn * Math.max(0, fadeOut);
    }}
  />
);

/* ---------- captions ---------- */
export type Chunk = { words: Word[]; s: number; e: number };
export function chunkWords(words: Word[], maxWords = 3, maxChars = 18): Chunk[] {
  const chunks: Chunk[] = [];
  let cur: Word[] = [];
  const push = () => {
    if (cur.length) chunks.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (cur.length && prev && w.s - prev.e > 0.45) push();
    const len = cur.reduce((a, b) => a + b.w.length + 1, 0) + w.w.length;
    if (cur.length >= maxWords || (cur.length && len > maxChars)) push();
    cur.push(w);
    if (/[.?!,]$/.test(w.w) && cur.length >= 1) push();
  });
  push();
  // extend each chunk until next one starts (short holds)
  return chunks.map((c, i) => ({ ...c, e: Math.min(chunks[i + 1]?.s ?? c.e + 0.4, c.e + 0.35) }));
}

export function activeChunk(chunks: Chunk[], t: number) {
  return chunks.find((c) => t >= c.s - 0.05 && t < c.e);
}

export const clean = (w: string) => w.replace(/[,.]$/, "");

/* ---------- UI bits ---------- */
export const MacWindow: React.FC<{
  title?: string;
  dark?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}> = ({ title, dark = true, children, style, bodyStyle }) => (
  <div
    style={{
      borderRadius: 26,
      overflow: "hidden",
      background: dark ? "#16181d" : "#ffffff",
      boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
      border: dark ? "1px solid #2a2d35" : "1px solid #e4e4e0",
      ...style,
    }}
  >
    <div
      style={{
        height: 58,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 22px",
        background: dark ? "#1e2128" : "#f3f3f1",
        borderBottom: dark ? "1px solid #2a2d35" : "1px solid #e8e8e4",
      }}
    >
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
      ))}
      <div
        style={{
          marginLeft: 14,
          fontFamily: MONO,
          fontSize: 24,
          color: dark ? "#9aa0ab" : "#7b7b75",
          fontWeight: 500,
        }}
      >
        {title}
      </div>
    </div>
    <div style={{ padding: 28, ...bodyStyle }}>{children}</div>
  </div>
);

export const Cursor: React.FC<{ path: [number, number, number][]; clicks?: number[]; color?: string; size?: number }> = ({
  path,
  clicks = [],
  color = "#111",
  size = 64,
}) => {
  const frame = useCurrentFrame();
  const ts = path.map((p) => p[0]);
  const x = interpolate(frame, ts, path.map((p) => p[1]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const y = interpolate(frame, ts, path.map((p) => p[2]), {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const pressed = clicks.some((c) => frame >= c && frame < c + 6);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${pressed ? 0.85 : 1})`, zIndex: 50 }}>
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.5 L12 13.5 L19 13.5 Z"
          fill={color}
          stroke="#fff"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
      {clicks.map((c) =>
        frame >= c && frame < c + 14 ? (
          <div
            key={c}
            style={{
              position: "absolute",
              left: -30 + 6,
              top: -30 + 4,
              width: 60,
              height: 60,
              borderRadius: 30,
              border: `4px solid ${color}`,
              opacity: 1 - (frame - c) / 14,
              transform: `scale(${0.4 + (frame - c) / 10})`,
            }}
          />
        ) : null,
      )}
    </div>
  );
};

export const Credit: React.FC<{ text: string; color?: string; bottom?: number; top?: number; align?: "left" | "right" }> = ({
  text,
  color = "rgba(255,255,255,0.75)",
  bottom,
  top,
  align = "left",
}) => (
  <div
    style={{
      position: "absolute",
      [align]: 28,
      ...(top !== undefined ? { top } : { bottom: bottom ?? 24 }),
      fontFamily: INTER,
      fontSize: 22,
      fontWeight: 500,
      color,
      background: "rgba(0,0,0,0.35)",
      padding: "6px 14px",
      borderRadius: 10,
      letterSpacing: 0.2,
    }}
  >
    {text}
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; bg: string; color: string; style?: React.CSSProperties }> = ({
  children,
  bg,
  color,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      background: bg,
      color,
      borderRadius: 999,
      padding: "12px 26px",
      fontFamily: INTER,
      fontWeight: 700,
      fontSize: 32,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Fade a whole layer in/out at sequence edges. */
export const EdgeFade: React.FC<{ dur: number; children: React.ReactNode; inF?: number; outF?: number }> = ({
  dur,
  children,
  inF = 4,
  outF = 4,
}) => {
  const frame = useCurrentFrame();
  const o = Math.min(
    interpolate(frame, [0, inF], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [dur - outF, dur], [1, 0], { extrapolateLeft: "clamp" }),
  );
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/** Simple flash used on hard transitions. */
export const Flash: React.FC<{ color?: string; dur?: number }> = ({ color = "#fff", dur = 6 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{ background: color, opacity: interpolate(frame, [0, dur], [0.85, 0], { extrapolateRight: "clamp" }), pointerEvents: "none" }}
    />
  );
};

/** Subscribe / follow card used by several CTAs. */
export const SubscribeCard: React.FC<{
  clickAt: number;
  dark?: boolean;
  accent?: string;
  label?: string;
  sub?: string;
  avatarSrc?: string;
}> = ({ clickAt, dark = false, accent = "#ff0033", label = "AI with Kalyan", sub = "Real AI experiments, explained simply", avatarSrc }) => {
  const frame = useCurrentFrame();
  const clicked = frame >= clickAt;
  const press = frame >= clickAt && frame < clickAt + 6 ? 0.95 : 1;
  return (
    <div
      style={{
        width: 860,
        borderRadius: 40,
        background: dark ? "#15171c" : "#ffffff",
        boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        padding: 40,
        display: "flex",
        flexDirection: "column",
        gap: 30,
        border: dark ? "1px solid #2b2e36" : "1px solid #ececec",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            overflow: "hidden",
            background: `linear-gradient(135deg, ${accent}, #7c3aed)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: INTER,
            fontWeight: 900,
            fontSize: 44,
          }}
        >
          {avatarSrc ? <Img src={staticFile(avatarSrc)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "AK"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 50, color: dark ? "#fff" : "#111" }}>{label}</div>
          <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 28, color: dark ? "#9aa0ab" : "#6b6b6b" }}>{sub}</div>
        </div>
      </div>
      <div
        style={{
          height: 104,
          borderRadius: 52,
          background: clicked ? (dark ? "#2a2d35" : "#f1f1f1") : accent,
          color: clicked ? (dark ? "#fff" : "#111") : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: INTER,
          fontWeight: 800,
          fontSize: 44,
          transform: `scale(${press})`,
          gap: 16,
        }}
      >
        {clicked ? "✓ Subscribed  🔔" : "Subscribe"}
      </div>
    </div>
  );
};

/** Highlighter bars that sweep across lines of an article screenshot. */
export const HighlightBar: React.FC<{ x: number; y: number; w: number; h: number; delay?: number; color?: string; dur?: number }> = ({
  x,
  y,
  w,
  h,
  delay = 0,
  color = "rgba(255,214,0,0.45)",
  dur = 10,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return <div style={{ position: "absolute", left: x, top: y, width: w * p, height: h, background: color, mixBlendMode: "multiply", borderRadius: 4 }} />;
};

export const Waveform: React.FC<{ bars?: number; color: string; height?: number; width?: number; seed?: number }> = ({
  bars = 32,
  color,
  height = 160,
  width = 700,
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: width / bars / 3, height, width }}>
      {new Array(bars).fill(0).map((_, i) => {
        const v = 0.25 + 0.75 * Math.abs(Math.sin(frame / 4 + i * 0.7 + seed) * Math.cos(frame / 9 + i * 0.31));
        return <div key={i} style={{ flex: 1, height: height * v, background: color, borderRadius: 8 }} />;
      })}
    </div>
  );
};

export const Glitch: React.FC<{ children: React.ReactNode; at?: number; dur?: number }> = ({ children, at = 0, dur = 8 }) => {
  const frame = useCurrentFrame();
  const on = frame >= at && frame < at + dur;
  const dx = on ? ((frame * 37) % 24) - 12 : 0;
  return (
    <AbsoluteFill style={{ transform: `translateX(${dx}px)`, filter: on ? "hue-rotate(90deg) saturate(2)" : undefined }}>
      {children}
    </AbsoluteFill>
  );
};

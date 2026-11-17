import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import data from "../public/r/r12f_words.json";
import face from "../public/r/r12f_face.json";
import { f, FPS, INTER, MONO, Music, PopIn, ReelData, Sfx, Flash, chunkWords } from "./lib";
import { K, ease, clamp, Split, Chip, Captions, CommentPanel, Follow, FaceTrack, Float3D } from "./split";

/* Reel 12: "I made my first game from my own drawing" (Google AI Studio).
   Nostalgic arcade look: pixel font, CRT scanlines, 8-bit sounds and a chiptune bed (all synthesised).
   The childhood part plays as a game (PLAYER 1, GAME OVER, IMPOSSIBLE difficulty), then the real drawing,
   the real AI Studio prompt and the real game footage from Kalyan's phone. Times are seconds on the final cut. */
const D = data as unknown as ReelData;
const FT = face as FaceTrack & { cx: number[] };
const VID = "r/r12f_aroll.mp4";
const END = D.duration + 0.6;
export const R12_FRAMES = Math.ceil(END * FPS);
/* graphic times were written against a first, longer cut; T() maps them onto the final cut by matching the same spoken words */
const TM: [number, number][] = [[0, 0], [2.6, 2.52], [3.5, 3.34], [5.0, 4.98], [7.3, 6.85], [7.4, 6.9], [9.5, 8.18], [10.9, 9.54], [12.8, 10.36], [14.6, 11.9], [15.6, 12.55], [15.7, 12.62], [17.75, 14.7], [17.9, 14.82], [18.3, 15.16], [20.1, 17.0], [20.2, 17.08], [23.3, 20.0], [25.6, 22.15], [25.7, 22.2], [27.6, 24.04], [29.5, 25.9], [29.7, 26.0], [34.95, 31.05], [35.0, 31.08], [36.65, 32.48], [36.7, 32.52], [37.85, 33.6], [39.6, 35.45], [40.3, 36.16], [41.8, 37.62], [43.35, 39.25], [43.4, 39.3], [45.3, 41.16], [46.7, 42.12], [46.8, 42.2], [50.6, 46.0], [50.7, 46.08], [53.3, 48.3], [53.9, 48.74], [55.0, 50.24], [56.1, 51.2], [56.2, 51.24], [57.0, 52.02], [57.8, 52.74], [60.06, 54.97]];
const T = (x: number) => {
  for (let i = 1; i < TM.length; i++) if (x <= TM[i][0]) { const [o0, n0] = TM[i - 1], [o1, n1] = TM[i]; return n0 + ((x - o0) / (o1 - o0)) * (n1 - n0); }
  return TM[TM.length - 1][1] + (x - TM[TM.length - 1][0]);
};
const L = (abs: number, a: number) => f(T(abs)) - f(T(a));
const PIX = "'Press Start 2P', monospace";
const P = { bg: "#0B0A2A", pink: "#FF4FD8", cyan: "#3CF2FF", gold: "#FFD23F", green: "#39FF6A", red: "#FF3B3B", white: "#F6F4FF" };

/* CRT scanlines + vignette over every arcade panel */
const CRT: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 5px)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)", pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: `rgba(255,255,255,${0.02 + (frame % 7 === 0 ? 0.02 : 0)})`, pointerEvents: "none" }} />
    </>
  );
};
/* pixel starfield + pixel mountains: the arcade backdrop */
const ArcadeBg: React.FC<{ tint?: string }> = ({ tint = P.pink }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${P.bg} 0%, #1A0F4A 60%, #2A0F45 100%)` }}>
      {Array.from({ length: 40 }).map((_, i) => {
        const x = (i * 263) % 1080, y = (i * 137) % 640, on = (Math.floor(frame / 6) + i) % 5 !== 0;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 6, height: 6, background: i % 3 ? P.white : P.cyan, opacity: on ? 0.8 : 0.15 }} />;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 240, background: `linear-gradient(0deg, ${tint}55, transparent)` }} />
      <div style={{ position: "absolute", left: -200, right: -200, bottom: -40, height: 300, transform: "perspective(400px) rotateX(70deg)", transformOrigin: "50% 100%", backgroundImage: `linear-gradient(${tint} 3px, transparent 3px), linear-gradient(90deg, ${tint} 3px, transparent 3px)`, backgroundSize: "80px 60px", backgroundPosition: `0 ${(frame * 4) % 60}px`, opacity: 0.6 }} />
    </AbsoluteFill>
  );
};
const Px: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 48, color = P.white, style }) => (
  <div style={{ fontFamily: PIX, fontSize: size, color, lineHeight: 1.35, textShadow: `4px 4px 0 #000, 0 0 18px ${color}88`, ...style }}>{children}</div>
);
const Blink: React.FC<{ children: React.ReactNode; every?: number }> = ({ children, every = 16 }) => {
  const frame = useCurrentFrame();
  return <div style={{ opacity: Math.floor(frame / every) % 2 ? 0.25 : 1 }}>{children}</div>;
};
const Arcade: React.FC<{ children: React.ReactNode; tint?: string }> = ({ children, tint }) => (
  <AbsoluteFill>
    <ArcadeBg tint={tint} />
    {children}
    <CRT />
  </AbsoluteFill>
);
const PixType: React.FC<{ text: string; delay?: number; cps?: number }> = ({ text, delay = 0, cps = 22 }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor(((frame - delay) / FPS) * cps));
  return <>{text.slice(0, n)}<span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0 }}>_</span></>;
};

/* 0.0 when I was young: PLAYER 1, then the dream job title */
const YoungPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const dream = L(2.6, 0);
  const p = interpolate(frame, [dream, dream + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  return (
    <Arcade>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center" }}><Blink><Px size={40} color={P.cyan}>PLAYER 1 · AGE 10</Px></Blink></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", fontSize: 150, transform: `translateY(${Math.sin(frame / 6) * 8}px)` }}>🧒🎮</div>
      {frame >= L(1.5, 0) && <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center" }}><Px size={34}>DREAM JOB:</Px></div>}
      {frame >= dream && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 590, display: "flex", justifyContent: "center", transform: `scale(${0.3 + 0.7 * p})` }}>
          <div style={{ border: `8px solid ${P.gold}`, background: "#000", padding: "22px 30px", boxShadow: `0 0 40px ${P.gold}` }}><Px size={58} color={P.gold}>GAME DEVELOPER</Px></div>
        </div>
      )}
      {frame >= dream && Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2, r = interpolate(frame - dream, [0, 18], [0, 420], clamp);
        return <div key={i} style={{ position: "absolute", left: 530 + Math.cos(a) * r, top: 650 + Math.sin(a) * r * 0.6, width: 14, height: 14, background: i % 2 ? P.gold : P.pink, opacity: interpolate(frame - dream, [10, 22], [1, 0], clamp) }} />;
      })}
    </Arcade>
  );
};

/* 3.5 the childhood thought bubble */
const ThinkPanel: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Arcade tint={P.cyan}>
      <div style={{ position: "absolute", left: 90, top: 640, fontSize: 150, transform: `rotate(${Math.sin(frame / 8) * 6}deg)` }}>🕹️</div>
      {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: 260 + i * 50, top: 610 - i * 50, width: 26 + i * 12, height: 26 + i * 12, background: P.white, opacity: frame > i * 4 ? 1 : 0 }} />)}
      <PopIn delay={10} style={{ position: "absolute", left: 300, right: 60, top: 170 }}>
        <div style={{ background: P.white, border: "8px solid #000", padding: "34px 30px", boxShadow: "12px 12px 0 #000" }}>
          <Px size={38} color="#111" style={{ textShadow: "none" }}><PixType text={"ONE DAY... I'LL MAKE MY OWN GAME!"} delay={L(5.0, 3.5)} cps={20} /></Px>
        </div>
      </PopIn>
    </Arcade>
  );
};

/* 7.3 "but I never really did it": GAME OVER */
const GameOverPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const sh = frame < 10 ? Math.sin(frame * 3) * 10 : 0;
  const n = Math.max(0, 9 - Math.floor(frame / 8));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", transform: `translateX(${sh}px)` }}>
        <Px size={110} color={P.red} style={{ textShadow: `6px 6px 0 #500, -4px 0 0 ${P.cyan}66, 4px 0 0 ${P.pink}66` }}>GAME OVER</Px>
      </div>
      {frame > 14 && <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center" }}><Blink every={10}><Px size={40}>CONTINUE? {n}</Px></Blink></div>}
      <CRT />
    </AbsoluteFill>
  );
};

/* 9.5 "didn't know how... learn a lot of coding": a wall of code and an impossible difficulty bar */
const CODE = ["function update(dt) {", "  player.vy += GRAVITY * dt;", "  if (keys.space && onGround)", "    player.vy = -JUMP;", "  for (const c of coins)", "    if (hit(player, c)) score++;", "  ctx.drawImage(sprite, x, y);", "  requestAnimationFrame(loop);", "class Enemy extends Entity {", "  constructor(x, y) { super(); }", "  collide(tiles) { /* ??? */ }", "const level = parseTiles(map);"];
const CodingPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 9.5;
  const fill = interpolate(frame, [L(12.8, a), L(14.6, a)], [0.15, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#05050F" }}>
      <div style={{ position: "absolute", left: 40, right: 40, top: -((frame * 6) % 520), fontFamily: MONO, fontSize: 34, lineHeight: 1.55, color: P.green, opacity: 0.55 }}>
        {Array.from({ length: 4 }).flatMap((_, k) => CODE.map((l, i) => <div key={k + "-" + i} style={{ whiteSpace: "pre" }}>{l}</div>))}
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #05050Fdd, #05050F44 40%, #05050Fdd)" }} />
      <PopIn delay={L(10.9, a)} style={{ position: "absolute", left: 0, right: 0, top: 180, display: "flex", justifyContent: "center" }}><Px size={54} color={P.white}>HOW?? 😵</Px></PopIn>
      {frame >= L(12.8, a) && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 560 }}>
          <Px size={32} color={P.white}>DIFFICULTY</Px>
          <div style={{ marginTop: 18, height: 64, border: "6px solid #fff", background: "#000", padding: 6 }}>
            <div style={{ width: `${fill * 100}%`, height: "100%", background: `repeating-linear-gradient(90deg, ${P.red} 0 40px, #B00 40px 46px)` }} />
          </div>
          {fill > 0.95 && <PopIn style={{ marginTop: 22, textAlign: "right" }}><Px size={40} color={P.red}>IMPOSSIBLE 💀</Px></PopIn>}
        </div>
      )}
      <CRT />
    </AbsoluteFill>
  );
};

/* 17.8 "what if AI could help me": player 2 joins */
const AIJoinPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const join = L(18.3, 17.8);
  const Card: React.FC<{ p: string; name: string; icon: string; c: string; delay: number }> = ({ p, name, icon, c, delay }) => (
    <PopIn delay={delay} from="up">
      <div style={{ width: 400, border: `8px solid ${c}`, background: "#000", padding: "26px 0", textAlign: "center", boxShadow: `0 0 40px ${c}` }}>
        <Px size={30} color={c}>{p}</Px>
        <div style={{ fontSize: 130, margin: "10px 0" }}>{icon}</div>
        <Px size={34}>{name}</Px>
      </div>
    </PopIn>
  );
  return (
    <Arcade tint={P.cyan}>
      <div style={{ position: "absolute", left: 60, right: 60, top: 230, display: "flex", justifyContent: "space-between" }}>
        <Card p="PLAYER 1" name="KALYAN" icon="🧑" c={P.pink} delay={0} />
        <Card p="PLAYER 2" name="AI" icon="🤖" c={P.cyan} delay={join} />
      </div>
      {frame >= join + 8 && <div style={{ position: "absolute", left: 0, right: 0, top: 140, textAlign: "center" }}><Blink every={8}><Px size={34} color={P.gold}>PLAYER 2 HAS JOINED!</Px></Blink></div>}
    </Arcade>
  );
};

/* phone footage inside a chunky arcade frame, tilted in 3D */
const FootCard: React.FC<{ src: string; w: number; h: number; pos?: string; startFrom?: number; label?: string; c?: string; tilt?: number }> = ({ src, w, h, pos = "50% 50%", startFrom = 0, label, c = P.gold, tilt = -6 }) => (
  <div style={{ position: "relative", width: w, border: `8px solid ${c}`, background: "#000", boxShadow: `0 0 50px ${c}88, 14px 14px 0 #000`, transform: `rotate(${tilt * 0.3}deg)` }}>
    <div style={{ width: w - 16, height: h, overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
    </div>
    {label && <div style={{ position: "absolute", left: -8, top: -58, background: c, padding: "10px 16px" }}><Px size={24} color="#000" style={{ textShadow: "none" }}>{label}</Px></div>}
  </div>
);

/* 20.2 the real drawing, then a brutally honest art rating */
const DrawPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 20.2;
  const rate = L(23.3, a);
  return (
    <Arcade tint={P.gold}>
      <Float3D spin={-60} sway={5} tilt={-8} style={{ position: "absolute", left: 70, top: 150 }}>
        <FootCard src="b/r12_draw.mp4" w={520} h={700} pos="40% 62%" label="MY DRAWING" />
      </Float3D>
      {frame >= rate && (
        <PopIn delay={rate} style={{ position: "absolute", left: 610, top: 270, width: 420 }}>
          <div style={{ background: "#000", border: `6px solid ${P.white}`, padding: 22 }}>
            <Px size={26}>ART SKILL</Px>
            <div style={{ fontSize: 58, marginTop: 10, letterSpacing: 4 }}>⭐<span style={{ opacity: 0.25 }}>⭐⭐⭐⭐</span></div>
            <Px size={22} color={P.gold} style={{ marginTop: 12 }}>1 / 5 😅</Px>
          </div>
        </PopIn>
      )}
    </Arcade>
  );
};

/* 25.6 opened Google AI Studio, uploaded the picture */
const StudioPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const a = 25.6;
  const up = L(27.6, a);
  const k = interpolate(frame, [up, up + 16], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <Arcade tint={P.cyan}>
      <Float3D spin={70} sway={4} tilt={6} style={{ position: "absolute", left: 60, top: 140 }}>
        <FootCard src="b/r12_laptop.mp4" w={960} h={640} pos="50% 30%" label="GOOGLE AI STUDIO" c={P.cyan} />
      </Float3D>
      {frame >= up - 4 && k < 1 && (
        <div style={{ position: "absolute", left: 700 - k * 300, top: 620 - k * 300, width: 220, transform: `rotate(${(1 - k) * 20}deg) scale(${1 - k * 0.6})`, opacity: 1 - k * 0.8, background: "#fff", padding: 10, boxShadow: "8px 8px 0 #000" }}>
          <Img src={staticFile("img/r12_sketch.png")} style={{ width: "100%" }} />
        </div>
      )}
      {frame >= up && <PopIn delay={up + 12} style={{ position: "absolute", left: 560, top: 820 }}><div style={{ background: P.green, padding: "12px 18px", border: "4px solid #000" }}><Px size={24} color="#000" style={{ textShadow: "none" }}>⬆ UPLOADED ✓</Px></div></PopIn>}
    </Arcade>
  );
};

/* 29.6 the real prompt on screen, retyped big in pixel font so it is readable */
const PromptPanel: React.FC = () => {
  const a = 29.6;
  return (
    <Arcade tint={P.pink}>
      <Float3D spin={-60} sway={4} tilt={-8} style={{ position: "absolute", left: 40, top: 110 }}>
        <FootCard src="b/r12_prompt.mp4" w={440} h={760} pos="50% 40%" label="MY PROMPT" c={P.pink} />
      </Float3D>
      <PopIn delay={8} from="right" style={{ position: "absolute", left: 520, right: 40, top: 220 }}>
        <div style={{ background: "#000", border: `6px solid ${P.white}`, padding: "26px 22px", boxShadow: "10px 10px 0 #000" }}>
          <Px size={22} color={P.cyan}>&gt; PROMPT</Px>
          <Px size={28} style={{ marginTop: 16, lineHeight: 1.6 }}><PixType text="Create a complete, fun, playable 2D browser game using my hand-drawn character" delay={L(29.7, a)} cps={20} /></Px>
        </div>
      </PopIn>
    </Arcade>
  );
};

/* 35.0 "guys, look at this": the sketch lifts off the paper and turns into the game character */
const AlivePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const morph = 22;
  const lift = interpolate(frame, [0, morph], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pop = interpolate(frame, [morph, morph + 12], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const wob = Math.sin(frame / 2.5) * 6 * (1 - pop);
  return (
    <Arcade tint={P.gold}>
      <div style={{ position: "absolute", left: 140, right: 140, top: 140, height: 680, background: "#E9E4D8", boxShadow: "inset 0 0 60px rgba(0,0,0,0.25), 12px 12px 0 #000", transform: "rotate(-2deg)" }} />
      {pop < 1 && (
        <div style={{ position: "absolute", left: 300, top: 190, width: 480, transform: `perspective(1000px) translateZ(${lift * 260}px) rotateY(${lift * 360}deg) rotate(${wob}deg) scale(${1 - pop})`, filter: `drop-shadow(0 ${10 + lift * 40}px ${10 + lift * 30}px rgba(0,0,0,0.5)) brightness(${1 + lift * 0.8})` }}>
          <Img src={staticFile("img/r12_sketch.png")} style={{ width: "100%" }} />
        </div>
      )}
      {frame >= morph && (
        <>
          <Flash dur={8} />
          {Array.from({ length: 16 }).map((_, i) => {
            const an = (i / 16) * Math.PI * 2, r = interpolate(frame - morph, [0, 16], [40, 460], clamp);
            return <div key={i} style={{ position: "absolute", left: 530 + Math.cos(an) * r, top: 470 + Math.sin(an) * r * 0.75, width: 18, height: 18, background: [P.gold, P.pink, P.cyan, P.green][i % 4], opacity: interpolate(frame - morph, [8, 20], [1, 0], clamp) }} />;
          })}
          <div style={{ position: "absolute", left: 330, top: 210, width: 420, height: 500, transform: `scale(${pop}) translateY(${Math.sin(frame / 5) * 10}px)`, border: `8px solid ${P.gold}`, background: "#8FD3FF", overflow: "hidden", boxShadow: `0 0 60px ${P.gold}, 12px 12px 0 #000` }}>
            <Img src={staticFile("img/r12_sprite.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 45%" }} />
          </div>
          <PopIn delay={morph + 8} style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center" }}><Px size={46} color={P.gold}>IT'S ALIVE! ⚡</Px></PopIn>
        </>
      )}
    </Arcade>
  );
};

/* face in a round window, tracked, for the full-screen gameplay */
const FacePip: React.FC<{ offset: number }> = ({ offset }) => {
  const frame = useCurrentFrame();
  const t = (frame + offset) / FPS;
  const i = Math.max(0, FT.t.findIndex((x) => x > t) - 1);
  const cy = FT.cy[i], cx = (FT.cx ?? [])[i] ?? 540;
  const s = 0.62, size = 340;
  return (
    <div style={{ position: "absolute", right: 36, bottom: 280, width: size, height: size, borderRadius: size, overflow: "hidden", border: `8px solid ${P.gold}`, boxShadow: "8px 8px 0 #000", background: "#000" }}>
      <OffthreadVideo src={staticFile(VID)} muted startFrom={offset} style={{ position: "absolute", width: 1080 * s, height: 1920 * s, left: size / 2 - cx * s, top: size / 2 - cy * s }} />
    </div>
  );
};

/* 36.7 full-screen gameplay with a HUD that reacts to what he says */
const GamePanel: React.FC<{ offset: number }> = ({ offset }) => {
  /* full screen, from Kalyan's screen recording: the title screen first, then gameplay cropped to 9:16 around his character */
  const frame = useCurrentFrame();
  const a = 36.65;
  const play = L(37.85, a);
  const lvl = L(41.8, a);
  const tz = interpolate(frame, [0, play], [1.0, 1.08], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {frame < play ? (
        <AbsoluteFill>
          <OffthreadVideo src={staticFile("b/r12_title.mp4")} muted startFrom={90} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(24px) brightness(0.7)", transform: "scale(1.1)" }} />
          <div style={{ position: "absolute", left: -140, right: -140, top: 520, transform: `scale(${tz})` }}>
            <OffthreadVideo src={staticFile("b/r12_title.mp4")} muted startFrom={90} style={{ width: "100%", display: "block", boxShadow: "0 30px 80px #000a" }} />
          </div>
          <PopIn delay={2} style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}><div style={{ display: "inline-block", background: "#000c", border: `6px solid ${P.pink}`, padding: "16px 22px" }}><Px size={38} color={P.pink}>MY DRAWING IS PLAYABLE!</Px></div></PopIn>
        </AbsoluteFill>
      ) : (
        <Sequence from={play} layout="none">
          <OffthreadVideo src={staticFile("b/r12_game_full.mp4")} muted startFrom={60} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        </Sequence>
      )}
      {frame >= L(39.6, a) && frame < L(40.3, a) && <PopIn delay={L(39.6, a)} style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}><Px size={80} color={P.cyan}>JUMP!</Px></PopIn>}
      {frame >= L(40.3, a) && frame < lvl && <PopIn delay={L(40.3, a)} style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}><Px size={64} color={P.gold}>+ COINS 🪙</Px></PopIn>}
      {frame >= lvl && <PopIn delay={lvl} style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center" }}><div style={{ display: "inline-block", background: "#000", border: `6px solid ${P.green}`, padding: "16px 22px", boxShadow: `0 0 30px ${P.green}` }}><Px size={34} color={P.green}>3 LEVELS · JUST ASK AI</Px></div></PopIn>}
      <FacePip offset={offset} />
    </AbsoluteFill>
  );
};

/* 43.4 "I didn't have to write the code myself" */
const NoCodePanel: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Arcade tint={P.green}>
      <PopIn style={{ position: "absolute", left: 60, right: 60, top: 170 }}>
        <div style={{ background: "#000", border: `6px solid ${P.white}`, padding: "28px 26px", textAlign: "center", boxShadow: "12px 12px 0 #000" }}>
          <Px size={28}>LINES OF CODE</Px>
          <Px size={28}>I WROTE MYSELF:</Px>
          <Px size={170} color={P.green} style={{ marginTop: 20, transform: `scale(${1 + Math.max(0, 1 - frame / 10) * 0.6})` }}>0</Px>
        </div>
      </PopIn>
      <PopIn delay={L(45.3, 43.4)} style={{ position: "absolute", left: 0, right: 0, top: 740, display: "flex", justifyContent: "center" }}><Chip bg={P.cyan} size={40}>🤖 AI wrote it from my prompt</Chip></PopIn>
    </Arcade>
  );
};

/* 46.8 the emotional payoff: achievement unlocked, over his face */
const Achievement: React.FC = () => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 12], [-260, 0], { ...clamp, easing: ease });
  return (
    <>
      <div style={{ position: "absolute", left: 40, right: 40, top: 150 + y, display: "flex", alignItems: "center", gap: 22, background: "linear-gradient(90deg,#111,#2a2a2a)", border: `5px solid ${P.gold}`, borderRadius: 999, padding: "18px 30px 18px 18px", boxShadow: `0 0 50px ${P.gold}88, 0 20px 40px #0008` }}>
        <div style={{ width: 120, height: 120, borderRadius: 999, background: P.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 74 }}>🏆</div>
        <div>
          <Px size={22} color={P.gold}>ACHIEVEMENT UNLOCKED</Px>
          <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 50, color: "#fff", marginTop: 8 }}>Made my first game</div>
        </div>
      </div>
      {Array.from({ length: 30 }).map((_, i) => {
        const x = (i * 97) % 1080, sp = 5 + (i % 5) * 2, yy = -40 + ((frame - 6) * sp + i * 37) % 1100;
        return frame > 6 ? <div key={i} style={{ position: "absolute", left: x, top: yy, width: 16, height: 16, background: [P.gold, P.pink, P.cyan, P.green][i % 4], transform: `rotate(${frame * 9 + i * 20}deg)` }} /> : null;
      })}
    </>
  );
};

const PixBanner: React.FC<{ text: string; color?: string }> = ({ text, color = P.green }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 8], [-1100, 0], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center", transform: `translateX(${x}px)` }}>
      <div style={{ background: "#000", border: `6px solid ${color}`, padding: "20px 30px", boxShadow: `0 0 40px ${color}, 10px 10px 0 #000` }}><Blink every={10}><Px size={48} color={color}>{text}</Px></Blink></div>
    </div>
  );
};

type Seg = { a: number; b: number; split?: React.FC; accent?: string; over?: React.ReactNode; full?: (offset: number) => React.ReactNode };
const SEGS: Seg[] = [
  { a: 0, b: 3.45, split: YoungPanel, accent: P.pink },
  { a: 3.45, b: 7.3, split: ThinkPanel, accent: P.cyan },
  { a: 7.3, b: 9.45, split: GameOverPanel, accent: P.red },
  { a: 9.45, b: 15.55, split: CodingPanel, accent: P.red },
  { a: 15.6, b: 17.75, over: <PixBanner text="▶ NEW GAME" /> },
  { a: 17.75, b: 20.1, split: AIJoinPanel, accent: P.cyan },
  { a: 20.1, b: 25.55, split: DrawPanel, accent: P.gold },
  { a: 25.55, b: 29.5, split: StudioPanel, accent: P.cyan },
  { a: 29.5, b: 34.95, split: PromptPanel, accent: P.pink },
  { a: 34.95, b: 36.65, full: () => <AbsoluteFill><ArcadeBg tint={P.gold} /><div style={{ position: "absolute", left: 0, top: 380, width: 1080, height: 960, transform: "scale(1.35)", transformOrigin: "50% 40%" }}><AlivePanel /></div><CRT /></AbsoluteFill> },
  { a: 36.65, b: 43.35, full: (o) => <GamePanel offset={o} /> },
  { a: 43.35, b: 46.7, split: NoCodePanel, accent: P.green },
  { a: 46.7, b: 50.6, over: <Achievement /> },
  { a: 50.6, b: 56.1, split: () => <CommentPanel word="GAME" title="💬 Comment GAME for my prompt" typeAt={L(53.3, 50.6)} sentAt={L(53.9, 50.6)} replyAt={L(55.0, 50.6)} reply="📩 aiwithkalyan: here's the prompt I used!" />, accent: P.gold },
  { a: 56.1, b: END, over: <Follow top={170} /> },
];
const SEGS_T = SEGS.map((s) => ({ ...s, a: T(s.a), b: s.b === END ? END : T(s.b) }));
const isSplit = (t: number) => SEGS_T.some((s) => (s.split || s.full) && t >= s.a && t < s.b);
const chunks = chunkWords(D.words, 3, 16);

export const Reel12: React.FC = () => {
  /* one 8-bit sound family, each tied to something that appears on screen */
  const sfx: [number, string, number?][] = [
    [0.0, "8bit_start", 0.3], [2.6, "8bit_powerup", 0.3], [3.45, "8bit_select", 0.3], [7.3, "8bit_gameover", 0.35],
    [9.45, "8bit_select", 0.25], [12.8, "8bit_explode", 0.18], [15.6, "8bit_start", 0.3], [18.3, "8bit_powerup", 0.3],
    [20.1, "8bit_select", 0.25], [23.3, "8bit_jump", 0.25], [25.55, "8bit_select", 0.25], [27.6, "8bit_powerup", 0.22],
    [29.5, "8bit_select", 0.25], [34.95, "8bit_powerup", 0.3], [35.7, "8bit_levelup", 0.35],
    [37.85, "8bit_start", 0.25], [39.6, "8bit_jump", 0.3], [40.3, "8bit_coin", 0.3], [40.6, "8bit_coin", 0.3], [40.9, "8bit_coin", 0.3], [41.8, "8bit_levelup", 0.32],
    [43.35, "8bit_select", 0.25], [46.7, "8bit_levelup", 0.35], [50.6, "8bit_select", 0.25], [53.9, "8bit_coin", 0.3], [55.0, "notify", 0.3], [57.0, "8bit_select", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OffthreadVideo src={staticFile(VID)} muted style={{ width: "100%", height: "100%" }} />
      {SEGS_T.map((s, i) => (
        <Sequence key={i} from={f(s.a)} durationInFrames={Math.max(1, f(s.b) - f(s.a))}>
          {s.split ? <Split video={VID} face={FT} offset={f(s.a)} accent={s.accent}><s.split /></Split> : s.full ? s.full(f(s.a)) : s.over}
        </Sequence>
      ))}
      <Captions chunks={chunks} isSplit={isSplit} hi={P.gold} />
      <Audio src={staticFile(VID)} />
      <Music src="r/r12_music.wav" total={END} base={0.075} boosts={[[T(46.7), T(50.5), 0.12], [T(56.0), END, 0.12]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={T(t)} name={n} vol={v ?? 0.3} />)}
    </AbsoluteFill>
  );
};

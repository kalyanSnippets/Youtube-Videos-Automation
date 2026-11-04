import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, Easing } from "remotion";
import data from "../public/r/r1_words.json";
import {
  Aroll, chunkWords, activeChunk, Clip, Cursor, f, FPS, GridBg, INTER, MacWindow, MONO, Music, Pic, PopIn, ReelData,
  Sfx, SubscribeCard, Typewriter, Counter, Credit, Flash,
} from "./lib";

const D = data as ReelData;
export const R1_FRAMES = Math.ceil(D.duration * FPS);

const C = {
  bg: "#F5F5F3", grid: "#E7E7E2", orange: "#CC785C", terra: "#DE6C52", dark: "#1E1E1E", green: "#34C759", red: "#FF3B30",
  ink: "#1A1A1A", mute: "#6E6E68",
};
const GAP0 = 29.47, GAP1 = 32.67;

type Mode = "split" | "face" | "full";
type Scene = { a: number; b: number; mode: Mode; top?: React.FC };

/* ---------------- graphics ---------------- */
const Pixel: React.FC<{ size?: number; color?: string; bob?: boolean }> = ({ size = 12, color = C.terra, bob = true }) => {
  const frame = useCurrentFrame();
  const map = ["..XXXX..", ".XXXXXX.", "XX.XX.XX", "XXXXXXXX", ".XXXXXX.", ".X.XX.X.", "X......X"];
  const y = bob ? Math.sin(frame / 5) * 4 : 0;
  return (
    <div style={{ transform: `translateY(${y}px)`, display: "grid", gridTemplateColumns: `repeat(8, ${size}px)` }}>
      {map.join("").split("").map((c, i) => (
        <div key={i} style={{ width: size, height: size, background: c === "X" ? color : "transparent" }} />
      ))}
    </div>
  );
};

const MiniBoard: React.FC<{ tint?: string; label: string; dim?: boolean; animate?: boolean }> = ({ tint = C.orange, label, dim, animate }) => {
  const frame = useCurrentFrame();
  const cols = [["Design", "Specs"], ["Build", "Tests", "Docs"], ["Ship"]];
  const move = animate ? interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }) : 0;
  return (
    <div style={{ background: "#fff", borderRadius: 24, padding: 22, width: 430, boxShadow: "0 14px 34px rgba(0,0,0,0.08)", opacity: dim ? 0.55 : 1, border: "1px solid #e8e8e2" }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 24, color: C.mute, marginBottom: 14 }}>{label}</div>
      <div style={{ display: "flex", gap: 12, position: "relative" }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{ flex: 1, background: "#F2F2EE", borderRadius: 14, padding: 10, minHeight: 210, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 10, width: 60, borderRadius: 5, background: tint, opacity: 0.8 }} />
            {col.map((c, i) => (
              <div key={c} style={{ background: "#fff", borderRadius: 10, padding: "10px 10px", fontFamily: INTER, fontSize: 20, fontWeight: 600, color: C.ink,
                transform: ci === 1 && i === 0 ? `translate(${move * 140}px, ${move * -0}px)` : undefined, boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>{c}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const Scanner: React.FC = () => {
  const frame = useCurrentFrame();
  const slide = interpolate(frame, [0, 22], [-420, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });
  const beam = interpolate(frame, [26, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(frame, [74, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 70, display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 64, color: C.ink }}>STUDY</div>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 64, color: C.orange }}>→</div>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 64, color: C.ink, opacity: out ? 1 : 0.25 }}>REBUILD</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 80, transform: "scale(1.0)" }}>
        <div style={{ transform: `translateX(${slide}px) scale(0.92)` }}>
          <MiniBoard label="existing app" />
        </div>
        <div style={{ position: "relative", width: 150, height: 330, borderRadius: 24, background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(0,0,0,0.25)" }}>
          <div style={{ position: "absolute", top: 20, width: 100, height: 14, borderRadius: 7, background: "#333" }} />
          <div style={{ position: "absolute", top: 40 + beam * 250, left: 10, right: 10, height: 6, background: C.green, boxShadow: `0 0 24px ${C.green}`, opacity: beam > 0 && beam < 1 ? 1 : 0.2 }} />
          <div style={{ position: "absolute", bottom: 18 }}><Pixel size={9} color={C.orange} /></div>
        </div>
        <div style={{ transform: `scale(${0.92 * out}) rotate(${(1 - out) * -8}deg)`, opacity: out }}>
          <div style={{ width: 430, height: 300, borderRadius: 24, background: "#1D4ED8", padding: 22, backgroundImage: "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)", backgroundSize: "28px 28px" }}>
            <div style={{ fontFamily: MONO, color: "#fff", fontSize: 26, fontWeight: 700 }}>blueprint.md</div>
            {["boards → lists → cards", "drag & drop", "labels · due dates", "local storage"].map((l, i) => (
              <div key={l} style={{ fontFamily: MONO, color: "#dbe6ff", fontSize: 24, marginTop: 14, opacity: frame > 84 + i * 5 ? 1 : 0 }}>• {l}</div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ReaRepo: React.FC = () => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [30, 70], [1, 1.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <PopIn from="up" style={{ position: "absolute", top: 60 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", background: C.dark, color: "#fff", borderRadius: 999, padding: "14px 30px", fontFamily: MONO, fontWeight: 800, fontSize: 36 }}>
          <Pixel size={6} color={C.orange} bob={false} /> REA · Reverse Engineer Anything
        </div>
      </PopIn>
      <PopIn delay={4} style={{ marginTop: 70 }}>
        <MacWindow title="github.com/morluto/rea" dark style={{ width: 960 }} bodyStyle={{ padding: 0 }}>
          <div style={{ width: 960, height: 520, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: "88% 18%" }}>
              <Clip src="b/rea_screen.mp4" startFrom={0.5} kenBurns={0} style={{ width: 960, height: 520 }} fit="cover" />
            </div>
          </div>
        </MacWindow>
      </PopIn>
      <PopIn delay={70} style={{ position: "absolute", right: 70, bottom: 120 }}>
        <div style={{ background: "#fff", borderRadius: 22, padding: "16px 26px", boxShadow: "0 14px 40px rgba(0,0,0,0.18)", fontFamily: INTER, fontWeight: 800, fontSize: 40, color: C.ink, display: "flex", gap: 10, alignItems: "center" }}>
          ⭐ <Counter to={399} delay={70} dur={20} />k stars
        </div>
      </PopIn>
      <Credit text="Screen recording: github.com/morluto/rea" color="#fff" bottom={24} />
    </AbsoluteFill>
  );
};

const HypeMeter: React.FC = () => {
  const frame = useCurrentFrame();
  const needle = interpolate(frame, [0, 20, 40, 60, 80, 110, 140], [-70, 60, -40, 50, -20, 30, 0], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 220 }}>
      <PopIn><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 64, color: C.ink, textAlign: "center", lineHeight: 1.15 }}>DOES IT<br /><span style={{ color: C.orange }}>ACTUALLY WORK?</span></div></PopIn>
      <div style={{ position: "relative", width: 760, height: 400, marginTop: 70 }}>
        <svg width={760} height={400} viewBox="0 0 760 400">
          <path d="M 60 380 A 320 320 0 0 1 380 60" stroke={C.green} strokeWidth={46} fill="none" strokeLinecap="round" />
          <path d="M 380 60 A 320 320 0 0 1 700 380" stroke={C.red} strokeWidth={46} fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", left: 380 - 8, top: 90, width: 16, height: 290, background: C.dark, borderRadius: 8, transformOrigin: "50% 100%", transform: `rotate(${needle}deg)` }} />
        <div style={{ position: "absolute", left: 380 - 34, top: 346, width: 68, height: 68, borderRadius: 34, background: C.dark }} />
      </div>
      <div style={{ display: "flex", gap: 60, marginTop: 40 }}>
        <PopIn delay={10}><div style={{ background: C.green, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 44, padding: "18px 34px", borderRadius: 20 }}>✓ REAL</div></PopIn>
        <PopIn delay={60}><div style={{ background: C.red, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 44, padding: "18px 34px", borderRadius: 20 }}>✗ OVERHYPED</div></PopIn>
      </div>
    </AbsoluteFill>
  );
};

const WekanCard: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
      <PopIn from="left">
        <MacWindow title="github.com/wekan/wekan" dark={false} style={{ width: 520 }} bodyStyle={{ padding: 0 }}>
          <div style={{ width: 520, height: 560, overflow: "hidden" }}>
            <Pic src="img/wekan_gh_top.png" pos="0% 12%" style={{ transform: "scale(1.5)", transformOrigin: "30% 10%" }} />
          </div>
        </MacWindow>
      </PopIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <PopIn delay={10} from="right"><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 60, color: C.ink }}>WEKAN</div></PopIn>
        {["Open-source Kanban", "MIT licence", "Real, used app"].map((t, i) => (
          <PopIn key={t} delay={18 + i * 7} from="right">
            <div style={{ background: "#fff", border: "1px solid #e4e4de", borderRadius: 16, padding: "12px 20px", fontFamily: INTER, fontWeight: 700, fontSize: 30, color: C.ink }}>✓ {t}</div>
          </PopIn>
        ))}
      </div>
    </div>
    <Credit text="Source: github.com/wekan/wekan" color="#fff" />
  </AbsoluteFill>
);

const PROMPT1 = "Use the REA skill to analyse this website.\nWeb tools only. Don't build anything yet.\nLabel every claim: OBSERVED / INFERRED / NOT SURE.";
const Terminal: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <PopIn>
      <MacWindow title="~/rea-board — claude" dark style={{ width: 960 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: "#d6d6d6", lineHeight: 1.5, minHeight: 470 }}>
          <div><span style={{ color: C.green }}>➜</span> <span style={{ color: "#8ab4f8" }}>~/rea-board</span> claude</div>
          <PopIn delay={8} from="left"><div style={{ margin: "14px 0", display: "inline-block", background: "#2a1f1a", border: `1px solid ${C.orange}`, color: C.orange, borderRadius: 12, padding: "6px 16px", fontWeight: 700 }}>✻ Claude Code  ·  REA skill + MCP connected</div></PopIn>
          <div style={{ color: "#fff" }}>
            <span style={{ color: C.orange }}>&gt; </span>
            <Typewriter text={PROMPT1} delay={16} cps={42} caretColor={C.orange} />
          </div>
        </div>
      </MacWindow>
    </PopIn>
    <div style={{ position: "absolute", top: 40, right: 60 }}><PopIn delay={4}><Pixel color={C.orange} size={10} /></PopIn></div>
    <Credit text="Prompt from the full REA video" color="#fff" />
  </AbsoluteFill>
);

const ThreeStep: React.FC = () => {
  const steps = [["👀", "OBSERVE", "how the app behaves"], ["🧾", "EVIDENCE", "label every claim"], ["🛠", "BUILD", "your own version"]];
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
      <PopIn><div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 58, color: C.ink }}>THE GOAL</div></PopIn>
      <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 50 }}>
        {steps.map(([e, t, s], i) => (
          <PopIn key={t} delay={8 + i * 18} from="left" dist={200}>
            <div style={{ width: 860, display: "flex", alignItems: "center", gap: 30, background: "#fff", borderRadius: 28, padding: "26px 34px", boxShadow: "0 12px 30px rgba(0,0,0,0.07)", border: "1px solid #e6e6e0" }}>
              <div style={{ width: 92, height: 92, borderRadius: 22, background: i === 2 ? C.orange : C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>{e}</div>
              <div>
                <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 46, color: C.ink }}>{i + 1}. {t}</div>
                <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 32, color: C.mute }}>{s}</div>
              </div>
            </div>
          </PopIn>
        ))}
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 44 }}>
        {[["OBSERVED", C.green], ["INFERRED", "#F5A524"], ["NOT SURE", C.red]].map(([t, c], i) => (
          <PopIn key={t} delay={70 + i * 8}><div style={{ border: `3px solid ${c}`, color: c, fontFamily: MONO, fontWeight: 800, fontSize: 30, borderRadius: 14, padding: "8px 18px", background: "#fff" }}>{t}</div></PopIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const WhatHappened: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 40], [0, 100], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
      <Pixel size={16} color={C.orange} />
      <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 56, color: C.ink }}>RUNNING TEST…</div>
      <div style={{ width: 760, height: 40, borderRadius: 20, background: "#e3e3de", overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", background: C.orange }} />
      </div>
    </AbsoluteFill>
  );
};

const GapMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const shots = [
    <MacWindow key="a" title="rea.tools" dark={false} style={{ width: 900 }} bodyStyle={{ padding: 0 }}>
      <div style={{ width: 900, height: 980, overflow: "hidden" }}><Pic src="img/rea_site_hero.png" pos="0% 0%" style={{ transform: "scale(1.3)", transformOrigin: "0 0" }} /></div>
    </MacWindow>,
    <MacWindow key="b" title="rea.tools/showcase" dark={false} style={{ width: 900 }} bodyStyle={{ padding: 0 }}>
      <div style={{ width: 900, height: 980, overflow: "hidden" }}><Pic src="img/rea_show_head.png" pos="0% 0%" style={{ transform: "scale(1.3)", transformOrigin: "0 0" }} /></div>
    </MacWindow>,
  ];
  const idx = frame < 22 ? 0 : frame < 44 ? 1 : 2;
  return (
    <AbsoluteFill>
      <GridBg bg={C.bg} line={C.grid} />
      {idx < 2 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: `scale(${1 + ((frame % 22) / 22) * 0.06}) rotate(${idx ? 1.5 : -1.5}deg)` }}>{shots[idx]}</div>
          <Credit text={idx ? "Source: rea.tools/showcase" : "Source: rea.tools"} color="#fff" />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40 }}>
          <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
            <PopIn from="left"><MiniBoard label="Wekan (original)" /></PopIn>
            <div style={{ fontFamily: MONO, fontSize: 70, fontWeight: 800, color: C.orange }}>⇄</div>
            <PopIn from="right">
              <div style={{ position: "relative" }}>
                <div style={{ filter: "blur(10px)" }}><MiniBoard label="REA Board" tint={C.green} /></div>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 800, fontSize: 140, color: C.ink }}>?</div>
              </div>
            </PopIn>
          </div>
          <PopIn delay={8}><div style={{ background: C.dark, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 40, padding: "18px 30px", borderRadius: 18 }}>FULL RESULT ON MY CHANNEL ▶</div></PopIn>
          <div style={{ fontFamily: INTER, fontSize: 26, color: C.mute }}>Behaviour-inspired, independently built. Not a Wekan clone.</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const Useful: React.FC = () => {
  const frame = useCurrentFrame();
  const mx = interpolate(frame, [10, 60, 110], [180, 620, 300], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 30, transform: "scale(0.95)" }}>
        <PopIn from="left"><MiniBoard label="original" /></PopIn>
        <PopIn from="right" delay={4}><MiniBoard label="rebuilt" tint={C.green} animate /></PopIn>
      </div>
      <div style={{ position: "absolute", left: mx, top: 330, width: 210, height: 210, borderRadius: 105, border: `14px solid ${C.dark}`, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(0px)" }}>
        <div style={{ position: "absolute", right: -70, bottom: -50, width: 100, height: 24, background: C.dark, transform: "rotate(45deg)", borderRadius: 12 }} />
      </div>
      <div style={{ position: "absolute", top: 60, display: "flex", gap: 24 }}>
        <PopIn delay={8}><div style={{ background: C.green, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 40, padding: "14px 26px", borderRadius: 16 }}>USEFUL?</div></PopIn>
        <PopIn delay={60}><div style={{ background: C.dark, color: "#fff", fontFamily: MONO, fontWeight: 800, fontSize: 40, padding: "14px 26px", borderRadius: 16 }}>OR JUST LOOKS SIMILAR?</div></PopIn>
      </div>
    </AbsoluteFill>
  );
};

const AppGrid: React.FC = () => {
  const apps = [["📝", "#FFD60A"], ["📅", "#FF453A"], ["🎵", "#FF2D55"], ["💬", "#34C759"], ["🗺", "#0A84FF"], ["📊", "#30D158"], ["🎨", "#BF5AF2"], ["📷", "#8E8E93"]];
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 70 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 150px)", gap: 30 }}>
        {apps.map(([e, c], i) => (
          <PopIn key={i} delay={i * 3}>
            <div style={{ width: 150, height: 150, borderRadius: 38, background: c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 76, boxShadow: "0 10px 24px rgba(0,0,0,0.15)" }}>{e}</div>
          </PopIn>
        ))}
      </div>
      <PopIn delay={40} from="up" style={{ marginTop: 50 }}>
        <div style={{ width: 860, background: "#fff", borderRadius: 30, padding: "24px 30px", boxShadow: "0 18px 40px rgba(0,0,0,0.12)", display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: C.orange }} />
          <div style={{ fontFamily: INTER, fontSize: 36, fontWeight: 600, color: C.ink }}>
            <Typewriter text="I'd try REA on…" delay={48} cps={18} caretColor={C.orange} />
          </div>
        </div>
      </PopIn>
    </AbsoluteFill>
  );
};

const Checklist: React.FC = () => {
  const items = ["Install & setup", "Prompt 1 · study the app", "Prompt 2 · build my own", "Test every feature"];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <MacWindow title="test-log.md" dark style={{ width: 880 }}>
        {items.map((t, i) => (
          <PopIn key={t} delay={4 + i * 12} from="left">
            <div style={{ display: "flex", gap: 22, alignItems: "center", fontFamily: MONO, fontSize: 38, color: "#eee", padding: "12px 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: C.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>✓</div>
              {t}
            </div>
          </PopIn>
        ))}
      </MacWindow>
    </AbsoluteFill>
  );
};

const VideoCard: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 4) * 0.05;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <PopIn>
        <div style={{ width: 900, background: "#fff", borderRadius: 34, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
          <div style={{ height: 420, background: C.dark, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
            <MiniBoard label="Wekan" dim />
            <div style={{ position: "absolute", width: 150, height: 104, borderRadius: 28, background: "#FF0033", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pulse})` }}>
              <div style={{ width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: "44px solid #fff", marginLeft: 8 }} />
            </div>
            <div style={{ position: "absolute", right: 18, bottom: 16, background: "rgba(0,0,0,.8)", color: "#fff", fontFamily: INTER, fontWeight: 700, fontSize: 26, padding: "4px 10px", borderRadius: 8 }}>FULL VIDEO</div>
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, color: C.ink, lineHeight: 1.2 }}>I Rebuilt a Kanban App with REA in 3 Prompts</div>
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 30, color: C.mute, marginTop: 10 }}>AI with Kalyan · YouTube</div>
          </div>
        </div>
      </PopIn>
    </AbsoluteFill>
  );
};

const Subscribe: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    <PopIn from="up"><SubscribeCard clickAt={30} sub="Real AI experiments, tested honestly" /></PopIn>
    <Cursor path={[[0, 900, 860], [26, 560, 610], [60, 580, 620]]} clicks={[30]} />
  </AbsoluteFill>
);

const SCENES: Scene[] = [
  { a: 0, b: 4.71, mode: "split", top: Scanner },
  { a: 4.71, b: 5.83, mode: "face" },
  { a: 5.83, b: 9.75, mode: "split", top: ReaRepo },
  { a: 9.75, b: 15.6, mode: "full", top: HypeMeter },
  { a: 15.6, b: 18.75, mode: "split", top: WekanCard },
  { a: 18.75, b: 22.95, mode: "split", top: Terminal },
  { a: 22.95, b: 28.0, mode: "full", top: ThreeStep },
  { a: 28.0, b: GAP0, mode: "split", top: WhatHappened },
  { a: GAP0, b: GAP1, mode: "full", top: GapMontage },
  { a: GAP1, b: 37.15, mode: "split", top: Useful },
  { a: 37.15, b: 41.3, mode: "split", top: AppGrid },
  { a: 41.3, b: 43.95, mode: "split", top: Checklist },
  { a: 43.95, b: 47.4, mode: "split", top: VideoCard },
  { a: 47.4, b: D.duration, mode: "split", top: Subscribe },
];

/* ---------------- captions ---------------- */
const chunks = chunkWords(D.words, 3, 16);
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (t >= GAP0 && t < GAP1) return null;
  const c = activeChunk(chunks, t);
  if (!c) return null;
  const sc = SCENES.find((s) => t >= s.a && t < s.b);
  const y = sc?.mode === "split" ? 960 : sc?.mode === "face" ? 1420 : 1620;
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, display: "flex", justifyContent: "center", transform: "translateY(-50%)" }}>
      <div style={{ background: "#1A1A1A", border: "1.5px solid rgba(255,255,255,0.22)", borderRadius: 20, padding: "14px 28px", fontFamily: MONO, fontWeight: 800, fontSize: 50, color: "#fff", letterSpacing: 1, textTransform: "uppercase", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", maxWidth: 980, textAlign: "center" }}>
        {c.words.map((w) => w.w.replace(/[,.]$/, "")).join(" ")}
      </div>
    </div>
  );
};

/* ---------------- main ---------------- */
export const Reel1: React.FC = () => {
  const sfx: [number, string, number?][] = [
    [0.05, "whoosh"], [0.9, "swish", 0.3], [2.4, "click", 0.4], [3.4, "pop"], [4.71, "swish"], [5.83, "whoosh"], [8.2, "pop"], [8.35, "ding", 0.25],
    [9.75, "whoosh"], [10.1, "pop"], [11.75, "pop"], [15.6, "swish"], [16.2, "pop", 0.3], [18.75, "whoosh"], [19.3, "typing", 0.35], [20.7, "typing", 0.35],
    [22.95, "whoosh"], [23.3, "pop"], [23.9, "pop"], [24.5, "pop"], [25.3, "blip", 0.3], [25.55, "blip", 0.3], [25.8, "blip", 0.3], [28.0, "swish"],
    [GAP0, "riser", 0.4], [GAP0 + 0.73, "shutter", 0.4], [GAP0 + 1.47, "shutter", 0.4], [GAP0 + 1.6, "impact", 0.5],
    [GAP1, "whoosh"], [33.0, "pop"], [34.7, "pop"], [37.15, "swish"], [37.3, "blip", 0.25], [37.5, "blip", 0.25], [37.7, "blip", 0.25], [38.8, "typing", 0.3],
    [41.3, "swish"], [41.5, "ding", 0.18], [41.9, "ding", 0.18], [42.3, "ding", 0.18], [42.7, "ding", 0.22], [43.95, "whoosh"], [47.4, "whoosh"], [48.4, "click", 0.6], [48.45, "notify", 0.35],
  ];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <GridBg bg={C.bg} line={C.grid} />
      {SCENES.map((s, i) => {
        const from = f(s.a);
        const dur = Math.max(1, f(s.b) - from);
        const Top = s.top;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {s.mode === "split" && (
              <>
                <AbsoluteFill style={{ height: 960 }}>{Top && <Top />}</AbsoluteFill>
                <Aroll data={D} src="r/r1_aroll.mp4" box={{ x: 0, y: 960, w: 1080, h: 960 }} focusY={900} offset={from} />
              </>
            )}
            {s.mode === "face" && (
              <>
                <Aroll data={D} src="r/r1_aroll.mp4" box={{ x: 0, y: 0, w: 1080, h: 1920 }} focusY={920} zoom={1.35} alternate={false} offset={from} />
                <Flash dur={5} />
              </>
            )}
            {s.mode === "full" && Top && (
              <AbsoluteFill>
                <GridBg bg={C.bg} line={C.grid} />
                <Top />
              </AbsoluteFill>
            )}
          </Sequence>
        );
      })}
      <Captions />
      <Audio src={staticFile("r/r1_aroll.mp4")} />
      <Music src="r/r1_music.wav" total={D.duration} base={0.13} boosts={[[GAP0, GAP1, 0.5]]} />
      {sfx.map(([t, n, v], i) => <Sfx key={i} at={t} name={n} vol={v ?? 0.45} />)}
    </AbsoluteFill>
  );
};

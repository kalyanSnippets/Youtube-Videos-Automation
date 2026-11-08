import React from "react";
import { Composition } from "remotion";
import { Reel1, R1_FRAMES } from "./R1";
import { Reel2, R2_FRAMES } from "./R2";
import { Reel3, R3_FRAMES } from "./R3";
import { Reel4, R4_FRAMES } from "./R4";
import { Reel5, R5_FRAMES } from "./R5";
import { Reel5B, R5B_FRAMES } from "./R5B";
import { Reel6, R6_FRAMES } from "./R6";
import { Reel6B, R6B_FRAMES } from "./R6B";
import { Reel7, R7_FRAMES } from "./R7";
import { Cover } from "./Cover";
import { Cover2 } from "./Cover2";
import { Cover3 } from "./Cover3";

const common = { fps: 30, width: 1080, height: 1920 } as const;
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Reel1-REA" component={Reel1} durationInFrames={R1_FRAMES} {...common} />
    <Composition id="Reel2-Genie4" component={Reel2} durationInFrames={R2_FRAMES} {...common} />
    <Composition id="Reel3-SpaceAI" component={Reel3} durationInFrames={R3_FRAMES} {...common} />
    <Composition id="Reel4-GPT61Terra" component={Reel4} durationInFrames={R4_FRAMES} {...common} />
    <Composition id="Reel5-GoogleVids" component={Reel5} durationInFrames={R5_FRAMES} {...common} />
    <Composition id="Reel5B-GoogleVids-Device" component={Reel5B} durationInFrames={R5B_FRAMES} {...common} />
    <Composition id="Reel6-MoMomentic" component={Reel6} durationInFrames={R6_FRAMES} {...common} />
    <Composition id="Reel6B-MoMomentic-Whiteboard" component={Reel6B} durationInFrames={R6B_FRAMES} {...common} />
    <Composition id="Reel7-TripoCanvas" component={Reel7} durationInFrames={R7_FRAMES} {...common} />
    <Composition id="Cover1" component={Cover} durationInFrames={1} {...common} defaultProps={{ top: "img/cf_top1.png", topPos: "60% 40%", topZoom: 1.25, face: "img/cf_face1.png", faceY: 380, tag: "REA + CLAUDE CODE", line1: "I let AI rebuild", line2: "a real app", accent: "#CC785C" }} />
    <Composition id="Cover2" component={Cover} durationInFrames={1} {...common} defaultProps={{ top: "img/cf_top2.png", face: "img/cf_face2.png", faceY: 380, tag: "GOOGLE GENIE 4", line1: "Type a prompt.", line2: "Walk inside it.", accent: "#3B82F6" }} />
    <Composition id="Cover3" component={Cover} durationInFrames={1} {...common} defaultProps={{ top: "img/cf_top3.png", topPos: "95% 35%", topZoom: 1.15, face: "img/cf_face3.png", faceY: 330, tag: "GEMMA 4 IN ORBIT", line1: "Google put AI", line2: "in SPACE 🛰", accent: "#F2B84B" }} />
    <Composition id="Cover4" component={Cover} durationInFrames={1} {...common} defaultProps={{ top: "img/cf_top4.png", topPos: "50% 45%", topZoom: 1.35, face: "img/cf_face4.png", faceY: 330, tag: "GPT-6.1 TERRA", line1: "This AI reviews", line2: "a whole movie", accent: "#7C3AED" }} />
    <Composition id="NewCover1" component={Cover2} durationInFrames={1} {...common} defaultProps={{ bg: "img/cf_top1.png", card: "img/cf_top1.png", cardPos: "60% 40%", cardZoom: 1.3, face: "img/cut_face1.png", tag: "REA + CLAUDE CODE", line1: "I let AI rebuild", hl: "a REAL app", accent: "#CC785C", emoji: "🤯" }} />
    <Composition id="NewCover2" component={Cover2} durationInFrames={1} {...common} defaultProps={{ bg: "img/cf_top2.png", card: "img/cf_top2.png", face: "img/cut_face2.png", tag: "GOOGLE GENIE 4", line1: "Type a prompt.", hl: "WALK inside it", accent: "#3B82F6", emoji: "🎮" }} />
    <Composition id="NewCover3" component={Cover2} durationInFrames={1} {...common} defaultProps={{ bg: "img/cf_top3.png", bgPos: "90% 40%", card: "img/cf_top3.png", cardPos: "85% 30%", cardZoom: 1.2, face: "img/cut_face3.png", faceW: 1150, faceX: -230, faceY: 150, tag: "GEMMA 4 IN ORBIT", line1: "Google put AI", hl: "in SPACE", accent: "#F2B84B", emoji: "🛰️" }} />
    <Composition id="NewCover4" component={Cover2} durationInFrames={1} {...common} defaultProps={{ bg: "img/cf_top4.png", card: "img/cf_top4.png", cardPos: "50% 45%", cardZoom: 1.35, face: "img/cut_face4.png", faceW: 1150, faceX: -230, faceY: 150, tag: "OPENAI GPT-6.1 TERRA", line1: "This AI reviews", hl: "a WHOLE movie", accent: "#7C3AED", emoji: "🎬" }} />
    <Composition id="VCover1" component={Cover3} durationInFrames={1} {...common} defaultProps={{ portrait: "img/portrait1.png", pill: "REA + Claude Code", pillIcon: "🧊", line1: "AI REBUILT", line2: "A REAL APP", a: { img: "img/card_rea_orig.png", pos: "0% 0%", label: "Original", labelBg: "#3B0764" }, b: { img: "img/card_rea_new.png", pos: "0% 0%", label: "AI Rebuilt", labelBg: "#FFE11A", labelColor: "#111" } }} />
    <Composition id="VCover2" component={Cover3} durationInFrames={1} {...common} defaultProps={{ portrait: "img/portrait2.png", pill: "Google Genie 4", pillIcon: "🎮", line1: "TYPE IT.", line2: "WALK INSIDE", a: { node: "prompt", prompt: "a neon city at night with flying cars", label: "1 Prompt", labelBg: "#3B0764" }, b: { img: "img/card_genie_world.png", label: "Playable World", labelBg: "#FFE11A", labelColor: "#111" } }} />
    <Composition id="VCover3" component={Cover3} durationInFrames={1} {...common} defaultProps={{ portrait: "img/portrait3.png", pill: "Google Gemma 4", pillIcon: "🛰️", line1: "AI IN SPACE", line2: "WROTE THIS", a: { img: "img/suncatcher_hero.png", label: "AI Satellite", labelBg: "#3B0764" }, b: { node: "poem", label: "Its Poem", labelBg: "#FFE11A", labelColor: "#111" } }} />
    <Composition id="VCover4" component={Cover3} durationInFrames={1} {...common} defaultProps={{ portrait: "img/portrait4.png", pW: 1600, pX: -520, cardsTop: 760, layout: "row", pill: "OpenAI GPT-6.1 Terra", pillIcon: "🎬", line1: "AI REVIEWS", line2: "A WHOLE MOVIE", a: { img: "img/card_film.png", label: "Whole Movie", labelBg: "#3B0764" }, b: { node: "report", label: "AI Review", labelBg: "#FFE11A", labelColor: "#111" } }} />
    <Composition id="VCover5" component={Cover3} durationInFrames={1} {...common} defaultProps={{ portrait: "img/portrait3.png", pill: "Google Vids · Gemini Omni", pillIcon: "🎬", line1: "FREE AI VIDEOS", line2: "IN GOOGLE VIDS", a: { node: "prompt", prompt: "a tiny robot walking through a futuristic city at night", promptLabel: "Google Vids · prompt", label: "1 Prompt", labelBg: "#3B0764" }, b: { img: "img/card_vids_robot.png", pos: "50% 60%", label: "FREE AI Video", labelBg: "#FFE11A", labelColor: "#111" } }} />
    <Composition id="VCover6" component={Cover3} durationInFrames={1} {...common} defaultProps={{ portrait: "img/portrait1.png", pX: -170, pW: 820, pill: "Momentic Mo", pillIcon: "🐞", line1: "AI TESTS YOUR", line2: "WEBSITE", a: { img: "img/card_mo_fail.png", pos: "50% 100%", label: "Broken Checkout", labelBg: "#3B0764" }, b: { node: "bugs", label: "AI Found It", labelBg: "#FFE11A", labelColor: "#111" } }} />
    <Composition id="VCover7" component={Cover3} durationInFrames={1} {...common} defaultProps={{ portrait: "img/portrait4.png", pW: 1600, pX: -520, cardsTop: 760, layout: "row", pill: "Tripo AI Agentic Canvas", pillIcon: "🧊", line1: "MY DRAWING", line2: "→ 3D CHARACTER", a: { img: "img/card_tripo_sketch.png", pos: "50% 40%", label: "My Drawing", labelBg: "#3B0764" }, b: { img: "img/card_tripo_3d.png", pos: "50% 45%", label: "3D Character", labelBg: "#FFE11A", labelColor: "#111" } }} />
  </>
);

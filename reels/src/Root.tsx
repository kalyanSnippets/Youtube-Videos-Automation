import React from "react";
import { Composition } from "remotion";
import { Reel1, R1_FRAMES } from "./R1";
import { Reel2, R2_FRAMES } from "./R2";
import { Reel3, R3_FRAMES } from "./R3";
import { Reel4, R4_FRAMES } from "./R4";
import { Cover } from "./Cover";

const common = { fps: 30, width: 1080, height: 1920 } as const;
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Reel1-REA" component={Reel1} durationInFrames={R1_FRAMES} {...common} />
    <Composition id="Reel2-Genie4" component={Reel2} durationInFrames={R2_FRAMES} {...common} />
    <Composition id="Reel3-SpaceAI" component={Reel3} durationInFrames={R3_FRAMES} {...common} />
    <Composition id="Reel4-GPT61Terra" component={Reel4} durationInFrames={R4_FRAMES} {...common} />
    <Composition id="Cover1" component={Cover} durationInFrames={1} {...common} defaultProps={{ top: "img/cf_top1.png", topPos: "60% 40%", topZoom: 1.25, face: "img/cf_face1.png", faceY: 380, tag: "REA + CLAUDE CODE", line1: "I let AI rebuild", line2: "a real app", accent: "#CC785C" }} />
    <Composition id="Cover2" component={Cover} durationInFrames={1} {...common} defaultProps={{ top: "img/cf_top2.png", face: "img/cf_face2.png", faceY: 380, tag: "GOOGLE GENIE 4", line1: "Type a prompt.", line2: "Walk inside it.", accent: "#3B82F6" }} />
    <Composition id="Cover3" component={Cover} durationInFrames={1} {...common} defaultProps={{ top: "img/cf_top3.png", topPos: "95% 35%", topZoom: 1.15, face: "img/cf_face3.png", faceY: 330, tag: "GEMMA 4 IN ORBIT", line1: "Google put AI", line2: "in SPACE 🛰", accent: "#F2B84B" }} />
    <Composition id="Cover4" component={Cover} durationInFrames={1} {...common} defaultProps={{ top: "img/cf_top4.png", topPos: "50% 45%", topZoom: 1.35, face: "img/cf_face4.png", faceY: 330, tag: "GPT-6.1 TERRA", line1: "This AI reviews", line2: "a whole movie", accent: "#7C3AED" }} />
  </>
);

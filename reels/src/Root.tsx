import React from "react";
import { Composition } from "remotion";
import { Reel1, R1_FRAMES } from "./R1";
import { Reel2, R2_FRAMES } from "./R2";
import { Reel3, R3_FRAMES } from "./R3";
import { Reel4, R4_FRAMES } from "./R4";

const common = { fps: 30, width: 1080, height: 1920 } as const;
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Reel1-REA" component={Reel1} durationInFrames={R1_FRAMES} {...common} />
    <Composition id="Reel2-Genie4" component={Reel2} durationInFrames={R2_FRAMES} {...common} />
    <Composition id="Reel3-SpaceAI" component={Reel3} durationInFrames={R3_FRAMES} {...common} />
    <Composition id="Reel4-GPT61Terra" component={Reel4} durationInFrames={R4_FRAMES} {...common} />
  </>
);

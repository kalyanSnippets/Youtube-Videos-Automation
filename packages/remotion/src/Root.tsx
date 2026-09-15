import React from "react";
import { Composition } from "remotion";
import { HyperHook } from "./components/HyperHook";
import { HyperTitle } from "./components/HyperTitle";
import { KeywordBurst } from "./components/KeywordBurst";
import { StatCounter } from "./components/StatCounter";
import { ScoreCard } from "./components/ScoreCard";
import { Checklist } from "./components/Checklist";
import { RankingStack } from "./components/RankingStack";
import { WarningReveal } from "./components/WarningReveal";
import { Comparison } from "./components/Comparison";
import { CTA } from "./components/CTA";
import { EndScreen } from "./components/EndScreen";
import { BrowserFrame } from "./components/BrowserFrame";
import { TalkingHeadFrame } from "./components/TalkingHeadFrame";
import { PictureInPicture } from "./components/PictureInPicture";
import { CreatorLowerThird } from "./components/CreatorLowerThird";
import { CreatorReaction } from "./components/CreatorReaction";
import { ScreenAndFaceSplit } from "./components/ScreenAndFaceSplit";
import { PunchIn } from "./components/PunchIn";
import { ArollToDemoTransition } from "./components/ArollToDemoTransition";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<any, any>
        id="HyperHook"
        component={HyperHook}
        durationInFrames={60}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ line1: "Everyone says this AI tool is free.", line2: "It isn't." }}
      />
      <Composition<any, any>
        id="HyperTitle"
        component={HyperTitle}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ title: "The Free Plan Reality", subtitle: "What the pricing page doesn't say" }}
      />
      <Composition<any, any>
        id="KeywordBurst"
        component={KeywordBurst}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ keywords: ["FREE?", "NOT QUITE.", "HERE'S PROOF."] }}
      />
      <Composition<any, any>
        id="StatCounter"
        component={StatCounter}
        durationInFrames={60}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ label: "generations before the paywall", fromValue: 0, toValue: 5 }}
      />
      <Composition<any, any>
        id="ScoreCard"
        component={ScoreCard}
        durationInFrames={120}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          title: "Free Plan Score",
          rows: [
            { label: "Output quality", score: 72 },
            { label: "Speed", score: 58 },
            { label: "Reliability", score: 64 },
          ],
        }}
      />
      <Composition<any, any>
        id="Checklist"
        component={Checklist}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ title: "What we verified", items: ["Official pricing page", "3 independent reviews", "Our own test run"] }}
      />
      <Composition<any, any>
        id="RankingStack"
        component={RankingStack}
        durationInFrames={120}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          title: "Best free AI video tools",
          ranked: [
            { label: "Tool A", sublabel: "Best overall free tier" },
            { label: "Tool B", sublabel: "Fastest renders" },
            { label: "Tool C", sublabel: "Best for beginners" },
          ],
        }}
      />
      <Composition<any, any>
        id="WarningReveal"
        component={WarningReveal}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ headline: "The free tier resets weekly, not daily", detail: "Confirmed on the official pricing page as of this recording." }}
      />
      <Composition<any, any>
        id="Comparison"
        component={Comparison}
        durationInFrames={120}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{
          leftLabel: "Tool A",
          rightLabel: "Tool B",
          rows: [
            { criterion: "Free generations", left: "5/week", right: "3/day" },
            { criterion: "Max resolution", left: "1080p", right: "720p" },
          ],
        }}
      />
      <Composition<any, any> id="CTA" component={CTA} durationInFrames={60} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ message: "Subscribe for the full breakdown", subMessage: "New comparisons every week" }} />
      <Composition<any, any>
        id="EndScreen"
        component={EndScreen}
        durationInFrames={150}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ channelName: "the channel", nextVideoTitle: "We tested 5 more free AI tools" }}
      />
      <Composition<any, any> id="BrowserFrame" component={BrowserFrame} durationInFrames={150} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ url: "app.example.com/pricing" }} />
      <Composition<any, any>
        id="TalkingHeadFrame"
        component={TalkingHeadFrame}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ captionText: "I tested seven tools this week." }}
      />
      <Composition<any, any> id="PictureInPicture" component={PictureInPicture} durationInFrames={150} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ position: "bottom-right", sizePercent: 22 }} />
      <Composition<any, any>
        id="CreatorLowerThird"
        component={CreatorLowerThird}
        durationInFrames={120}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ name: "Alex", context: "Testing free AI tools" }}
      />
      <Composition<any, any> id="CreatorReaction" component={CreatorReaction} durationInFrames={60} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ position: "bottom-right" }} />
      <Composition<any, any>
        id="ScreenAndFaceSplit"
        component={ScreenAndFaceSplit}
        durationInFrames={150}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ faceLabel: "Creator", screenLabel: "Live demo", facePosition: "left" }}
      />
      <Composition<any, any> id="PunchIn" component={PunchIn} durationInFrames={40} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ fromScale: 1, toScale: 1.15, startFrame: 5, durationFrames: 20 }} />
      <Composition<any, any>
        id="ArollToDemoTransition"
        component={ArollToDemoTransition}
        durationInFrames={24}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ fromLabel: "CREATOR", toLabel: "DEMO" }}
      />
    </>
  );
};

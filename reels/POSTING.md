# AI with Kalyan: 4 reels, posting notes

Each reel has its own editing style, built from the reference reel you approved.

| Reel | Style | Reference | Palette |
|---|---|---|---|
| 1 · REA test | Demo Lab: 50/50 split, graphics on top, mono captions in a dark pill on the split line | @opusjake | Off-white grid, Claude orange, terminal black |
| 2 · Genie 4 | World Reveal: alternating dark/light grids, full-screen Genie footage, keyword boxes, face card | @fullstackpeter | Black, electric blue, green, coral |
| 3 · AI in space | Space Documentary: 70% footage / 30% speaker, serif headlines, haiku "downlink" | @vaibhavsisinty | Deep navy, sage green, amber |
| 4 · GPT-6.1 Terra | Editor's Timeline: 50/50 split, serif italic captions, series badge, full-screen CTA | @rahuliyer.ai | Purple, amber, mint, off-white |

---

## Reel 1: REA, reverse engineer anything
**Caption:** Can AI study a real app and rebuild it? I tested REA + Claude Code on Wekan, an open-source Kanban app. Full test on my channel. Which app would you try it on? 👇

**Description credits:** REA: github.com/morluto/rea · Wekan (MIT): github.com/wekan/wekan. This video uses REA to study the publicly visible behaviour of an open-source Wekan demo and build an independent example called REA Board. It does not copy Wekan source code, branding or user data, and is not affiliated with Wekan, REA or Anthropic.

## Reel 2: Google Genie 4
**Caption:** One prompt → a world you can walk around in. Google DeepMind's Genie 4 (research preview). What would you type? 👇

**Credits:** Genie 4 demo footage: Google DeepMind (deepmind.google). News: TechCrunch.

## Reel 3: Google runs AI in space
**Caption:** Google sent a prompt to a satellite and Gemma 4 wrote a haiku in orbit 🛰 Genius or unnecessary? 👇

**Credits:** Project Suncatcher image and haiku: blog.google. Earth and launch footage: NASA (public domain; the launch shown is archival, not the Suncatcher launch).

## Reel 4: GPT-6.1 Terra reviews a movie
**Caption:** OpenAI's GPT-6.1 Terra was tested on reviewing an animated film shot by shot. Imagine that for your own videos. Comment EDIT for my AI review prompt ✂️

**Credits (required by CC BY 3.0):** "Sintel" © Blender Foundation | durian.blender.org, licensed CC BY 3.0. Used as stand-in footage; not OpenAI's test material. News: BleepingComputer. The on-screen review report is an illustration.

---

## Fact-check notes
- REA explains how an app works, with evidence. Claude Code writes the new app. The reel says "rebuilt", and the on-screen text keeps it honest ("behaviour-inspired, independently built").
- Genie 4 is a research preview for trusted testers (waitlist). Your "futuristic city" line is framed as "imagine", which is correct.
- Suncatcher: launched Oct 1, 2026, 4 Trillium TPUs, prompt = haiku about being in space, received over Svalbard. Haiku: "Blue marble below / Data streams in silent grace / Starlight feeds my core."
- GPT-6.1 Terra (Oct 26, 2026): the film review was a benchmark task (Agents' Last Exam), not a public feature. The voiceover already says "one of the tests".

## Music & SFX
- Music: original royalty-free tracks generated with vidIQ, one per reel.
- SFX: synthesized from scratch for these reels (no third-party samples).

## Re-rendering
```
cd reels && npm install
npx remotion render src/index.ts Reel1-REA out/Reel1-REA.mp4   # or Reel2-Genie4, Reel3-SpaceAI, Reel4-GPT61Terra
```
The media in `public/` (A-roll cuts, b-roll, music) is git-ignored. It's re-created by the prep scripts and isn't in the repo.

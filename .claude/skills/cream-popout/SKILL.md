---
name: cream-popout
description: Edit a talking-head reel in the "Cream Pop-out" house style (approved on the Headroom reel): warm cream canvas, speaker in a rounded bottom card with the head popping out over the graphics, big italic serif keywords, Mac-style terminal cards, a pixel miner-robot mascot, bold white word captions, soft UI pops. Use when the user types /cream-popout, says "cream pop-out style", "Headroom style", "Nick style", "same style as the Headroom reel", or asks to edit a new upload in that style.
---

# Cream Pop-out: AI with Kalyan house style

Reference build: `reels/src/R17.tsx` (Reel 17, Headroom, approved 2026-11-28). Copy it to `reels/src/R<n>.tsx`, keep the shared pieces
(Stage, Card, MacBar, Serif, Pill, Row, Mascot, Burst, SplitShot, Captions) and rewrite only the beats and the SEGS list for the new script.

The user is not technical: keep replies short, do the work, never ask them to run commands.

## 0. Before editing (always)
1. Find the newest upload(s) in the Drive uploads folder (often two takes of one script). Download with
   `curl -L "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`.
2. Ask the questions that change the edit (AskUserQuestion): target length (default ~50 s), keyword for the comment CTA,
   what the top-half content shows (real repo/site recording + built graphics is the default), where full-screen face is wanted
   (default: opening line, one short reaction mid-way, the comment CTA only). Then build. No other style options are needed:
   the style is fixed.

## 1. A-roll (best takes, no repeats, no pauses)
- `scripts/chunks.py take.wav` transcribes every speech chunk on its own. Full-file Whisper hides retakes, so always read the chunks.
- Pick the best line of each sentence from either take; `keep.json` = `{"speed":1.12,"zoom":1.0,"xfade":4,"srcs":{"a":"a.mp4","b":"b.mp4"},"keep":[["a",start,end],...]}`.
  Split a line where there is a pause (e.g. after "Claude Code,") so the gap is removed.
- `scripts/cut3.py a.mp4 keep.json aroll_raw.mp4 pieces.json`, then check: `chunks.py` again (no repeats, no "you, you", no "Okay,"),
  and `ffmpeg -af silencedetect=n=-35dB:d=0.18` (no pause over ~0.25 s).
- `scripts/whisper.py aroll.wav` for word timings → `reels/public/r/r<n>_words.json` as `{duration, words:[{w,s,e}], timeline:[]}`;
  fix names (Claude, product name, the CTA keyword in capitals).

## 2. Face and cut-out
- `scripts/face.py aroll_raw.mp4 face.json` (face track, also used to place the card).
- `scripts/beauty.py aroll_raw.mp4 face.json aroll.mp4`: skin-only clean-up (smoothing, less redness, slight lift); glasses/eyes/hair stay sharp.
- `scripts/matte.py aroll.mp4 matte.webm 0.5`: person cut-out with alpha (VP9) for the head pop-out.
- Effects skill on `aroll.mp4` for the CTA only: `{"fx":"comment-box","start":<"comment">,"end":<end of CTA line>,"text":"<KEYWORD>"}` → `r<n>fx_aroll.mp4`.

## 3. The look (do not change without the user asking)
- Canvas `#F1EDE5` with a faint dot grid; ink `#16181D`; accents terracotta `#D9693F`, mint `#16A974`, red `#E5484D` (problems only), gold `#E9B949`.
- **Split layout (most of the reel):** graphics in the top ~1000 px; speaker in a rounded card (x40 y1010 w1000 h870, radius 48, soft shadow).
  Card placement follows the face track so the top of the head rises ~170 px above the card edge; the cut-out video is layered on top and
  clipped above the card edge = the head pop-out. Keep the centre-bottom of the top area (x 300–780, y 800–1010) free: the head is there.
- **Full-screen face:** only the opening line, one short reaction mid-way ("there actually is 👀"), and the comment CTA (comment box).
- **Full cream graphic screens** (voice over, no face) for the big moments: a meter/stat, the real repo window with a star counter, the proof/number screen.
- **Type:** big italic serif keywords (Playfair Display 800 italic) — one or two words per beat, key word in terracotta; UI/labels in Inter / JetBrains Mono.
- **Cards:** white rounded cards with soft shadows; dark Mac-style terminal windows (traffic-light dots) for code/logs.
- **Mascot:** the original pixel miner robot (gold hard hat, mint visor) with a prop per beat: pick, glass, broom, key, star. Never copy another creator's mascot.
- **Motion:** something changes every 1–2 s — typing terminals, counters/odometers, bars filling, particle bursts (Burst), blocks flowing through a diagram,
  a scanning lens, a tap on a follow button. Cards pop in with a small back-ease; layout changes have a 5-frame fade + slight scale.
- **Captions:** 3-word chunks, Inter 900 68 px, white with a soft dark shadow over the chest (split y≈1640, full face y≈1450); a black pill on full graphic screens;
  key words in gold. Hidden while the comment box is up and during the end card.
- **Sound:** soft music bed (`scripts/music.py out.wav <seconds> 88`, base volume 0.07), gentle pops/clicks/whooshes on entrances, 8-bit coin for counters. No loud whooshes.
- **End card (2.8 s, fades out):** "⛏ GITHUB GOLDMINE" pill, serif product name, "💬 comment KEYWORD", "📘 full setup guide · aiwithkalyan.com", mascot. Never use episode numbers.

## 4. Facts and footage
- Record the real page: `REPO_URL=<url> node scripts/rec_github.cjs <name> <y0> <y1> <hold> <secs>` (real-time screencast, 1920x1200), convert with ffmpeg,
  put in `reels/public/b/r<n>/`. Read stars, licence and any numbers from the page the same day; only show numbers the project itself states, and say where they come from.

## 5. Render and review
- Register in `reels/src/Root.tsx`; bundle once (`npx remotion bundle src/index.ts --out-dir <dir>`) and render stills from the bundle (parallel `remotion still` without a bundle fills the disk).
- Check stills at every beat: nothing covers the face, nothing cut off, captions readable. Render with `--concurrency=3 --crf=18`; target about −16 LUFS.
- Send the video, wait for APPROVE / IMPROVE. After approval: cover (`VThumb<n>`), upload package (send viewers to aiwithkalyan.com), setup-guide PDF (`reels/guides/`).

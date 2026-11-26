# Reel 10 · Paperclip AI ("one-person company") · edit brief

Status: **awaiting Kalyan's APPROVE / IMPROVE.** Nothing is built until this is approved.

- **Source:** `Teleprompter-2026-20-11_16-58-49.mp4` (Drive), one 2:06 take of Kalyan on camera, vertical. The working copy came through Descript at **720×1280, 30 fps** (see open issue 1).
- **Transcript:** ElevenLabs Scribe, word level (`edit/transcript-words.elevenlabs.json`).
- **Cut list:** `edit/edl.json`. **Context map:** `edit/context-map.md`.

## 1. Edit type, length, outputs
- **Style B (Shorts and Reels),** with one **Style C** explainer moment (the "turn" beat).
- **Length:** about **57 s** after keeping the best take of each line. The raw take is 126 s and repeats lines from 0:26 to 1:02 and again in the CTA.
- **Output:** one vertical 1080×1920 at 30 fps for Instagram Reels and YouTube Shorts (the same file). **Rough cut only; no final export without approval.**

## 2. Reference styles (approach only, never their footage, music, graphics or wording)
I found these with vidIQ's YouTube search. View counts are vidIQ's numbers. **I haven't watched them;** the notes come from titles, descriptions and lengths, so they're observations, not measurements.

| Reference | Matches | Borrow | Don't borrow |
|---|---|---|---|
| [TheVibeFounder: "Build Your Own AI Company"](https://www.youtube.com/watch?v=Rid7ajvx4VQ), 41 s, 158K views, posted 18 Nov 2026 | B | It's the same topic, and it worked: under 45 s, the order goal → CEO → roles → budget, and a one-word comment CTA | **Their script is very close to ours** (CEO, developers, marketing, budget, "comment X for the link"). Don't copy their wording or "GIT" keyword. Make it different through the visuals (the isometric office) and our own beats (the caveat and "start with two agents") |
| [Steven Shoaf: "OpenClaw Agents run my business!"](https://www.youtube.com/watch?v=72BdaZlB1R0), 21 s, 950K views (an outlier on his channel) | B | Show the agents working **early**, so the idea is visible before it's explained | The hype tone. Kalyan's take is calm and measured |
| [NetworkChuck: Hermes short](https://www.youtube.com/watch?v=DlEr86sNnFo), 38 s, 369K views | B | One idea, confident on-camera delivery, a cut-down from a longer video | His look and sound branding |
| ["Paperclip AI Explained: The Truth About Zero Human Companies"](https://videohighlight.com/v/Yp5KiHBSpZo) (long-form, seen as a summary page) | C | Give the honest caveat its own beat, which builds trust (matches our "don't confuse AI agents with real employees") | Its sceptical framing of the whole tool |

## 3. Style and pacing
- **Feel:** calm and clear. Kalyan explains on camera, and the office animation makes the idea visible. Not hype; the delivery is measured (see the context map).
- **Layout:** the same as Reel 9. A **full-face, face-tracked** frame for the hook, caveat and CTA, and a **split screen** (graphic on top, 1080×960; face below) for the explanation beats.
- **Cut rate:** one cut per kept take (14 jump cuts in 57 s, about one every 4 s), plus layout changes at beat boundaries. No zoom punch-ins on the cuts.
- **Captions:** the Reel 9 style (Inter Heavy, 2–4 word chunks, key word highlighted), kept above the bottom UI safe area. The key words are **ONE HUMAN, CEO, PAPERCLIP AI, ONE GOAL, SPENDING, TWO AGENTS, COMPANY**.
- **Music:** one quiet, warm bed under the voice, ducked further under the turn and CTA beats (see §6).

## 4. Effects palette (closed list; anything not here isn't used)

| # | Effect | When | Reason |
|---|---|---|---|
| E1 | **Isometric office insert A: "empty office fills up"** (Lemo-Opuscar Isometric People Scene) | problem-1, 6.6–11.8 s, split screen | The viewer *sees* how big a normal team is while Kalyan lists the roles: CEO, developers, designers and marketers walk to their desks in the order he names them |
| E2 | **Insert B: "agents run the company"** | turn → control, 18.7–37.0 s, split screen | The core idea. Desks labelled CEO, DEVELOPER and MARKETING with AI figures; a **GOAL** card lands on the floor at "one goal", splits into task cards that travel between desks at "coordinate the work", and a **spend meter** fills at "control spending". Each part appears exactly when it's said |
| E3 | **Insert C: "start with two"** | tip, 41.6–45.9 s, split screen | The office drops to two desks (RESEARCHER → WRITER) with one card passing between them. A small, concrete first step |
| E4 | **Name card "Paperclip AI · open source"** | name, 15.6–18.7 s | The voice reads the name flat (peak −22.6). The card makes sure the name is remembered. Drawn type only, no Paperclip logo unless Kalyan confirms the right to use it |
| E5 | **Comment box "COMPANY"** (Reel 9's comment-box component) | cta, about 48.8–52 s | The CTA is the fastest and quietest beat (245 WPM). The box makes "comment COMPANY" readable |
| E6 | **Word-timed captions** | throughout | Most Reels are watched on mute |

Nothing on the hook (0–6.6 s) except captions. The face and the line are the hook, and the hook is the loudest beat. Removal test: no effect there would add meaning.

## 5. Per-beat table

| Cut time | Beat | On screen | Need | Source | Tool |
|---|---|---|---|---|---|
| 0.0–6.6 | hook | Full face, captions ("ONE HUMAN" highlighted) | REQUIRED | kalyan-recording | Remotion |
| 6.6–11.8 | problem-1 | Split: insert A | REQUIRED | editor-built | Lemo-Opuscar → Remotion |
| 11.8–12.2 | "right?" | **Cut** (quiet filler) | NONE | none | none |
| 12.2–15.6 | problem-2 | Split: insert A holds, full office | REQUIRED | editor-built | Lemo-Opuscar |
| 15.6–18.7 | name | Full face + name card E4 | REQUIRED | editor-built | Remotion |
| 18.7–37.0 | turn → control | Split: insert B | REQUIRED | editor-built | Lemo-Opuscar |
| 37.0–41.6 | caveat | Full face, captions only | REQUIRED | kalyan-recording | Remotion |
| 41.6–45.9 | tip | Split: insert C | REQUIRED | editor-built | Lemo-Opuscar |
| 45.9–57.6 | cta | Full face + comment box E5 | REQUIRED | editor-built | Remotion |

Tools: **Lemo-Opuscar** (Canvas 2D, headless Chrome, frame by frame) renders the three inserts as silent 1080×960 at 30 fps clips. **Remotion** (`reels/`, the same project as Reels 1–9) does face tracking, the layout, captions, the name card, the comment box and the mix. **FFmpeg** does the cuts and audio cleanup.

## 6. Sound plan
- **Voice:** high-pass at 80 Hz, light noise reduction, gentle compression, loudness to **−15 LUFS** (matching the Reels package), true peak ≤ −1 dBTP.
- **Sound family (3 sounds, reused from `reels/public/sfx`, which were made from scratch):** `pop` when a desk or figure appears in an insert (soft, sparse), `swish` when task cards travel, `notify` when the comment box appears. None on cuts, and none on a key word.
- **Silence:** a short dip in the music right before "And here is where it gets really interesting".
- **Music:** an original bed scored with Lemo-Opuscar's music tools (free sample libraries; licence recorded at build time), about 18 dB under the voice, ducked another 4 dB under the turn and the CTA. If that isn't good enough, **ask Kalyan** before using vidIQ music, which was used for earlier Reels and may cost credits.

## 7. Third-party tools to install
- **Lemo-Opuscar** (already installed, `~/lemo-opuscar`, MIT for the code; style prompts CC BY-NC 4.0). **Licence to check with Kalyan:** CC BY-NC covers the *style prompts and demo films*, not films you make with the tools, but confirm you're comfortable using it on a monetised channel. Its `music` package tier is installed only if the music plan above is approved.
- **Remotion 4.0.286:** already in `reels/`. Free for individuals and teams of up to 3.
- **ffmpeg 7.0.2 static:** installed in this session at `~/.local/bin`.

## 8. Asset needs (the only list the asset producer works from)
1. **Original-quality source file.** The copy I have is 720×1280. For the final, I need the original 1080p (or larger) file in a way I can download here. Drive links over 10 MB can't come through the connector, so a WeTransfer or Dropbox link, or Descript set to 1080×1920, would work.
2. **Paperclip logo:** OPTIONAL. Only if Kalyan confirms the right to use it; otherwise E4 is type only.

Everything else is editor-built.

## 9. Self-review targets
- Length 55–60 s. Hook line complete within 3.6 s.
- Every REQUIRED beat present. Effects E1–E6 only. At most 3 sound effects per 10 s, none on a key word.
- No static shot longer than 6 s without a layout change or insert movement.
- Voice −15 LUFS ±1, true peak ≤ −1 dBTP, music ≥ 15 dB under the voice.
- Captions match the audio word for word, and each chunk stays on screen at least 0.5 s.
- Insert labels match the spoken words exactly (CEO, DEVELOPER, MARKETING, GOAL, RESEARCHER, WRITER).
- On-screen claims only from the fact-check below.

## Fact-check (on-screen claims)
Checked against the official README ([github.com/paperclipai/paperclip](https://github.com/paperclipai/paperclip)):
- Open source: **VERIFIED** (MIT licence).
- Organises agents like a company, with roles such as CEO, developers and marketers: **VERIFIED** ("Hire the team: CEO, CTO, engineers, designers, marketers"; "Org Chart for Agents").
- One goal, broken into tasks: **VERIFIED** ("Define the goal", "Goal Alignment", "Agentic Task Manager").
- Monitor progress and control spending: **VERIFIED** ("Monitor from the dashboard"; "Cost Control: company, agent, and project budgets").
- "The next billion-dollar company might have just one human employee": **opinion or prediction.** It's fine as spoken framing and isn't shown as a fact on screen.

## Open issues for Kalyan
1. **Resolution:** the working copy is 720p (asset need 1).
2. **"rework their work"** was probably meant as "review". Do you want to re-record that line, keep it as spoken, or caption it "review"?
3. **TheVibeFounder posted a very similar Reel 8 days ago** (same tool, same role list, same comment-to-get-the-link CTA). The isometric visuals and the "start with two agents" tip make ours different, but you may want a different hook line.
4. Licence check for Lemo-Opuscar (§7).

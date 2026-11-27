# Headroom · "GitHub Goldmine" Reel · treatment (CRT ASCII Terminal, amber P3)

Format: 1080×1920, 30 fps, about 86 s. Kalyan's own voice (best takes from two recordings, `edl.json`). Kalyan appears on camera for the hook (0–7.9 s), the CTA (60.4–70.1 s) and the sign-off (79.4–86.3 s). Everything else is a full-screen amber terminal, rendered here.

## Three candidate structures
1. **One bug, one session (chosen).** We follow one real-feeling Claude Code session: a single "fix one small bug" prompt, the flood of logs it causes, Headroom inserted into the pipe, and the same session again, quiet and compact. A before → after told inside one machine, so the viewer sees cause and cure in the same place.
2. **The token meter.** The whole film as a fuel gauge draining and refilling. It's clear, but it's a dashboard rather than a terminal, so it loses the "this is my world" feel and turns the story into a number. And we chose not to show numbers.
3. **The printout.** A dot-matrix sheet of logs feeding up for metres, then Headroom trims it to one page. A nice image, but it's one gag and can't carry the "huge project, every day" second half.

Why 1: Kalyan's script already *is* a session (prompt → flood → fix → repeat at scale). The terminal is the subject, not a decoration.

## Logline and arc
One small bug makes Claude Code read a thousand lines of noise, until a quiet layer between the agent and the model folds the noise away.
- **Setup:** a calm prompt, then the flood (7.9–27.4).
- **Turn:** the screen clears, a question, and the name HEADROOM (21.5–30.7).
- **Mechanism:** AGENT → HEADROOM → MODEL. Repeats collapse, and the model gets a compact block (30.7–41.4).
- **Scale:** a huge project, tests and errors, the log tower falls into the same small block, every day (41.4–60.4).
- **Tease:** GitHub Goldmine, find 02, a maze of code (70.1–79.4).

## Benchmark
Learn from terminal-recording explainers (asciinema-style demos): real-looking commands and output, typing as rhythm, and one thing changing per beat. Don't learn the "hacker rain" cliché or fake HUD panels (the style forbids both), and don't show fake benchmark numbers.

## Shot list (all shots are the screen; the only camera is grid scale)

| # | Cut time | Grid | Move | What | Why |
|---|---|---|---|---|---|
| 1 | 7.94 | 40 col | Power on: dot → line → frame | Prompt `~/app $ claude` then `> fix the login bug` typed by hand (uneven) | Birth of the session; human typing = Kalyan's "you" |
| 2 | 11.2 | 40 → 56 col | Scroll, accelerating | The buffer floods: test output, stack traces, `npm WARN`, and the **same line repeated** (repeats in dim, a ×N tally growing) | "hundreds of lines… repeated information": accumulation = scroll |
| 3 | 17.5 | 56 col | Static, overheating | Context bar at the top fills cell by cell to the right edge; inverse-video `CONTEXT FULL`, BEL beep | "eat up all your tokens"; the bar is the cost, shown without a number |
| 4 | 21.5 | 40 col | Hard clear | Empty screen, one blinking cursor, then `> clean it up before Claude reads it?` typed slowly | Silence before the turn; the cursor is suspense |
| 5 | 27.4 | 12 → 10 col | Push in | `HEADROOM` in big ASCII block letters, typed with key clicks; under it `$ headroom wrap claude` | The name must stick (both takes read it flatly) |
| 6 | 30.7 | 10 → 44 col | Pull out | Title becomes the middle band of a three-tier diagram: AGENT box (top), HEADROOM band (middle), MODEL box (bottom) | "sits between your agent and the model": the pull-out puts the name in context |
| 7 | 32.9 | 44 col | Static, flow | Log lines drop from AGENT into the band; inside it, repeated lines fold into one line `×214 same line` | The mechanism, shown, not told |
| 8 | 37.9 | 44 col | Push slightly on MODEL | A short, tidy block lands in MODEL. **The one second colour (ice white) appears here, once** | "a much more compact version": the payoff gets the only colour |
| 9 | 41.4 | 44 → 140 col | Pull out hard | The log becomes a tower: thousands of tiny lines (tests, errors, logs) stacked to the top of the frame | "huge project": scale = pull out |
| 10 | 51.5 | 140 col | Transformation | The tower's glyphs fall as particles into HEADROOM and land as the same small ice-white block; status line `headroom: active · automatic` | "reduce… automatically": the one off-grid moment |
| 11 | 57.1 | 56 col | Scroll, steady | Day stamps `MON TUE WED THU FRI`, each one a short compact block | "every day" |
| 12 | 60.4 | — | Cut to Kalyan | Face + "comment GOLD" box | CTA (Remotion) |
| 13 | 70.1 | 40 → 90 col | Power on, then pull out | `GITHUB GOLDMINE` header; `FIND 01 HEADROOM ✓`; `FIND 02 ██████ loading`; the screen draws a maze of code paths | Teases the next find (navigating massive codebases) without naming it |
| 14 | 79.4 | — | Cut to Kalyan | Follow and subscribe; ends on his line | Sign-off |

## Beat sheet and cue map
- The voice sets the grid (no music grid: the cut timing is Kalyan's natural speech). Music is an analog-synth score at 96 BPM, so a beat is 0.625 s and a bar 2.5 s. Section changes land on the nearest downbeat to the voice cut, within ±0.15 s.
- **7.9–21.5:** a cold pulse (filtered saw arpeggio) rises with the flood, and the filter opens as the scroll speeds up.
- **21.5–27.4:** drop to room tone and fan hum only. A near-silence before the name.
- **27.4–41.4:** a pad enters on HEADROOM. The arpeggio returns, slower and more ordered. The only major chord is held at shot 8 (the compact block, the colour).
- **41.4–51.5:** a sub-bass drone with a sample-and-hold noise texture under the tower.
- **51.5–60.4:** particles fall with high tick clusters, the chord resolves, then a steady pulse for "every day".
- **70.1–79.4:** the pulse again, lighter, and a modem-like rising tone as the maze draws.
- **Under Kalyan's face sections:** the same score, quiet, ducked by 8 dB.

## Sound design table

| Section | Bed | Foley | Music |
|---|---|---|---|
| Power on | Room tone, fan | Relay click, degauss thump | Silence → first pulse |
| Prompt | Room tone | Buckling-spring keys (uneven), Enter thock | Pulse |
| Flood | Fan | Teletype tick clusters at scroll rate, kept low | Arpeggio, filter opening |
| Context full | — | Square-wave BEL ×2 | Hit, then a cut to near-silence |
| Clear + question | Room tone only | Single slow keystrokes | Silence |
| HEADROOM | Room tone | Key clicks per letter, heavy Enter | Pad enters |
| Diagram / fold | Fan | Soft ticks as lines fold | Ordered arpeggio; major chord at the colour |
| Tower → particles | Low hum | Tiny high tick clusters as particles land | Drone → resolve |
| Tease | Room tone | Modem answer tone, rising | Light pulse |

Voice: Kalyan's own (not processed as a machine; he is the human at the keyboard). Mix: music ducked −8 dB under the voice, master −14 LUFS (Instagram/YouTube normalise to about −14).

## Subtitle and title design
- In the terminal sections, the subtitles **are terminal output**: the style's LOG strip at the bottom (dim separator, inverse `KALYAN` tag, `>` prompt, uppercase VT323 at about 48 px), typed word by word on the ElevenLabs word timestamps and held at least max(1.8 s, speech + 0.6 s). It sits above Instagram's bottom UI area (about the lower 300 px is kept clear).
- The key words are bold: TOKENS, HEADROOM, COMPACT, AUTOMATICALLY, GOLD.
- Kalyan's face sections use Remotion captions in the same amber VT323, so the whole Reel reads as one language.
- Titles are typed commands (`$ headroom wrap claude`) or headers (`GITHUB GOLDMINE`).

## Facts shown (checked against the Headroom README)
- It sits between the agent and the model and compresses tool output and logs: verified.
- `headroom wrap claude` runs it with Claude Code: verified (README quickstart).
- No savings percentage is shown (Kalyan's choice). The context bar empties visually only.
- The log lines on screen are illustrative generic output (npm, pytest, stack traces), not a real project's.

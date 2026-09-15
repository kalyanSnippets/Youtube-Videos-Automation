# Local Worker (Phase 5 — planned)

The web app never assumes direct access to a user's local files, and never renders video itself.
Heavy work — Whisper transcription, FFmpeg processing, Remotion rendering — runs on a separate
process on the user's own machine: the **local worker**.

## Why

- Raw footage (screen recordings, generated results) can be large and stays local by default;
  only small outputs/previews are ever expected to travel to the web app.
- Rendering is CPU/GPU-bound and benefits from running close to the source files.
- It lets the web app stay a thin, horizontally-scalable Next.js deployment with no video
  toolchain installed.

## Contract (implemented today)

The database and type contracts the local worker will use already exist:

- `local_worker_nodes` — registration + heartbeat (`is_online`, `last_heartbeat_at`, `capabilities`).
- `jobs` — generic job queue (`QUEUED / RUNNING / WAITING_FOR_USER / COMPLETED / FAILED / CANCELLED`),
  typed by `job_type` (`TRANSCRIPTION`, `RENDER_ROUGH`, `RENDER_FINAL`, ...).
- `render_jobs` — render-specific job state (`progress_percent`, `output_path`/`output_url`,
  `local_worker_node_id`).
- `RenderProvider` (`packages/video-core`) — the interface the worker implements; `RenderRequest`
  carries an `EditPlan` (scenes with local asset paths, motion component keys, captions) and the
  worker reports `RenderProgressUpdate`s back.
- `TranscriptionProvider` (`packages/transcription`) — `TranscriptWord[]` with `startMs`/`endMs`,
  which is what powers kinetic captions in the edit plan.
- `@yaos/ffmpeg` — typed wrappers (`probeMedia`, `extractAudio`, `normalizeAudio`, `generateProxy`,
  `extractThumbnail`, `trimClip`, `muxVideoAudio`) meant to run inside the worker process, never
  on the web server.

Until a worker connects, `NotConnectedRenderProvider` and `NotConnectedTranscriptionProvider`
throw descriptive errors, and Settings → Integrations shows `LOCAL_WORKER`, `WHISPER`, and
`FFMPEG` as not connected — the web app never fabricates a render or transcript.

## Planned CLI (`apps/local-worker`, not yet built)

```
youtube-agent-worker login    # authenticate against the web app's workspace
youtube-agent-worker start    # begin heartbeat + job polling
youtube-agent-worker status   # show connection + current job
youtube-agent-worker scan     # scan a project's local asset folders, report to the web app
youtube-agent-worker render   # render a specific render_job by id
```

## Planned job loop

1. Worker sends a heartbeat, updating its `local_worker_nodes` row.
2. Worker polls for `QUEUED` jobs assigned to its workspace (or the web app pushes via a
   webhook/WebSocket in a later iteration — polling is the simpler correct-first version).
3. For a render job: download the edit plan, resolve each scene's asset by local path, validate
   presence (never invent a missing asset), render via `@remotion/renderer` using the component
   keyed by `motionComponent` (see `docs/REMOTION.md`), mux audio via `@yaos/ffmpeg`, write the
   output, report progress increments and finally `COMPLETED`/`FAILED`.
4. For a transcription job: extract/normalize audio via `@yaos/ffmpeg`, run faster-whisper
   locally, upload only the resulting `transcript_words` (never raw audio, unless the user
   explicitly opts into uploading the source file).

## Expected local asset layout

```
project-id/
  script/  narration/  screen-recordings/  screenshots/
  generated-results/  broll/  logos/  music/  sfx/
  transcript/  edit-plan/  renders/  publish/
```

The `assets` table's `local_path` column is what a connected worker resolves against; the web
app itself never reads or writes to this filesystem layout directly.

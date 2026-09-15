import { spawn } from "node:child_process";

/**
 * Thin, typed wrappers around the ffmpeg/ffprobe binaries. This package is
 * meant to run on the local worker, next to the user's media files - never
 * on the web server, which never has direct filesystem access to a user's
 * footage. Every function shells out to a real binary; none of them
 * fabricate output, so a missing binary or bad input fails loudly.
 */

function run(bin: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => reject(new Error(`${bin} is not available on this machine: ${err.message}`)));
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${bin} exited with code ${code}: ${stderr}`));
    });
  });
}

export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await run("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

export interface MediaProbe {
  durationSeconds: number;
  width?: number;
  height?: number;
  codec?: string;
  hasAudio: boolean;
}

/** Reads media metadata via ffprobe - used by the Asset Validator to confirm a captured file matches its requirement before marking it READY. */
export async function probeMedia(localPath: string): Promise<MediaProbe> {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=codec_type,codec_name,width,height",
    "-of",
    "json",
    localPath,
  ]);
  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: { codec_type?: string; codec_name?: string; width?: number; height?: number }[];
  };
  const videoStream = parsed.streams?.find((s) => s.codec_type === "video");
  const audioStream = parsed.streams?.find((s) => s.codec_type === "audio");
  return {
    durationSeconds: Number(parsed.format?.duration ?? 0),
    width: videoStream?.width,
    height: videoStream?.height,
    codec: videoStream?.codec_name,
    hasAudio: Boolean(audioStream),
  };
}

/** Extracts a normalized WAV audio track from narration or source footage, ready for transcription. */
export async function extractAudio(inputPath: string, outputWavPath: string): Promise<void> {
  await run("ffmpeg", ["-y", "-i", inputPath, "-ac", "1", "-ar", "16000", "-vn", outputWavPath]);
}

/** Loudness-normalizes narration audio (EBU R128) before it enters the edit plan. */
export async function normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
  await run("ffmpeg", ["-y", "-i", inputPath, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", outputPath]);
}

/** Generates a low-bitrate proxy for fast preview scrubbing without touching the master file. */
export async function generateProxy(inputPath: string, outputPath: string): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "scale=960:-2",
    "-c:v",
    "libx264",
    "-crf",
    "28",
    "-preset",
    "veryfast",
    outputPath,
  ]);
}

/** Extracts a single frame as a thumbnail candidate. */
export async function extractThumbnail(inputPath: string, atSeconds: number, outputPngPath: string): Promise<void> {
  await run("ffmpeg", ["-y", "-ss", String(atSeconds), "-i", inputPath, "-frames:v", "1", outputPngPath]);
}

export async function trimClip(inputPath: string, startSeconds: number, endSeconds: number, outputPath: string): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-ss",
    String(startSeconds),
    "-to",
    String(endSeconds),
    "-i",
    inputPath,
    "-c",
    "copy",
    outputPath,
  ]);
}

/** Muxes a rendered Remotion sequence with a processed audio track into the final deliverable. */
export async function muxVideoAudio(videoPath: string, audioPath: string, outputPath: string): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ]);
}

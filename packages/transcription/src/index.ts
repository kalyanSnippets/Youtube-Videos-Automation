export interface TranscriptWord {
  word: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface TranscriptionResult {
  fullText: string;
  words: TranscriptWord[];
  language: string;
  provider: string;
}

/**
 * TranscriptionProvider abstracts word-level speech-to-text, which powers
 * kinetic captions in the edit plan. The real implementation runs on the
 * local worker (faster-whisper) since narration audio lives on the user's
 * machine; the web server only ever sees the resulting word timings, never
 * raw audio, unless the user explicitly uploads it.
 */
export interface TranscriptionProvider {
  readonly id: string;
  isAvailable(): boolean;
  transcribe(audioLocalPath: string): Promise<TranscriptionResult>;
}

export class NotConnectedTranscriptionProvider implements TranscriptionProvider {
  readonly id = "NOT_CONNECTED";

  isAvailable(): boolean {
    return false;
  }

  async transcribe(): Promise<TranscriptionResult> {
    throw new Error(
      "No transcription backend is connected. Install and connect the local worker (runs faster-whisper) in Settings > Integrations.",
    );
  }
}

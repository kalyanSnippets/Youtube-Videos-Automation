export interface EditPlanScene {
  sceneOrder: number;
  startMs: number;
  endMs: number;
  storyFunction: string;
  intensity: "LOW" | "MEDIUM" | "HIGH";
  primaryAssetLocalPath?: string;
  backupAssetLocalPath?: string;
  component: string;
  onScreenText?: string;
  captionEmphasis?: string;
  cameraMotion?: string;
  transition?: string;
  sfx?: string;
  proofOverlay?: string;
  claimIds: string[];
}

export interface EditPlan {
  projectId: string;
  resolution: "1920x1080" | "1080x1920";
  fps: number;
  scenes: EditPlanScene[];
  captionWords: { word: string; startMs: number; endMs: number }[];
}

export type RenderTarget = "ROUGH" | "FINAL" | "SHORT";

export interface RenderRequest {
  projectId: string;
  renderJobId: string;
  target: RenderTarget;
  editPlan: EditPlan;
}

export interface RenderProgressUpdate {
  renderJobId: string;
  progressPercent: number;
  message?: string;
}

export interface RenderResult {
  renderJobId: string;
  outputLocalPath: string;
  durationSeconds: number;
  resolution: string;
}

/**
 * RenderProvider abstracts "turn an edit plan into a video file". The real
 * implementation lives on the local worker (Remotion render + FFmpeg mux);
 * the web server enqueues a render_job row and polls/receives progress, it
 * never renders directly. onProgress is optional so a provider can support
 * either push (worker reports back) or poll (web app checks job status).
 */
export interface RenderProvider {
  readonly id: string;
  isAvailable(): boolean;
  render(request: RenderRequest, onProgress?: (update: RenderProgressUpdate) => void): Promise<RenderResult>;
}

export class NotConnectedRenderProvider implements RenderProvider {
  readonly id = "NOT_CONNECTED";

  isAvailable(): boolean {
    return false;
  }

  async render(): Promise<RenderResult> {
    throw new Error("No render worker is connected. Install and connect the local worker in Settings > Integrations.");
  }
}

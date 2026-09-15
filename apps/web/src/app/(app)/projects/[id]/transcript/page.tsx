import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { NotConnectedPanel } from "@/components/project/not-connected-panel";

export default async function TranscriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [transcript] = await db.select().from(schema.transcripts).where(eq(schema.transcripts.projectId, id));

  if (!transcript) {
    return (
      <NotConnectedPanel
        title="No transcript yet"
        description="Word-level transcription runs on the local worker (faster-whisper) once narration audio is uploaded. Connect the local worker in Settings → Integrations."
      />
    );
  }

  const words = await db.select().from(schema.transcriptWords).where(eq(schema.transcriptWords.transcriptId, transcript.id));

  return (
    <div className="panel p-5">
      <p className="text-xs text-text-faint mb-3">
        {words.length} words • provider: {transcript.provider}
      </p>
      <p className="text-sm leading-relaxed text-text-dim">{transcript.fullText}</p>
    </div>
  );
}

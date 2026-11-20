import { eq } from "drizzle-orm";
import { db, schema } from "@yaos/database";
import { getCurrentUser } from "@/lib/auth";
import { getAllProviders } from "@yaos/ai-providers";
import { updateChannelProfile } from "@/lib/actions/settings";
import { Badge } from "@/components/ui/badge";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { LogoForm } from "@/components/admin/logo-form";
import { getSiteSettings } from "@/lib/site";
import { getConnection, hasAnalyticsScope } from "@yaos/comment-bot";
import { analyticsState } from "@/lib/youtube-analytics";

const INTEGRATION_LABELS: Record<string, string> = {
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
  WEB_RESEARCH: "Web Research",
  YOUTUBE_DATA: "YouTube Data API",
  YOUTUBE_ANALYTICS: "YouTube Analytics",
  FILE_STORAGE: "File Storage",
  LOCAL_WORKER: "Local Worker",
  WHISPER: "Whisper",
  FFMPEG: "FFmpeg",
  REMOTION: "Remotion",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile] = await db.select().from(schema.channelProfiles).where(eq(schema.channelProfiles.workspaceId, user.workspaceId));
  const localWorkers = await db.select().from(schema.localWorkerNodes).where(eq(schema.localWorkerNodes.workspaceId, user.workspaceId));
  const providers = getAllProviders();
  const site = await getSiteSettings();
  const ytConn = await getConnection("YOUTUBE").catch(() => null);
  const analyticsOn = Boolean(ytConn && (hasAnalyticsScope(ytConn.metadata) || analyticsState(ytConn).lastAt));

  const integrationStatus: Record<string, "CONNECTED" | "NOT_CONNECTED" | "COMING_SOON"> = {
    OPENAI: providers.find((p) => p.id === "OPENAI")?.isAvailable() ? "CONNECTED" : "NOT_CONNECTED",
    ANTHROPIC: providers.find((p) => p.id === "ANTHROPIC")?.isAvailable() ? "CONNECTED" : "NOT_CONNECTED",
    WEB_RESEARCH: process.env.TAVILY_API_KEY ? "CONNECTED" : "NOT_CONNECTED",
    YOUTUBE_DATA: process.env.YOUTUBE_API_KEY ? "CONNECTED" : "NOT_CONNECTED",
    YOUTUBE_ANALYTICS: analyticsOn ? "CONNECTED" : "NOT_CONNECTED",
    FILE_STORAGE: "NOT_CONNECTED",
    LOCAL_WORKER: localWorkers.some((w) => w.isOnline) ? "CONNECTED" : "NOT_CONNECTED",
    WHISPER: "COMING_SOON",
    FFMPEG: "COMING_SOON",
    REMOTION: "COMING_SOON",
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold mb-1">Settings</h1>
        <p className="text-sm text-text-dim">Your public website, the comment bot's notes about you, and the studio's channel profile.</p>
      </div>

      <section id="website" className="panel p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Website</h2>
          <p className="text-xs text-text-dim mt-1">What viewers see on your public site, plus the private "About me" notes the comment bot uses to answer in your voice.</p>
        </div>
        <LogoForm hasUpload={Boolean(site.logoData)} />
        <SiteSettingsForm settings={site} />
      </section>

      {profile ? (
        <form action={updateChannelProfile} className="panel p-6 space-y-4">
          <input type="hidden" name="workspaceId" value={user.workspaceId} />
          <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Channel Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Niche" name="niche" defaultValue={profile.niche} />
            <TextField label="Format" name="format" defaultValue={profile.format} />
            <TextField label="Audience" name="audience" defaultValue={profile.audience} />
            <TextField label="Narration style" name="narrationStyle" defaultValue={profile.narrationStyle} />
            <TextField label="Min length (min)" name="targetLengthMinMinutes" defaultValue={String(profile.targetLengthMinMinutes)} type="number" />
            <TextField label="Max length (min)" name="targetLengthMaxMinutes" defaultValue={String(profile.targetLengthMaxMinutes)} type="number" />
            <TextField label="Visual style" name="visualStyle" defaultValue={profile.visualStyle} />
            <TextField label="Budget tier" name="budgetTier" defaultValue={profile.budgetTier} />
            <TextField label="Publishing cadence" name="publishingCadence" defaultValue={profile.publishingCadence} />
          </div>
          <button type="submit" className="rounded-lg bg-accent-cyan text-bg text-sm font-medium px-4 py-2 hover:brightness-110 transition">
            Save Channel Profile
          </button>
        </form>
      ) : null}

      <div className="panel p-6 space-y-3">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Trust Policy</h2>
        <p className="text-sm text-text-dim">Priority order: official sources → our controlled test → community consensus.</p>
        <h3 className="text-xs text-text-dim uppercase tracking-wide pt-2">Asset Priority</h3>
        <ol className="text-sm text-text-dim list-decimal list-inside space-y-1">
          {(profile?.assetPriority ?? []).map((a) => (
            <li key={a}>{a.replace(/_/g, " ")}</li>
          ))}
        </ol>
      </div>

      <div className="panel p-6 space-y-3">
        <h2 className="text-sm font-semibold text-text-dim uppercase tracking-wide">Integrations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(integrationStatus).map(([service, status]) => (
            <div key={service} className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-raised px-3 py-2.5">
              <span className="text-sm">{INTEGRATION_LABELS[service]}</span>
              <Badge variant={status === "CONNECTED" ? "success" : status === "COMING_SOON" ? "default" : "warning"}>
                {status.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TextField({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue: string; type?: string }) {
  return (
    <label className="block">
      <span className="block text-xs text-text-dim mb-1.5">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-lg bg-bg-raised border border-border px-3 py-2 text-sm outline-none focus:border-accent-cyan/50"
      />
    </label>
  );
}

import Link from "next/link";
import { getPublicSettings } from "@/lib/public-data";
import type { FollowLinks } from "@/lib/site";

/** The few settings the header and footer need (from getPublicSettings, which is cached). */
export interface ChromeSettings {
  siteName: string;
  youtubeUrl: string | null;
  instagramUrl: string | null;
  follow?: FollowLinks;
}
import { FollowCta } from "./follow-cta";
import { SiteLogo } from "@/components/site-logo";

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function SocialLinks({ settings }: { settings: ChromeSettings }) {
  return (
    <div className="flex items-center gap-2">
      {settings.youtubeUrl && (
        <a href={settings.youtubeUrl} target="_blank" rel="noopener" aria-label="YouTube" className="rounded-lg border border-border p-2 text-text-dim hover:text-text hover:border-accent-cyan/40">
          <YouTubeIcon />
        </a>
      )}
      {settings.instagramUrl && (
        <a href={settings.instagramUrl} target="_blank" rel="noopener" aria-label="Instagram" className="rounded-lg border border-border p-2 text-text-dim hover:text-text hover:border-accent-cyan/40">
          <InstagramIcon />
        </a>
      )}
    </div>
  );
}

export async function PublicHeader({ settings }: { settings: ChromeSettings }) {
  const links = settings.follow ?? (await getPublicSettings()).follow;
  return (
    <header className="border-b border-border-subtle">
      <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo size={32} />
          <span className="font-semibold">{settings.siteName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <FollowCta links={links} size="sm" />
          </div>
          <SocialLinks settings={settings} />
        </div>
      </div>
    </header>
  );
}

export function PublicFooter({ settings }: { settings: ChromeSettings }) {
  return (
    <footer className="border-t border-border-subtle mt-16">
      <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-text-faint">
        <p>© {new Date().getFullYear()} {settings.siteName}. Free to use in your own work.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-text-dim">Privacy</Link>
          <Link href="/login" className="hover:text-text-dim">Creator login</Link>
        </div>
      </div>
    </footer>
  );
}

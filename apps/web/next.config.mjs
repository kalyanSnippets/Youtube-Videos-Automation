/** Hosts the site is served from: button actions (server actions) from these are accepted. */
const siteHosts = [process.env.SITE_URL, process.env.URL, process.env.DEPLOY_PRIME_URL]
  .filter(Boolean)
  .map((u) => {
    try {
      return new URL(u).host;
    } catch {
      return null;
    }
  })
  .filter(Boolean);
const allowedOrigins = [...new Set(siteHosts.flatMap((h) => [h, h.startsWith("www.") ? h.slice(4) : `www.${h}`])), "*.netlify.app"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins, bodySizeLimit: "6mb" },
  },
  transpilePackages: [
    "@yaos/shared",
    "@yaos/database",
    "@yaos/agents",
    "@yaos/agent-schemas",
    "@yaos/ai-providers",
    "@yaos/comment-bot",
    "@yaos/research",
    "@yaos/transcription",
    "@yaos/video-core",
    "@yaos/prompts",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

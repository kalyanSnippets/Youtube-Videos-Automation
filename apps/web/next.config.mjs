/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@yaos/shared",
    "@yaos/database",
    "@yaos/agents",
    "@yaos/agent-schemas",
    "@yaos/ai-providers",
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

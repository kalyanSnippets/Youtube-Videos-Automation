/**
 * Makes the admin area installable as a phone app ("Add to Home Screen"). Linked only from the
 * admin pages and the sign-in page, so visitors to the public site are never offered it.
 */
export const dynamic = "force-static";

export function GET() {
  const manifest = {
    id: "/videos",
    name: "AI with Kalyan OS",
    short_name: "Kalyan OS",
    description: "Your videos, prompts, comment bot and analytics.",
    start_url: "/videos?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0c11",
    theme_color: "#0a0c11",
    icons: [
      { src: "/api/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/api/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Comment Bot", url: "/comment-bot", icons: [{ src: "/api/app-icon/192", sizes: "192x192" }] },
      { name: "Analytics", url: "/analytics", icons: [{ src: "/api/app-icon/192", sizes: "192x192" }] },
      { name: "Import upload package", url: "/videos/packages", icons: [{ src: "/api/app-icon/192", sizes: "192x192" }] },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" },
  });
}

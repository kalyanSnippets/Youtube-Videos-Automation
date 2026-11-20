/** The AI with Kalyan logo (uploaded logo, else YouTube profile picture, else "AK"); see /api/logo. */
export function SiteLogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/api/logo" alt="AI with Kalyan" width={size} height={size} className={`shrink-0 rounded-lg object-cover bg-bg-raised ${className}`} style={{ width: size, height: size }} />;
}

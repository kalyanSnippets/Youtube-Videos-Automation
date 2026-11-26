import { ImageResponse } from "next/og";
import { getLogoImage } from "@/lib/logo";

export const dynamic = "force-dynamic";

const SIZES = new Set([180, 192, 512]);
const BG = "#0a0c11";

/**
 * Square PNG icon for the phone app (home screen, splash screen). Your logo sits in the middle
 * with room around it, so Android can cut it into a circle or rounded square without clipping.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const n = Number((await params).size);
  const size = SIZES.has(n) ? n : 512;
  const logo = await getLogoImage();
  // Satori can't draw every format (e.g. WebP), so only common ones are embedded.
  const usable = logo && /^image\/(png|jpe?g|gif|svg\+xml)$/.test(logo.type);
  const inner = Math.round(size * 0.68);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
        {usable ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:${logo!.type};base64,${logo!.bytes.toString("base64")}`}
            width={inner}
            height={inner}
            style={{ borderRadius: inner / 2, objectFit: "cover" }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: inner,
              height: inner,
              borderRadius: inner * 0.22,
              background: "linear-gradient(135deg, #3fe6cf, #8b7bf0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: BG,
              fontSize: inner * 0.42,
              fontWeight: 800,
            }}
          >
            AK
          </div>
        )}
      </div>
    ),
    { width: size, height: size, headers: { "cache-control": "public, max-age=3600" } },
  );
}

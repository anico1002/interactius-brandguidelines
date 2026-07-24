import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { getDeckShareMeta } from '@/lib/decks/shareMeta';

/* Social preview image for a shared deck link: the presentation's OWN cover, recreated.
   This is a second rendering of the cover design (the first is components/deck/layouts/Cover.tsx
   + the `.cover` rules in deck.css) — satori can't run our React/CSS, so the layout below mirrors
   those values by hand. If the cover design changes, change it here too, or the preview drifts.
   Deliberately simpler than the real cover: background photo + scrim + Interactius wordmark +
   the big serif title (+ the cover subtitle). The CLIENT is not drawn here — it rides in the OG
   description text ("Propuesta de colaboración para {Cliente}") instead, which avoids fetching and
   recolouring the client's logo SVG. The title has no FitText shrink; it wraps. */

export const runtime = 'nodejs';
export const alt = 'Portada de la presentación';
export const size = { width: 1280, height: 720 };
export const contentType = 'image/png';

// Cover tokens, mirrored from deck.css (:root + .cover). Canvas is the deck's fixed 1280×720.
const DARK = '#1C1A17';
const WARM = '#F5F2ED';
const SHORT_TITLE = 40; // Cover.tsx measure step

const fontUrl = (file: string) => new URL(`./_fonts/${file}`, import.meta.url);

export default async function Image({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await Promise.resolve(params);

  try {
    const [serif300, mono400, interactiusSvg] = await Promise.all([
      readFile(fontUrl('ibm-plex-serif-latin-300-normal.ttf')),
      readFile(fontUrl('ibm-plex-mono-latin-400-normal.ttf')),
      readFile(new URL('../../../../public/logo/interactius-negativo.svg', import.meta.url), 'utf8'),
    ]);
    const interactiusUri = `data:image/svg+xml;base64,${Buffer.from(interactiusSvg).toString('base64')}`;

    const meta = await getDeckShareMeta(id).catch(() => null);
    const title = meta?.title?.trim() || 'Presentación';
    const subtitle = meta?.subtitle?.trim() || null;
    const long = title.length > SHORT_TITLE;

    return new ImageResponse(
      (
        <div style={{ position: 'relative', display: 'flex', width: '100%', height: '100%', backgroundColor: DARK }}>
          {/* Background photo */}
          {meta?.imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meta.imageSrc} alt="" width={1280} height={720} style={{ position: 'absolute', top: 0, left: 0, width: 1280, height: 720, objectFit: 'cover' }} />
          )}
          {/* Scrim — two stacked gradients (deck.css .cover .scrim) */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundImage: 'linear-gradient(to top right, rgba(28,26,23,0.92), rgba(28,26,23,0.10) 62%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundImage: 'linear-gradient(to top, rgba(28,26,23,0.55), rgba(28,26,23,0) 38%)' }} />

          {/* Content layer: wordmark pinned top, title lockup pinned bottom, inset --ml/--mb (108/56).
              Explicit 1280×720 + space-between so satori reserves height for a wrapped title. */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 1280, height: 720, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 108px' }}>
            {/* Interactius wordmark, top-left */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={interactiusUri} alt="interactius" height={28} width={217} style={{ height: 28, width: 217 }} />

            {/* Bottom-left lockup: big title (+ cover subtitle) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 24, width: long ? 820 : 700 }}>
              <div style={{ display: 'flex', fontFamily: 'Serif', fontWeight: 300, fontSize: 64, lineHeight: 1.06, letterSpacing: -0.64, color: WARM }}>{title}</div>
              {subtitle && (
                <div style={{ display: 'flex', fontFamily: 'Mono', fontWeight: 400, fontSize: 13, lineHeight: 1.6, color: WARM, opacity: 0.72, maxWidth: 440 }}>{subtitle}</div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          { name: 'Serif', data: serif300, weight: 300, style: 'normal' },
          { name: 'Mono', data: mono400, weight: 400, style: 'normal' },
        ],
      },
    );
  } catch {
    // Never break the client's link preview: fall back to the static brand OG image.
    const png = await readFile(new URL('../../../../public/og-default.png', import.meta.url));
    return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
  }
}

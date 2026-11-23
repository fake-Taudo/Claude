// Embedded display font (Fredoka, SIL OFL). Loaded via the FontFace API so the
// single-file build only carries the woff2 variants.
import f500 from '@fontsource/fredoka/files/fredoka-latin-500-normal.woff2?inline';
import f600 from '@fontsource/fredoka/files/fredoka-latin-600-normal.woff2?inline';
import f700 from '@fontsource/fredoka/files/fredoka-latin-700-normal.woff2?inline';

export function loadFonts(): void {
  if (typeof FontFace === 'undefined') return;
  for (const [weight, url] of [['500', f500], ['600', f600], ['700', f700]] as const) {
    try {
      const face = new FontFace('Fredoka', `url(${url}) format('woff2')`, { weight, display: 'swap' });
      document.fonts.add(face);
      face.load().catch(() => undefined);
    } catch {
      /* system font fallback */
    }
  }
}

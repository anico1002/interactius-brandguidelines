import type { OptimizadorImagen } from '@/lib/deliv/optimizar';

const LADO_MAX = 2400;
const CALIDAD = 0.82;

/* Reduce a 2400 px de lado mayor y recodifica a WebP en el navegador. Devuelve null si el
   navegador no codifica WebP o si algo falla: la capa pura conserva entonces el original. */
async function aWebp(bitmap: ImageBitmap): Promise<Blob | null> {
  const k = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * k));
  const h = Math.max(1, Math.round(bitmap.height * k));
  if (typeof OffscreenCanvas !== 'undefined') {
    const lienzo = new OffscreenCanvas(w, h);
    const ctx = lienzo.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return lienzo.convertToBlob({ type: 'image/webp', quality: CALIDAD });
  }
  const lienzo = document.createElement('canvas');
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((res) => lienzo.toBlob(res, 'image/webp', CALIDAD));
}

export const optimizadorImagenNavegador: OptimizadorImagen = {
  async optimizar(datos, tipoMime) {
    try {
      const bitmap = await createImageBitmap(new Blob([datos as BlobPart], { type: tipoMime }));
      try {
        const blob = await aWebp(bitmap);
        if (!blob || blob.type !== 'image/webp') return null;
        return { datos: new Uint8Array(await blob.arrayBuffer()), tipoMime: 'image/webp' };
      } finally {
        bitmap.close();
      }
    } catch {
      return null;
    }
  },
};

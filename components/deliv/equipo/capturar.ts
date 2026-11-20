'use client';
import { SANDBOX_HTML } from '../sandbox';

/* Genera la portada de un artefacto en el navegador del equipo (ver lib/deliv/portada.ts).
   Devuelve el JPEG, o null si no se ha podido: la tarjeta se queda en blanco y se reintenta en la
   siguiente visita a la galería. */

const ANCHO = 1280;
const ALTO = 720;
const TIEMPO_MAX_MS = 40_000;
const PREFIJO = 'data:image/jpeg;base64,';

function desdeDataUrl(d: string): Blob | null {
  if (!d.startsWith(PREFIJO)) return null;
  const bin = atob(d.slice(PREFIJO.length));
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return new Blob([b], { type: 'image/jpeg' });
}

/* El HTML se abre con el mismo sandbox que el visor del cliente y se fotografía desde dentro
   (public/deliv/captura.js). El iframe está a tamaño real pero invisible y detrás de todo: fuera de
   pantalla, algunas páginas no cargan sus imágenes perezosas. */
function capturarHtml(src: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', SANDBOX_HTML);
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.referrerPolicy = 'no-referrer';
    Object.assign(iframe.style, {
      position: 'fixed', left: '0', top: '0', width: `${ANCHO}px`, height: `${ALTO}px`,
      border: '0', opacity: '0', pointerEvents: 'none', zIndex: '-1',
    });

    let hecho = false;
    const fin = (b: Blob | null) => {
      if (hecho) return;
      hecho = true;
      window.removeEventListener('message', alMensaje);
      clearTimeout(reloj);
      iframe.remove();
      resolve(b);
    };
    const alMensaje = (e: MessageEvent) => {
      // Solo vale el mensaje de ESTE iframe: su origen es opaco ("null"), así que se identifica por la ventana.
      if (e.source !== iframe.contentWindow || e.data?.deliv !== 'portada') return;
      fin(e.data.ok && typeof e.data.imagen === 'string' ? desdeDataUrl(e.data.imagen) : null);
    };
    const reloj = setTimeout(() => fin(null), TIEMPO_MAX_MS);
    window.addEventListener('message', alMensaje);
    iframe.src = `${src}${src.includes('?') ? '&' : '?'}captura=1`;
    document.body.appendChild(iframe);
  });
}

/* El PDF lo pinta pdf.js (primera página a 1280 de ancho, recortada a 720 de alto). Se carga solo
   cuando hace falta. */
async function capturarPdf(src: string): Promise<Blob | null> {
  const pdfjs = await import('pdfjs-dist/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const doc = await pdfjs.getDocument({ url: src }).promise;
  try {
    const pagina = await doc.getPage(1);
    const base = pagina.getViewport({ scale: 1 });
    const vista = pagina.getViewport({ scale: ANCHO / base.width });
    const lienzo = document.createElement('canvas');
    lienzo.width = ANCHO;
    lienzo.height = ALTO;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ANCHO, ALTO);
    await pagina.render({ canvas: lienzo, canvasContext: ctx, viewport: vista }).promise;
    return await new Promise((r) => lienzo.toBlob((b) => r(b), 'image/jpeg', 0.8));
  } finally {
    void doc.destroy();
  }
}

export async function generarPortada(a: { id: string; version: number; tipo: string; captura: string }): Promise<string | null> {
  let jpeg: Blob | null = null;
  try {
    jpeg = a.tipo === 'pdf' ? await capturarPdf(a.captura) : await capturarHtml(a.captura);
  } catch (e) {
    console.warn('[deliv_r] portada', a.id, e);
  }
  if (!jpeg) return null;
  try {
    const res = await fetch(`/api/deliv_r/artefactos/${a.id}/portada?version=${a.version}`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: jpeg,
    });
    if (!res.ok) return null;
  } catch {
    return null;
  }
  return URL.createObjectURL(jpeg);
}

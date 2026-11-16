import { toBlob } from 'html-to-image';
import { zipSync, strToU8 } from 'fflate';
import { CANVASES, EXPORT_SCALE, type CanvasId } from './types.ts';

/* Exportación a PNG.
   ─────────────────────────────────────────────────────────────────────────
   SE EXPORTA DESDE EL DOM, A PROPÓSITO. No se vuelve a dibujar la tarjeta
   en el servidor.

   El motivo está escrito en el CLAUDE.md del repo: la portada del deck ya
   tuvo que redibujarse a mano para la imagen de previsualización, porque
   satori no sabe ejecutar nuestro React ni nuestro CSS. Eso creó una
   **segunda fuente del diseño** que hay que mantener en paralelo y que
   deriva en cuanto alguien toca una y no la otra. Repetir esa jugada con
   nueve layouts serían nueve derivas.

   Exportando el nodo que ya está pintado, el PNG y la vista previa no
   pueden diferir: son el mismo árbol.

   El lienzo se pinta a tamaño real (1080 de ancho) y el multiplicador lo
   aplica `pixelRatio`, así que el resultado sale a 2160 — exactamente el
   tamaño al que Interactius ya exporta sus carruseles. */

export class ExportError extends Error {}

/** Nombre de archivo seguro y legible: `comercio-agentico-03.png`. */
export function fileName(base: string, index: number, total: number): string {
  const slug =
    base
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'social';
  const width = String(total).length;
  return `${slug}-${String(index + 1).padStart(Math.max(2, width), '0')}.png`;
}

/* LAS FOTOS SE INCRUSTAN AQUÍ, Y NO SE DEJA QUE LO HAGA html-to-image.
   ─────────────────────────────────────────────────────────────────────────
   Esto no es una optimización: es la corrección de un fallo que hacía que
   un carrusel entero se exportara con la foto de la portada repetida en
   todas las tarjetas.

   html-to-image cachea cada recurso que descarga, y para calcular la clave
   hace esto (`lib/dataurl.js`, v1.11.13):

       if (/ttf|otf|eot|woff2?/i.test(key)) key = key.replace(/.*\/ /, '')

   La intención es que una fuente se cachee por su nombre de archivo y no
   por la URL entera. El problema es que la condición mira la URL COMPLETA,
   así que basta con que esas tres letras aparezcan en cualquier parte para
   que el recurso se trate como una fuente y la clave se reduzca al nombre
   del archivo.

   Y aquí se juntan dos cosas que por separado no hacen daño:

     · el id del proyecto de Supabase es `gcvzzpggpsnlwqnotfqv`, que
       contiene «otf» (…qn-OTF-qv). Lo tiene TODA URL del banco de
       imágenes.
     · toda imagen del banco guarda su versión ligera en
       `images/<uuid>/light.jpg` (ver `variantPaths` en lib/images/upload.ts),
       o sea que TODAS se llaman igual.

   Resultado: la clave de cualquier foto del banco es `[image/jpeg]light.jpg`.
   La primera que se descarga se queda en la caché y todas las demás
   devuelven esa. Con fotos locales no pasa, porque sus nombres son
   distintos: por eso el fallo solo salía con imágenes subidas.

   La caché es de módulo, así que una vez envenenada lo sigue estando
   mientras no se recargue la página: tampoco bastaba con exportar de una
   en una.

   Incrustando nosotros las fotos como `data:` antes de capturar,
   html-to-image ve una URL que ya es un dato y ni la mira
   (`embed-images.js` salta los `src` que ya son `data:`). Dejamos de
   depender de su caché, y de paso la nuestra sí distingue por la URL
   entera. */

/** Caché propia, por URL COMPLETA. Un carrusel repite fotos y no hay por
    qué bajarlas una vez por tarjeta. */
const incrustadas = new Map<string, string>();

async function aDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src;
  const guardada = incrustadas.get(src);
  if (guardada) return guardada;

  const res = await fetch(src, { mode: 'cors', cache: 'no-cache' });
  if (!res.ok) throw new ExportError(`No se ha podido leer una imagen de la tarjeta (${res.status}).`);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((ok, falla) => {
    const fr = new FileReader();
    fr.onload = () => ok(String(fr.result));
    fr.onerror = () => falla(new ExportError('No se ha podido leer una imagen de la tarjeta.'));
    fr.readAsDataURL(blob);
  });
  incrustadas.set(src, dataUrl);
  return dataUrl;
}

/* Cambia los `src` por datos, hace la captura y los deja como estaban.
   El `finally` no es decorativo: si la captura falla, la tarjeta tiene que
   volver a su sitio o la vista previa se queda con las fotos incrustadas. */
async function conFotosIncrustadas<T>(node: HTMLElement, capturar: () => Promise<T>): Promise<T> {
  const imgs = Array.from(node.querySelectorAll('img'));
  const originales = imgs.map((img) => img.getAttribute('src'));
  try {
    await Promise.all(
      imgs.map(async (img, i) => {
        const src = originales[i];
        if (!src) return;
        img.setAttribute('src', await aDataUrl(src));
        /* Esperar a que decodifique: si no, se captura un hueco. */
        await img.decode().catch(() => {});
      }),
    );
    return await capturar();
  } finally {
    imgs.forEach((img, i) => {
      const src = originales[i];
      if (src == null) img.removeAttribute('src');
      else img.setAttribute('src', src);
    });
  }
}

async function nodeToPng(node: HTMLElement, canvas: CanvasId): Promise<Blob> {
  const spec = CANVASES[canvas];
  const blob = await conFotosIncrustadas(node, () =>
    toBlob(node, {
      width: spec.w,
      height: spec.h,
      pixelRatio: EXPORT_SCALE,
      /* El lienzo se mide en px propios; cualquier factor de visualización que
         traiga la vista previa se anula aquí para que el PNG no herede el zoom. */
      style: { transform: 'none', transformOrigin: 'top left' },
      /* `cacheBust` sigue para lo que no son fotos (las fuentes), que es
         donde esa caché sí hace lo que debe. */
      cacheBust: true,
    }),
  );
  if (!blob) throw new ExportError('El navegador no ha devuelto la imagen.');
  return blob;
}

/** Descarga una tarjeta suelta. */
export async function exportCard(
  node: HTMLElement,
  canvas: CanvasId,
  name: string,
): Promise<void> {
  const blob = await nodeToPng(node, canvas);
  download(blob, name);
}

/* Descarga el carrusel entero en un .zip.

   En zip y no en descargas sueltas porque un carrusel son siete u ocho
   archivos y los navegadores bloquean las descargas múltiples seguidas; y
   porque dentro del zip van numerados, que es lo que fija el orden al
   subirlos. `fflate` ya estaba en el proyecto. */
export async function exportAll(
  nodes: HTMLElement[],
  canvas: CanvasId,
  base: string,
): Promise<void> {
  if (!nodes.length) throw new ExportError('No hay ninguna tarjeta que exportar.');
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < nodes.length; i++) {
    const blob = await nodeToPng(nodes[i], canvas);
    files[fileName(base, i, nodes.length)] = new Uint8Array(await blob.arrayBuffer());
  }
  /* Una nota dentro del zip con el tamaño real, para quien lo reciba y no
     haya estado en esta conversación. */
  const spec = CANVASES[canvas];
  files['LEEME.txt'] = strToU8(
    `${base}\n${nodes.length} imagen(es) · ${spec.w * EXPORT_SCALE}×${spec.h * EXPORT_SCALE} px (${spec.ratio})\n` +
      `Generado con el Social Maker de Interactius.\n`,
  );
  const zip = zipSync(files, { level: 6 });
  /* `slice()` sobre el buffer: fflate puede devolver una vista de un buffer
     mayor, y pasarla tal cual al Blob metería bytes de más. */
  download(
    new Blob([zip.slice().buffer as ArrayBuffer], { type: 'application/zip' }),
    `${fileName(base, 0, 1).replace(/-\d+\.png$/, '')}.zip`,
  );
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  /* El objeto se libera en el siguiente tick: revocarlo antes aborta la
     descarga en Safari. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

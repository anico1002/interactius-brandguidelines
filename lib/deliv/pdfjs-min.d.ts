/* La build minificada de pdf.js (la que carga capturar.ts: con Next 15, la build normal falla al
   empaquetarse con «Object.defineProperty called on non-object») tiene la misma API que el paquete. */
declare module 'pdfjs-dist/build/pdf.min.mjs' {
  export * from 'pdfjs-dist';
}

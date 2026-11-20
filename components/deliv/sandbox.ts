/* El sandbox del HTML de un artefacto: sin allow-same-origin (lo refuerza la CSP de la ruta de
   archivos), así que no puede leer la sesión ni actuar como el sitio. Lo usan el visor del cliente
   y las miniaturas de la galería: una sola definición para que nunca diverjan. */
export const SANDBOX_HTML =
  'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads';

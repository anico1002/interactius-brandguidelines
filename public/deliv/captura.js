/*
 * Captura de portada de Deliv_r. Corre DENTRO del iframe aislado del artefacto (origen opaco, sin
 * sesión), solo cuando la galería del equipo pide el archivo con `?captura=1`. Fotografía la
 * primera pantalla (1280×720) con html-to-image y devuelve solo la imagen a la ventana madre.
 * Ver lib/deliv/portada.ts.
 */
(function () {
  if (window.parent === window) return;
  var ANCHO = 1280;
  var ALTO = 720;
  var ESPERA_MS = 1200; // animaciones de entrada, carruseles que arrancan
  var TOPE_RECURSOS_MS = 8000; // fuentes e imágenes de la primera pantalla: no se espera más
  var TOPE_LOAD_MS = 12000; // una página cuyo `load` no llega nunca se fotografía igual
  var PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  var enviado = false;

  function enviar(m) {
    if (enviado) return;
    enviado = true;
    window.parent.postMessage(Object.assign({ deliv: 'portada' }, m), '*');
  }

  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* Solo cuenta lo que se ve en la primera pantalla. Una imagen con loading="lazy" por debajo no
     se carga nunca en un iframe que no se desplaza: esperarla colgaría la captura. */
  function enPrimeraPantalla(el) {
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < ALTO && r.right > 0 && r.left < ANCHO;
  }

  function imagenesCargadas() {
    var pendientes = Array.prototype.filter.call(document.images, function (i) {
      if (!enPrimeraPantalla(i)) return false;
      // Una diferida visible puede no haber arrancado: se le quita el diferido.
      if (i.loading === 'lazy') i.loading = 'eager';
      return !i.complete;
    });
    return Promise.all(pendientes.map(function (i) {
      return new Promise(function (r) { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); });
    }));
  }

  function fondo() {
    var b = getComputedStyle(document.body).backgroundColor;
    var h = getComputedStyle(document.documentElement).backgroundColor;
    var vacio = function (c) { return !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)'; };
    return !vacio(b) ? b : !vacio(h) ? h : '#ffffff';
  }

  function capturar() {
    window.scrollTo(0, 0);
    var fuentes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([Promise.all([fuentes, imagenesCargadas()]), espera(TOPE_RECURSOS_MS)])
      .then(function () { return espera(ESPERA_MS); })
      .then(function () {
        return window.htmlToImage.toJpeg(document.documentElement, {
          width: ANCHO,
          height: ALTO,
          canvasWidth: ANCHO,
          canvasHeight: ALTO,
          pixelRatio: 1,
          quality: 0.8,
          backgroundColor: fondo(),
          // Una imagen que no se pueda incrustar no tumba la captura.
          imagePlaceholder: PIXEL,
          // Fuera: vídeo y audio (no aportan y pueden bloquear) y toda imagen por debajo de la
          // primera pantalla (no sale en la portada y obligaría a descargarlas todas).
          filter: function (n) {
            if (n instanceof HTMLVideoElement || n instanceof HTMLAudioElement) return false;
            if (n instanceof HTMLImageElement && !enPrimeraPantalla(n)) return false;
            return true;
          },
        });
      })
      .then(function (imagen) { enviar({ ok: true, imagen: imagen }); })
      .catch(function (e) { enviar({ ok: false, error: String((e && e.message) || e) }); });
  }

  var arrancado = false;
  function arrancar() { if (!arrancado) { arrancado = true; capturar(); } }
  if (document.readyState === 'complete') arrancar();
  else {
    window.addEventListener('load', arrancar, { once: true });
    setTimeout(arrancar, TOPE_LOAD_MS);
  }
})();

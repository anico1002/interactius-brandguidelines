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
  var enviado = false;

  function enviar(m) {
    if (enviado) return;
    enviado = true;
    window.parent.postMessage(Object.assign({ deliv: 'portada' }, m), '*');
  }

  function imagenesCargadas() {
    var pendientes = Array.prototype.filter.call(document.images, function (i) { return !i.complete; });
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
    Promise.all([fuentes, imagenesCargadas()])
      .then(function () { return new Promise(function (r) { setTimeout(r, ESPERA_MS); }); })
      .then(function () {
        return window.htmlToImage.toJpeg(document.documentElement, {
          width: ANCHO,
          height: ALTO,
          canvasWidth: ANCHO,
          canvasHeight: ALTO,
          pixelRatio: 1,
          quality: 0.8,
          backgroundColor: fondo(),
          // Vídeo y audio no aportan a una portada y pueden bloquear la captura.
          filter: function (n) { return !(n instanceof HTMLVideoElement || n instanceof HTMLAudioElement); },
        });
      })
      .then(function (imagen) { enviar({ ok: true, imagen: imagen }); })
      .catch(function (e) { enviar({ ok: false, error: String((e && e.message) || e) }); });
  }

  if (document.readyState === 'complete') capturar();
  else window.addEventListener('load', capturar, { once: true });
})();

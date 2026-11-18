'use client';

import { useEffect, useState } from 'react';

/**
 * «Cerrar sesión» de cliente: POST a /clientes/logout, que borra la cookie y vuelve a `next`
 * (validado en el servidor). Sin `next` (la página de «Sin acceso» no conoce su ruta) se toma la
 * de la propia pestaña, para que tras salir aparezca el login de ese enlace. Sin JavaScript sigue
 * funcionando: vuelve a la raíz.
 */
export function BotonSalir({ next }: { next?: string }) {
  const [destino, setDestino] = useState(next ?? '');
  useEffect(() => {
    if (!next) setDestino(window.location.pathname);
  }, [next]);
  return (
    <form method="post" action="/clientes/logout">
      <input type="hidden" name="next" value={destino} />
      <button type="submit" className="dc-link">
        <span>Cerrar sesión</span>
      </button>
    </form>
  );
}

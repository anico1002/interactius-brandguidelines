import type { MetadataRoute } from 'next';

/* /clientes es la zona privada de Deliv_r: entregables confidenciales tras login. Ya va con
   `noindex` (cabecera del middleware y metadatos de app/clientes/layout.tsx); esto evita además
   que los rastreadores la pidan. El resto del sitio sigue abierto, como hasta ahora. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/clientes'] },
  };
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { Accion } from './Cabecera';

/* «Copiar enlace» / «Copiar datos»: copia y pasa a «Copiado» durante 1,5 s (prototipo, detalle 7). */
export function CopiarEnlace({ texto, etiqueta = 'Copiar enlace' }: { texto: string; etiqueta?: string }) {
  const [copiado, setCopiado] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      return;
    }
    setCopiado(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setCopiado(false), 1500);
  };

  return <Accion onClick={copiar}>{copiado ? 'Copiado' : etiqueta}</Accion>;
}

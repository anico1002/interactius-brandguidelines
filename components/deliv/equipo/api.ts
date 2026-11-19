'use client';
import { useSyncExternalStore } from 'react';

import { NO_DISPONIBLE } from './formato';

export type Resultado<T> = { ok: true; datos: T } | { ok: false; mensaje: string };

/* Llama a una API de /api/deliv_r. Los errores del servidor traen `mensaje`; si no, el genérico. */
export async function enviar<T = Record<string, unknown>>(
  url: string,
  metodo: 'POST' | 'PATCH' | 'DELETE',
  cuerpo?: unknown,
): Promise<Resultado<T>> {
  try {
    const res = await fetch(url, {
      method: metodo,
      headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    const datos = await res.json().catch(() => null);
    if (!res.ok) {
      const m = datos && typeof datos.mensaje === 'string' ? datos.mensaje : NO_DISPONIBLE;
      return { ok: false, mensaje: m };
    }
    return { ok: true, datos: (datos ?? {}) as T };
  } catch {
    return { ok: false, mensaje: NO_DISPONIBLE };
  }
}

const sinSuscripcion = () => () => {};

/* El origen de la página (la API devuelve enlaces relativos). Vacío en el servidor. */
export function useOrigen(): string {
  return useSyncExternalStore(sinSuscripcion, () => window.location.origin, () => '');
}

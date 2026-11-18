'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { SessionUser } from '@/lib/auth/sessionUser';
import { Cabecera, Enlace } from './Cabecera';
import { personas, plegar } from './formato';

export interface FilaListado {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  cliente: string;
  clienteNombre: string;
  /** `subiendo`: subida a medias, sin personas ni enlace. */
  estado: string;
  personas: number;
}

const LUPA = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden style={{ flexShrink: 0, color: 'var(--c-ash)' }}>
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" strokeLinecap="round" />
  </svg>
);

/* La galería: secciones por cliente, buscador por título y cliente desde el tercer carácter. */
export function Listado({ user, artefactos }: { user: SessionUser; artefactos: FilaListado[] }) {
  const [q, setQ] = useState('');
  const termino = plegar(q.trim());
  const filtrando = termino.length >= 3;
  const lista = artefactos.filter((a) => !filtrando || plegar(`${a.titulo} ${a.clienteNombre}`).includes(termino));

  const grupos: { cliente: string; nombre: string; items: FilaListado[] }[] = [];
  for (const a of lista) {
    let g = grupos.find((x) => x.cliente === a.cliente);
    if (!g) {
      g = { cliente: a.cliente, nombre: a.clienteNombre, items: [] };
      grupos.push(g);
    }
    g.items.push(a);
  }

  const buscador = (
    <div className="dq-busca">
      {LUPA}
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por título o cliente"
        aria-label="Buscar por título o cliente"
        autoComplete="off"
      />
    </div>
  );

  return (
    <>
      <Cabecera user={user} busqueda={buscador} />
      <main className="dq-ws">
        <div className="dq-intro">
          <h1 className="dc-titulo">Entregables</h1>
          <div className="dq-acts">
            <Enlace href="/workspace/deliv_r/nuevo">Nuevo artefacto</Enlace>
            <Enlace href="/workspace/deliv_r/usuarios">Usuarios</Enlace>
          </div>
        </div>

        {artefactos.length === 0 ? (
          <div className="dq-vacio">
            <p>Aún no has publicado ningún entregable. Sube un HTML o un PDF exportado de claude.ai y compártelo con tu cliente.</p>
            <Enlace href="/workspace/deliv_r/nuevo">Nuevo artefacto</Enlace>
          </div>
        ) : grupos.length === 0 ? (
          <div className="dq-vacio"><p>Ningún artefacto coincide con la búsqueda.</p></div>
        ) : (
          grupos.map((g) => (
            <section key={g.cliente} className="dq-cliente">
              <h2 className="dq-sec">{g.nombre.toUpperCase()} · {g.items.length}</h2>
              {g.items.map((a) => (
                <Link key={a.id} className="dq-fila" href={`/workspace/deliv_r/${a.id}`}>
                  <span className="dq-fila__t">{a.titulo}</span>
                  <span className="dq-fila__m">{a.tipo.toUpperCase()}</span>
                  <span className="dq-fila__m">{a.fecha}</span>
                  <span className="dq-fila__m dq-fila__m--r">{a.estado === 'publicado' ? personas(a.personas) : 'Subiendo'}</span>
                </Link>
              ))}
            </section>
          ))
        )}
      </main>
    </>
  );
}

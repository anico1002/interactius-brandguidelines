'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { SessionUser } from '@/lib/auth/sessionUser';
import { FilterBar, SearchField } from '@/components/studio/GalleryFilters';
import { colors } from '@/components/deck/studio/ui';
import { Cabecera, Enlace } from './Cabecera';
import { generarPortada } from './capturar';
import { plegar } from './formato';

export interface FilaListado {
  id: string;
  titulo: string;
  tipo: string;
  /** «18 de noviembre de 2026». */
  creado: string;
  /** ISO, para ordenar. */
  creadoEn: string;
  cliente: string;
  clienteNombre: string;
  /** `subiendo`: subida a medias, sin portada ni enlace. */
  estado: string;
  version: number;
  /** URL firmada de la portada guardada; null si aún no hay. */
  portada: string | null;
  /** Sin portada: URL con token para generarla aquí. */
  captura: string | null;
}

const MONO = 'var(--font-ibm-plex-mono, monospace)';
const SEARCH_MIN = 3; // como en DeckMak_r y FormMak_r: el filtro entra desde el tercer carácter

/* La galería de Deliv_r, con el traje de DeckMak_r y FormMak_r: buscador centrado en la cabecera,
   filtro de cliente, rejilla 16:9 y, primera, la celda de crear. Las medidas (1120, 240, 28, 40/11 px
   del «+») son las de DeckGallery: si cambian allí, cambian aquí. */
export function Listado({ user, artefactos }: { user: SessionUser; artefactos: FilaListado[] }) {
  const [q, setQ] = useState('');
  const [cliente, setCliente] = useState<string | null>(null);
  const generadas = usePortadasQueFaltan(artefactos);

  const clientes = useMemo(
    () => [...new Set(artefactos.map((a) => a.clienteNombre))].sort((a, b) => a.localeCompare(b, 'es')),
    [artefactos],
  );

  const lista = useMemo(() => {
    const termino = plegar(q.trim());
    const buscar = termino.length >= SEARCH_MIN;
    return artefactos
      .filter((a) => !cliente || a.clienteNombre === cliente)
      .filter((a) => !buscar || plegar(`${a.titulo} ${a.clienteNombre}`).includes(termino))
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  }, [artefactos, q, cliente]);

  return (
    <div style={{ minHeight: '100vh', background: colors.warmLight, color: colors.dark }}>
      <Cabecera
        user={user}
        busqueda={<SearchField value={q} onChange={setQ} label="Buscar artefactos por título o cliente" width={380} />}
      />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 32px 64px' }}>
        {/* Fila de filtros: el desplegable centrado, como en DeckMak_r, y «Gestión Usuarios» al
            borde derecho de la rejilla. Tres columnas para que el enlace no descentre el filtro. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <span />
          <FilterBar
            clients={clientes}
            client={cliente}
            onClient={setCliente}
            allTags={[]}
            selectedTags={[]}
            onToggleTag={() => {}}
            marginBottom={0}
          />
          <span style={{ justifySelf: 'end' }}>
            <Enlace href="/workspace/deliv_r/usuarios">Gestión Usuarios</Enlace>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 28 }}>
          <NuevoArtefacto />
          {lista.map((a) => <Tarjeta key={a.id} a={a} portada={a.portada ?? generadas[a.id] ?? null} />)}
        </div>

        {artefactos.length > 0 && lista.length === 0 && (
          <div style={{ font: `400 12px/1.4 ${MONO}`, color: colors.ash, marginTop: 24 }}>
            No hay artefactos que coincidan con el filtro.
          </div>
        )}
      </div>
    </div>
  );
}

/* La celda de crear: la misma que «Crear nueva presentación» de DeckMak_r. Aquí es un enlace,
   porque subir un artefacto tiene su propia página. */
function NuevoArtefacto() {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href="/workspace/deliv_r/nuevo"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: hover ? colors.white : 'transparent', border: `2px solid ${colors.dark}`,
        aspectRatio: '16 / 9', transition: 'background .15s', textDecoration: 'none',
      }}
    >
      <span aria-hidden style={{ font: `300 40px/1 ${MONO}`, color: colors.dark }}>+</span>
      <span style={{ font: `500 11px/1 ${MONO}`, letterSpacing: '.04em', color: colors.dark }}>Nuevo artefacto</span>
    </Link>
  );
}

/* Una tarjeta: el artefacto en miniatura, y debajo el nombre, «Cliente · TIPO» y la fecha de creación. */
function Tarjeta({ a, portada }: { a: FilaListado; portada: string | null }) {
  const [hover, setHover] = useState(false);
  const subiendo = a.estado !== 'publicado';
  return (
    <Link
      href={`/workspace/deliv_r/${a.id}`}
      title="Abrir ficha"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none', color: 'inherit' }}
    >
      <div
        style={{
          position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', lineHeight: 0,
          background: '#E7E1D9', border: `1px solid ${hover ? colors.dark : colors.warmDark}`,
          boxShadow: hover ? '0 6px 18px rgba(28,26,23,.16)' : 'none',
          transform: hover ? 'translateY(-2px)' : 'none',
          transition: 'transform .15s, box-shadow .15s, border-color .15s',
        }}
      >
        {portada && (
          // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage o blob local: next/image no aporta aquí.
          <img src={portada} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        )}
        {subiendo && (
          <span
            style={{
              position: 'absolute', top: 10, left: 10, padding: '4px 8px', lineHeight: 1,
              font: `500 9px/1 ${MONO}`, letterSpacing: '.08em', textTransform: 'uppercase',
              color: colors.ash, border: `1px solid ${colors.ash}`,
            }}
          >
            Subiendo
          </span>
        )}
      </div>
      <div style={{ paddingLeft: 2 }}>
        <div style={{ font: `500 11px/1.4 ${MONO}`, color: colors.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.titulo}
        </div>
        <div style={{ font: `400 10px/1.4 ${MONO}`, color: colors.ash, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {a.clienteNombre} · {a.tipo.toUpperCase()}
        </div>
        <div style={{ font: `400 10px/1.4 ${MONO}`, color: colors.ash }}>{a.creado}</div>
      </div>
    </Link>
  );
}

/* Genera, de una en una, las portadas que faltan (lib/deliv/portada.ts). Cada una carga el
   artefacto entero una sola vez; después la galería solo pide la imagen. */
function usePortadasQueFaltan(artefactos: FilaListado[]): Record<string, string> {
  const [generadas, setGeneradas] = useState<Record<string, string>>({});
  useEffect(() => {
    let vivo = true;
    const pendientes = artefactos.filter((a) => !a.portada && a.captura);
    (async () => {
      for (const a of pendientes) {
        if (!vivo) return;
        const url = await generarPortada({ id: a.id, version: a.version, tipo: a.tipo, captura: a.captura as string });
        if (vivo && url) setGeneradas((g) => ({ ...g, [a.id]: url }));
      }
    })();
    return () => { vivo = false; };
  }, [artefactos]);
  return generadas;
}

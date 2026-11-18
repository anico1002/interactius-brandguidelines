'use client';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { infoCliente, pendientes, pesoLegible, rutaEnBucket, tratamiento, type ClienteExistente } from '@/lib/deliv/informe';
import { optimizarArtefacto, type FilaPeso } from '@/lib/deliv/optimizar';
import { clasificar, detectarAvisos, type ArchivoSubida } from '@/lib/deliv/subida';
import type { TipoArtefacto } from '@/lib/deliv/tipos';
import { optimizadorImagenNavegador } from '../optimizador-imagen';
import { Accion, Enlace } from './Cabecera';
import { enviar } from './api';
import { NO_DISPONIBLE } from './formato';

interface Preparado {
  nombre: string;
  tipo: TipoArtefacto;
  entrada: string;
  archivos: ArchivoSubida[];
  informe: FilaPeso[];
  total: { original: number; final: number };
  incrustadas: boolean;
  avisos: string[];
}

interface Borrador {
  id: string;
  version: number;
  tokens: Map<string, string>;
  hechos: Set<string>;
  /** Cliente y título con que se creó: si cambian, el borrador ya no sirve. */
  clave: string;
}
type Fase = 'inicio' | 'optimizando' | 'subiendo' | 'publicando';

const PARALELO = 3;
const TEXTO_CLAUDE =
  'Este HTML llama a funciones que solo existen dentro de claude.ai. Fuera de allí esas partes pueden aparecer vacías para tu cliente.';
const BUCKET = 'deliv-r';

/* Nuevo artefacto (sin `id`) o sustituir archivo (con `id`): elegir, informe de peso, subir y publicar. */
export function Subida({
  id, titulo: tituloFicha, clientes,
}: { id?: string; titulo: string | null; clientes: ClienteExistente[] }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [cliente, setCliente] = useState('');
  const [titulo, setTitulo] = useState('');
  const [prep, setPrep] = useState<Preparado | null>(null);
  const [fase, setFase] = useState<Fase>('inicio');
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [faltan, setFaltan] = useState<string[] | null>(null);
  const [avisos, setAvisos] = useState<string[] | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const borrador = useRef<Borrador | null>(null);

  const ci = useMemo(() => infoCliente(cliente, clientes), [cliente, clientes]);
  const ocupado = fase !== 'inicio';
  const listo = !!prep && !ocupado && (id ? true : !!ci.crudo && !!ci.slug && !ci.error && !!titulo.trim());

  /* Borrador abandonado: se borra en el servidor (mejor esfuerzo) y se olvida. */
  const descartarBorrador = () => {
    const b = borrador.current;
    borrador.current = null;
    if (b && !id) void enviar(`/api/deliv_r/artefactos/${b.id}`, 'DELETE');
  };

  const elegir = async (f: File | undefined) => {
    setError(null); setFaltan(null); setAvisos(null); setPrep(null); setConfirmando(false);
    descartarBorrador();
    if (!f) return;
    setFase('optimizando');
    try {
      const datos = new Uint8Array(await f.arrayBuffer());
      const c = clasificar(f.name, datos);
      if (!c.ok) { setError(c.error); return; }
      const o = await optimizarArtefacto(c.archivos, optimizadorImagenNavegador);
      setPrep({
        nombre: f.name, tipo: c.tipo, entrada: c.entrada, archivos: o.archivos, informe: o.informe,
        total: o.total, incrustadas: o.archivos.length !== c.archivos.length,
        avisos: detectarAvisos(o.archivos),
      });
    } catch {
      setError('No se ha podido leer el archivo.');
    } finally {
      setFase('inicio');
    }
  };

  const quitar = () => {
    if (entrada.current) entrada.current.value = '';
    void elegir(undefined);
  };

  const publicar = async (b: Borrador, p: Preparado, aceptar: boolean) => {
    setFase('publicando');
    const rutas = p.archivos.map((a) => a.ruta);
    let datos: { publicado?: boolean; avisos?: string[]; faltan?: string[]; mensaje?: string } | null = null;
    try {
      const res = await fetch(`/api/deliv_r/artefactos/${b.id}/publicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: b.version, rutas, tipo: p.tipo, entrada: p.entrada, aceptarAvisos: aceptar }),
      });
      datos = await res.json().catch(() => null);
      if (res.status === 409 && datos?.faltan) {
        for (const f of datos.faltan) b.hechos.delete(f);
        setFaltan(datos.faltan); setFase('inicio'); return;
      }
      if (!res.ok) datos = { mensaje: datos?.mensaje ?? NO_DISPONIBLE };
    } catch {
      datos = { mensaje: NO_DISPONIBLE };
    }
    if (!datos || datos.mensaje) { setError(datos?.mensaje ?? NO_DISPONIBLE); setFase('inicio'); return; }
    if (datos.publicado) { router.push(`/workspace/deliv_r/${b.id}`); return; }
    if (datos.avisos?.length) setAvisos(datos.avisos);
    else setError(NO_DISPONIBLE);
    setFase('inicio');
  };

  const subir = async (aceptar: boolean) => {
    if (!prep || !listo) return;
    setError(null); setFaltan(null); setAvisos(null);
    setFase('subiendo'); setPct(0);
    const clave = `${ci.slug}\n${ci.nombre}\n${titulo.trim()}`;
    if (id || borrador.current?.clave !== clave) descartarBorrador();
    if (!borrador.current) {
      const cuerpoComun = {
        tipo: prep.tipo, entrada: prep.entrada,
        rutas: prep.archivos.map((a) => a.ruta), tamanos: prep.archivos.map((a) => a.datos.length),
      };
      const r = await enviar<{ id: string; version: number; subidas: { ruta: string; token: string }[] }>(
        id ? `/api/deliv_r/artefactos/${id}/version` : '/api/deliv_r/artefactos', 'POST',
        id ? cuerpoComun : { ...cuerpoComun, clienteNombre: ci.nombre, cliente: ci.slug, titulo: titulo.trim() },
      );
      if (!r.ok) { setError(r.mensaje); setFase('inicio'); return; }
      borrador.current = {
        id: r.datos.id, version: r.datos.version, clave, hechos: new Set(),
        tokens: new Map(r.datos.subidas.map((x) => [x.ruta, x.token])),
      };
    }
    const b = borrador.current;

    const faltantes = new Set(pendientes(prep.archivos.map((a) => a.ruta), b.hechos));
    const cola = prep.archivos.filter((a) => faltantes.has(a.ruta));
    const total = cola.reduce((s, a) => s + a.datos.length, 0) || 1;
    let hecho = 0;
    let siguiente = 0;
    let fallo = false;
    let reiniciar = false;
    const sb = supabaseBrowser();
    const trabajador = async () => {
      while (!fallo && siguiente < cola.length) {
        const a = cola[siguiente++];
        const token = b.tokens.get(a.ruta);
        if (!token) { fallo = true; reiniciar = true; return; }
        const { error: e } = await sb.storage.from(BUCKET).uploadToSignedUrl(
          rutaEnBucket(b.id, b.version, a.ruta), token,
          new Blob([a.datos as BlobPart], { type: a.tipoMime }), { contentType: a.tipoMime },
        );
        if (e) {
          fallo = true;
          if (/already exists|duplicate|expired|jwt|token/i.test(e.message ?? '')) reiniciar = true;
          return;
        }
        b.hechos.add(a.ruta);
        hecho += a.datos.length;
        setPct(Math.min(100, Math.round((hecho / total) * 100)));
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALELO, cola.length) }, trabajador));
    if (fallo) {
      if (reiniciar) descartarBorrador();
      setError('No se han podido subir todos los archivos. No se ha publicado nada.');
      setFase('inicio');
      return;
    }
    setPct(100);
    await publicar(b, prep, aceptar);
  };

  const alPublicar = () => {
    if (prep && prep.avisos.length && !confirmando) { setConfirmando(true); return; }
    void subir(prep ? prep.avisos.length > 0 : false);
  };

  const reintentar = () => void subir(!!prep && prep.avisos.length > 0 && confirmando);
  const volver = id ? `/workspace/deliv_r/${id}` : '/workspace/deliv_r';

  return (
    <main className="dq-ws dq-ws--ficha">
      <div className="dq-volver">
        <Enlace href={volver} s>{id ? 'Volver al artefacto' : 'Volver a la galería'}</Enlace>
      </div>
      <h1 className="dq-h1">{id ? 'Sustituir archivo' : 'Nuevo artefacto'}</h1>

      <div className="dc-form dq-subida">
        {id ? (
          <p className="dq-info">{tituloFicha}</p>
        ) : (
          <>
            <div className="dc-campo">
              <label className="dc-etiqueta" htmlFor="cli">Cliente</label>
              <input
                id="cli" className="dc-input" autoComplete="off" placeholder="Cliente Ejemplo" value={cliente}
                aria-invalid={ci.error ? true : undefined} disabled={ocupado}
                onChange={(e) => setCliente(e.target.value)}
              />
              {ci.sugerencias.length > 0 && !ocupado && (
                <div className="dq-sugg">
                  {ci.sugerencias.map((c) => (
                    <button key={c.slug} type="button" className="dc-link dc-link--s" onClick={() => setCliente(c.nombre)}>
                      <span>{c.nombre}</span>
                    </button>
                  ))}
                </div>
              )}
              {ci.error ? (
                <p className="dc-error dq-error" role="alert">{ci.reservado ? 'Ese nombre está reservado. Usa otro.' : ci.error}</p>
              ) : (
                <p className="dq-nota">
                  {ci.slug
                    ? <>Dirección: /clientes/<b>{ci.slug}</b>/{ci.existente ? ' · cliente existente' : ' · cliente nuevo'}</>
                    : 'Escribe el cliente o elige uno de los existentes.'}
                </p>
              )}
            </div>
            <div className="dc-campo">
              <label className="dc-etiqueta" htmlFor="tit">Título</label>
              <input
                id="tit" className="dc-input" autoComplete="off" disabled={ocupado}
                placeholder="Informe del taller"
                value={titulo} onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="dc-campo">
          <span className="dc-etiqueta">Archivo</span>
          <p className="dq-nota">Un .html, .pdf o .zip con index.html en la raíz. Hasta 100 MB por artefacto.</p>
          <input
            ref={entrada} type="file" accept=".html,.htm,.pdf,.zip" hidden aria-label="Archivo del artefacto"
            onChange={(e) => void elegir(e.target.files?.[0])}
          />
          <div className="dq-acts">
            {prep ? (
              <>
                <span className="dq-estado">{prep.nombre}</span>
                <Accion s onClick={quitar} disabled={ocupado}>Quitar</Accion>
              </>
            ) : (
              <Accion s onClick={() => entrada.current?.click()} disabled={ocupado}>
                {fase === 'optimizando' ? 'Optimizando' : 'Elegir archivo'}
              </Accion>
            )}
          </div>
        </div>
      </div>

      {prep && <Informe prep={prep} />}

      {error && (
        <div className="dq-error">
          <p className="dc-error" role="alert">{error}</p>
          {prep && !ocupado && listo && (
            <div className="dq-acts"><Accion s onClick={reintentar}>Reintentar</Accion></div>
          )}
        </div>
      )}
      {faltan && (
        <div className="dq-error">
          <p className="dc-error" role="alert">Faltan archivos por subir: {faltan.join(', ')}.</p>
          {prep && !ocupado && listo && <div className="dq-acts"><Accion s onClick={reintentar}>Reintentar</Accion></div>}
        </div>
      )}

      {ocupado && fase !== 'optimizando' && (
        <div className="dq-bloque" role="status">
          <div className="dq-estado">{fase === 'publicando' ? 'Publicando' : `Subiendo · ${pct} %`}</div>
          <div className="dq-progreso"><i style={{ width: `${fase === 'publicando' ? 100 : pct}%` }} /></div>
        </div>
      )}

      {avisos ? (
        <div className="dq-borrar" role="alert">
          <p><b>Confirma la publicación</b></p>
          {avisos.map((a) => <p key={a}>{a}</p>)}
          <p>Publícalo solo si has comprobado que se ve bien sin ellas.</p>
          <div className="dq-acts">
            <Accion peligro onClick={() => { const b = borrador.current; setAvisos(null); if (b && prep) void publicar(b, prep, true); else void subir(true); }}>Publicar igualmente</Accion>
            <Accion onClick={() => setAvisos(null)}>Cancelar</Accion>
          </div>
        </div>
      ) : confirmando && prep && prep.avisos.length > 0 && !ocupado ? (
        <div className="dq-borrar" role="alert">
          <p><b>Confirma la publicación</b></p>
          <p>{TEXTO_CLAUDE} Publícalo solo si has comprobado que se ve bien sin ellas.</p>
          <div className="dq-acts">
            <Accion peligro onClick={alPublicar}>Publicar igualmente</Accion>
            <Accion onClick={() => { setConfirmando(false); quitar(); }}>Elegir otro archivo</Accion>
          </div>
        </div>
      ) : (
        <div className="dq-acts dq-bloque">
          <Accion onClick={alPublicar} disabled={!listo}>Publicar</Accion>
          <Enlace href={volver}>Cancelar</Enlace>
        </div>
      )}
    </main>
  );
}

function Informe({ prep }: { prep: Preparado }) {
  const grandes = prep.informe.filter((f) => f.consejo);
  return (
    <div className="dq-bloque">
      <div className="dq-eyebrow">Informe de peso · {prep.nombre}</div>
      <div className="dq-tabla">
        <table>
          <thead>
            <tr><th>Archivo</th><th className="n">Original</th><th className="n">Final</th><th>Tratamiento</th></tr>
          </thead>
          <tbody>
            {prep.informe.map((f) => (
              <tr key={f.ruta}>
                <td className={f.consejo ? 'dq-alerta' : undefined}>{f.ruta}</td>
                <td className="n">{pesoLegible(f.original)}</td>
                <td className={`n${f.consejo ? ' dq-alerta dq-fuerte' : ''}`}>{pesoLegible(f.final)}</td>
                <td className="dq-suave">{tratamiento(f)}</td>
              </tr>
            ))}
            <tr className="dq-total">
              <td>Total</td>
              <td className="n">{pesoLegible(prep.total.original)}</td>
              <td className="n">{pesoLegible(prep.total.final)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      {prep.incrustadas && (
        <p className="dq-nota">Las imágenes incrustadas en el HTML se extraen a archivos propios. El total cuenta todo el contenido.</p>
      )}
      {grandes.map((f) => (
        <div key={f.ruta} className="dq-borrar" role="alert">
          <p><b>{f.ruta} · {pesoLegible(f.final)}</b></p>
          <p>{f.consejo}</p>
        </div>
      ))}
      {prep.avisos.map((a) => (
        <div key={a} className="dq-borrar" role="alert"><p><b>Usa funciones de Claude</b></p><p>{TEXTO_CLAUDE}</p></div>
      ))}
    </div>
  );
}

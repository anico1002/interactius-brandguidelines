-- Deliv_r: tablas `deliv_artefactos`, `deliv_usuarios`, `deliv_accesos` y bucket privado `deliv-r`.
-- Definición: docs/features/deliv-r.md § Datos.
--
-- ADITIVA. Crea tres tablas, un bucket y tres políticas de Storage nuevas. No toca ninguna tabla,
-- bucket ni política existente. Se puede aplicar en cualquier momento, antes o después de desplegar.
--
-- QUIÉN ENTRA. Los clientes de Deliv_r NO son usuarios de Supabase: nunca tocan la base de datos ni
-- Storage directamente. Todo lo suyo lo sirve el servidor con la service role (lib/deliv/servidor.ts,
-- el único módulo que la usa). Por eso `anon` no tiene NADA: ni políticas ni privilegios.
-- `authenticated` es el equipo (alta limitada al dominio, 20260818090000_restrict_signup_domain.sql).
--
-- PRIVILEGIOS, Y POR QUÉ NO BASTA LA RLS NI UN `revoke select (hash)`.
-- Supabase tiene `alter default privileges in schema public grant all on tables to anon,
-- authenticated, service_role`: cada tabla nueva de `public` nace con TODOS los privilegios de tabla
-- para `anon` y `authenticated`. Dos consecuencias:
--   1. `revoke all ... from anon` en las tres tablas. Con RLS y sin políticas, anon ya ve 0 filas;
--      el revoke es la segunda cerradura (mismo criterio que 20260817121000_tighten_rls.sql): si
--      alguien desactiva la RLS para depurar, la tabla sigue cerrada.
--   2. El hash. En Postgres un privilegio de COLUMNA no resta de uno de TABLA: con `grant select on
--      deliv_usuarios to authenticated` (el de por defecto), `revoke select (hash) ... from
--      authenticated` no hace nada y el hash se sigue leyendo. Lo correcto es quitar el SELECT de
--      tabla y conceder SELECT solo de las columnas que no son el hash. Efecto secundario buscado:
--      `select=*` sobre deliv_usuarios con sesión de equipo da error de permiso; hay que nombrar las
--      columnas (lib/deliv/supabase-repo.ts lo hace).
--   Además, `authenticated` no ESCRIBE deliv_usuarios en absoluto (ni insert, ni update, ni delete,
--   ni truncate): hash, fallos, bloqueo y credenciales_en solo se cambian con la service role. Así un
--   miembro del equipo no puede, desde el navegador, ponerle a un cliente un hash que conozca.
--   `service_role` tiene BYPASSRLS y sus privilegios por defecto; se conceden explícitamente igual,
--   para que la migración no dependa de los default privileges del proyecto.
--
-- FK de deliv_accesos.email → deliv_usuarios: la comprobación la hace el trigger de integridad como
-- dueño de la tabla, así que el equipo puede conceder accesos sin privilegio sobre deliv_usuarios.
-- (Crear el usuario va antes, con la service role, en la ruta de accesos.)

begin;

-- ── Tablas ──────────────────────────────────────────────────────────────────

create table public.deliv_artefactos (
  id             uuid primary key default gen_random_uuid(),
  public_id      text not null unique check (public_id ~ '^[abcdefghijkmnpqrstuvwxyz23456789]{10}$'),
  cliente        text not null check (
                   cliente ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                   and cliente not in ('login', 'logout', 'admin', 'archivos')
                 ),
  cliente_nombre text not null,
  titulo         text not null,
  tipo           text not null check (tipo in ('html', 'pdf')),
  entrada        text not null,
  version        int  not null default 1 check (version >= 1),
  estado         text not null default 'subiendo' check (estado in ('subiendo', 'publicado')),
  avisos         text[] not null default '{}',
  creado_por     text not null,
  publicado_en   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- `email` va normalizado (trim + minúsculas) desde lib/deliv/ids.ts normalizarEmail(); no se repite
-- la regla en un check porque lower() de Postgres y toLowerCase() de JS no coinciden fuera de ASCII.
create table public.deliv_usuarios (
  email           text primary key check (email <> ''),
  hash            text,                                   -- scrypt; null = desactivado
  creado_por      text not null,
  credenciales_en timestamptz not null default now(),     -- sesiones anteriores dejan de valer
  fallos          int not null default 0 check (fallos >= 0),
  bloqueado_hasta timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.deliv_accesos (
  artefacto_id  uuid not null references public.deliv_artefactos (id) on delete cascade,
  email         text not null references public.deliv_usuarios (email) on delete cascade,
  concedido_por text not null,
  concedido_en  timestamptz not null default now(),
  ultimo_acceso timestamptz,
  primary key (artefacto_id, email)
);

-- La PK cubre las búsquedas por artefacto; esta, las de «a qué tiene acceso este usuario».
create index deliv_accesos_email_idx on public.deliv_accesos (email);
-- El listado del equipo: por cliente A-Z, más reciente primero.
create index deliv_artefactos_cliente_idx on public.deliv_artefactos (cliente, created_at desc);

-- `public.set_updated_at()` ya existe (la usan 20260915212500, 20261001100000 y 20261112120000).
create trigger deliv_artefactos_set_updated_at
  before update on public.deliv_artefactos
  for each row execute function public.set_updated_at();

create trigger deliv_usuarios_set_updated_at
  before update on public.deliv_usuarios
  for each row execute function public.set_updated_at();

-- ── RLS y privilegios ───────────────────────────────────────────────────────

alter table public.deliv_artefactos enable row level security;
alter table public.deliv_usuarios   enable row level security;
alter table public.deliv_accesos    enable row level security;

-- anon: ninguna política y ningún privilegio.
revoke all on public.deliv_artefactos from anon;
revoke all on public.deliv_usuarios   from anon;
revoke all on public.deliv_accesos    from anon;

-- authenticated (= equipo): gestiona artefactos y accesos.
create policy deliv_artefactos_team on public.deliv_artefactos
  for all to authenticated using (true) with check (true);
create policy deliv_accesos_team on public.deliv_accesos
  for all to authenticated using (true) with check (true);

-- deliv_usuarios: el equipo solo LEE, y nunca el hash (ver cabecera: hace falta quitar el SELECT de
-- tabla; revocar solo la columna no tendría efecto).
revoke all on public.deliv_usuarios from authenticated;
grant select (email, creado_por, credenciales_en, fallos, bloqueado_hasta, created_at, updated_at)
  on public.deliv_usuarios to authenticated;
create policy deliv_usuarios_team_read on public.deliv_usuarios
  for select to authenticated using (true);

grant all on public.deliv_artefactos to service_role;
grant all on public.deliv_usuarios   to service_role;
grant all on public.deliv_accesos    to service_role;

-- ── Bucket ──────────────────────────────────────────────────────────────────
-- Privado: sin URL pública. Al cliente se le sirve desde el servidor. Rutas `<id>/v<version>/<ruta>`.
-- Políticas para el equipo: insert (subida firmada), select (listar, descargar y —sin él— borrar no
-- borra, ver 20260915224000_storage_select_team.sql) y delete. Ninguna para anon.

insert into storage.buckets (id, name, public)
values ('deliv-r', 'deliv-r', false)
on conflict (id) do nothing;

create policy deliv_r_insert_team on storage.objects
  for insert to authenticated with check (bucket_id = 'deliv-r');
create policy deliv_r_select_team on storage.objects
  for select to authenticated using (bucket_id = 'deliv-r');
create policy deliv_r_delete_team on storage.objects
  for delete to authenticated using (bucket_id = 'deliv-r');

commit;

-- ── Comprobación posterior ──────────────────────────────────────────────────
-- Privilegios efectivos (debe salir false, false, false, true, false):
--   select has_table_privilege('anon', 'public.deliv_artefactos', 'select'),
--          has_table_privilege('authenticated', 'public.deliv_usuarios', 'select'),
--          has_column_privilege('authenticated', 'public.deliv_usuarios', 'hash', 'select'),
--          has_column_privilege('authenticated', 'public.deliv_usuarios', 'email', 'select'),
--          has_table_privilege('authenticated', 'public.deliv_usuarios', 'insert,update,delete');
-- Con la clave anónima y sin sesión: GET /rest/v1/deliv_artefactos?select=id → permiso denegado.
-- GET /storage/v1/object/list/deliv-r anónimo → nada.
-- Con sesión de equipo: GET /rest/v1/deliv_usuarios?select=hash → error de permiso;
--   ?select=email,fallos → filas; PATCH de deliv_usuarios → error de permiso.

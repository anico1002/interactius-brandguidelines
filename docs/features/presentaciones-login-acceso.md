# Acceso con login a las presentaciones (MVP)

> Plan de implementación de un MVP. El objetivo: que al abrir el enlace de una presentación,
> el destinatario deba **autenticarse con email + contraseña** para poder verla.

## Contexto

Hoy las presentaciones del generador de decks (`/[locale]/presentaciones`) se comparten con un enlace que **lleva el contenido entero codificado en la URL** (`#view=1&md=<base64url>`), renderizado 100% en cliente y sin backend (ver [ARQUITECTURA.md](../ARQUITECTURA.md) y [DeckStudio.tsx](../../components/deck/DeckStudio.tsx)).

Queremos que el cliente tenga que **loguearse** para acceder. La consecuencia técnica es ineludible:

> **Un candado solo en el navegador es falso.** Si el contenido sigue viajando en la URL, cualquiera con el enlace lo lee saltándose el login. Para que la protección sea real, la presentación debe **guardarse en servidor tras un ID** y servirse **solo después de autenticar**, nunca incrustada en la página para usuarios no autenticados.

Esto comparte la misma base que el plan de [firma del cliente](firma-cliente-presentaciones.md): ambos necesitan persistir el deck en servidor con un ID. Conviene construir esa base una sola vez.

### Decisiones del usuario
- **Identidad:** Supabase Auth gestionado (email + contraseña).
- **Gestión de credenciales:** el **editor las crea al publicar** la presentación (introduce email y contraseña del cliente al generar el enlace).
- Infra: la organización **Interactius** ya existe en Supabase (región UE); el deploy es Netlify con Route Handlers serverless.

## Objetivo del MVP

1. El editor, en DeckStudio, pulsa **"Publicar con acceso"**, introduce `email` + `contraseña` del cliente (y título), y obtiene un enlace protegido `/presentaciones/v/<id>`.
2. El cliente abre ese enlace → si no tiene sesión, ve un **formulario de login** → tras autenticarse correctamente y tener acceso a esa presentación, ve el deck en modo viewer.
3. Sin login válido o sin acceso concedido, **no puede obtener el contenido** (protegido por RLS en servidor).

Fuera de alcance del MVP: registro self-service, recuperación de contraseña, roles, panel de gestión de usuarios, caducidad de enlaces. Se anotan como ampliaciones.

## Arquitectura

```
Editor (DeckStudio)
   │  "Publicar con acceso" (email, password, título, md)
   ▼
POST /api/proposals  (Route Handler, service-role)
   ├─ guarda el deck en  proposals
   ├─ crea el usuario en Supabase Auth (admin.createUser)  [si no existe]
   └─ concede acceso en  proposal_access (proposal_id, user_id)
   ▼
Enlace:  /presentaciones/v/<id>
                    │
Cliente abre el enlace
   ▼
app/[locale]/presentaciones/v/[id]/page.tsx  (Server Component)
   ├─ ¿hay sesión Supabase?  no → render <LoginForm/>
   └─ sí → SELECT deck con RLS (solo si tiene acceso)
            ├─ sin acceso → 403 / login
            └─ con acceso → <DeckRenderer viewer/>  (reutiliza el viewer actual)
```

### Base de datos (Supabase, proyecto en la org Interactius, UE)
- `proposals`: `id (uuid)`, `title`, `client`, `md (text)`, `type`, `created_at`, `owner (uuid)`.
- `proposal_access`: `proposal_id (uuid fk)`, `user_id (uuid fk → auth.users)`, `created_at`. PK compuesta.
- **RLS activada** en `proposals`:
  - SELECT permitido solo si existe fila en `proposal_access` para `(proposal_id, auth.uid())`.
  - INSERT/escritura solo vía service-role (la Route Handler), no desde el cliente.

### Autenticación
- **Supabase Auth** con email/contraseña, integrado en Next App Router mediante **`@supabase/ssr`** (sesión en cookies, válida en Server Components y Route Handlers).
- El login del cliente usa `signInWithPassword` desde un componente cliente; la sesión queda en cookie y el Server Component la lee para autorizar.

## Cambios en el código

### Dependencias nuevas
- `@supabase/supabase-js` y `@supabase/ssr`.

### Variables de entorno (Netlify + `.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (cliente).
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; nunca expuesta). Añadir a `.gitignore` ya cubierto por `.env*.local`.

### Archivos nuevos
- `lib/supabase/server.ts` — cliente Supabase para Server Components/Route Handlers (lee cookies).
- `lib/supabase/client.ts` — cliente Supabase para componentes cliente (login).
- `app/api/proposals/route.ts` — `POST` publica el deck + crea usuario + concede acceso (service-role). Usar [app/api/eval/route.ts](../../app/api/eval/route.ts) como referencia de estructura de Route Handler.
- `app/[locale]/presentaciones/v/[id]/page.tsx` — Server Component: autoriza y renderiza el deck o el login.
- `components/deck/LoginForm.tsx` — formulario cliente (email + password → `signInWithPassword`), con manejo de error y estado de carga.

### Archivos a modificar
- [components/deck/DeckStudio.tsx](../../components/deck/DeckStudio.tsx) — añadir acción **"Publicar con acceso"** (inputs email/password/título → `POST /api/proposals` → mostrar el enlace protegido). El botón "Copiar URL" base64 actual puede quedarse para previsualización sin protección.
- [middleware.ts](../../middleware.ts) — **componer** el middleware de `next-intl` existente con el refresco de sesión de `@supabase/ssr`. ⚠️ Punto delicado: hoy el matcher excluye `/api`, `_next` y estáticos; hay que mantener i18n y añadir el refresh de token sin romper el routing de locale.
- `.gitignore` ya excluye `.env*.local` (sin cambios).

### Reutilización
- El **modo viewer** ya existe: `DeckRenderer deck={deck} viewer` + `ViewerContext` + clase `ix-viewer` ([DeckRenderer.tsx](../../components/deck/DeckRenderer.tsx), [viewer.ts](../../components/deck/viewer.ts)). El render del deck no cambia; solo cambia **de dónde sale el `md`** (de la BD en vez de la URL) y que está **detrás del login**.
- `compileDeck()` ([lib/deck/index.ts](../../lib/deck/index.ts)) se sigue usando igual sobre el `md` recuperado.

## Riesgos y notas
- **Componer middlewares** (next-intl + Supabase ssr) es la parte más frágil; conviene aislarlo y probarlo pronto.
- **`admin.createUser`** requiere service-role; debe ejecutarse **solo** en la Route Handler del servidor. Si el email ya existe, manejar el caso (reutilizar usuario y solo conceder acceso).
- **RLS bien configurada** es la garantía real de seguridad; verificar que sin fila en `proposal_access` el SELECT devuelve vacío.
- El enlace base64 antiguo seguirá siendo público; si se quiere, deshabilitarlo o marcarlo como "solo previsualización".
- Entregar credenciales por separado (el editor las comunica al cliente); el MVP no envía emails (se puede sumar luego, reutilizando el aviso del plan de firma).

## Ampliaciones futuras (fuera del MVP)
- Magic link / recuperación de contraseña.
- Caducidad y revocación de acceso por presentación.
- Panel interno para ver presentaciones publicadas y quién ha accedido.
- Registro de accesos (timestamp/IP) — encaja con la base del plan de firma.

## Verificación
1. Configurar Supabase (tablas + RLS) y las variables de entorno; `npm run dev`.
2. En DeckStudio: "Publicar con acceso" con un email/password de prueba → se obtiene `/presentaciones/v/<id>` y aparece una fila en `proposals` + `proposal_access`.
3. Abrir el enlace en una sesión anónima (otro navegador) → debe mostrar **login**, no el contenido.
4. Ver el HTML/red de esa primera carga: el `md` **no** debe estar presente sin autenticar.
5. Login con las credenciales correctas → se ve el deck en modo viewer.
6. Login con un usuario sin acceso a esa presentación → **denegado** (RLS).
7. Credenciales incorrectas → error claro, sin filtrar contenido.

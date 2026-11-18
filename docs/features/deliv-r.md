# Deliv_r · entregables privados para clientes

> El equipo publica un entregable confidencial (un HTML o un PDF exportado de claude.ai) y lo comparte
> con las personas del cliente que deben verlo: un enlace por entregable y usuario y contraseña por persona.
> Es la única tool del workspace con superficie pública protegida: el cliente entra, pero solo a lo suyo.

Estado: **implementado · pendiente de verificación en deploy preview y de aplicar la migración.** Plan por
bloques en `docs/superpowers/plans/2026-11-18-deliv-r.md`.

Prototipo: `deliv-r-prototype.html` en la raíz del repo. Es el contrato de interacción (ver
*Referentes y prototipo*).

## Implementación

Rama `feat/deliv-r`, noviembre de 2026, en diez bloques. El bloque 11 (migración, clave, pruebas en el
preview, PR y merge) lo hacen la usuaria y Carlos.

**Qué hay.**

- `/workspace/deliv_r` (galería por cliente con buscador), `/nuevo` (subida, también con `?id=` para sustituir
  el archivo), `/[id]` (ficha) y `/usuarios`. La tarjeta del catálogo está encendida (`href`).
- `/clientes/<cliente>/<id>`: login de cliente, visor con barra negra, «No tienes acceso» y «Servicio no
  disponible.» si falta una clave. Archivos servidos con token HMAC de 15 minutos.
- APIs del equipo bajo `/api/deliv_r/*` (contratos en `docs/API.md`).
- Capa `lib/deliv/` portada de la web (contraseñas, sesión, tokens, bloqueo, permisos) más las operaciones,
  la validación y optimización de la subida, el repositorio de Supabase y el de memoria para los tests.
- Migración `20261118120000_create_deliv_r.sql`: tres tablas, RLS, bucket privado `deliv-r`. No está aplicada.
- `app/robots.ts` (nuevo), `middleware.ts` y `docs/features/urls-workspace.md` actualizados.

## Lo que cambió respecto a la definición

- **La service role también está en `app/workspace/deliv_r/usuarios/page.tsx`.** Los datos de usuarios
  (activo, último acceso) solo se leen con ella. La galería y la ficha solo leen artefactos y accesos y usan
  la sesión del equipo. Cada página comprueba al equipo de forma explícita (`requireUser` e `isTeamEmail`)
  además del middleware, y un test vigila la lista de ficheros permitidos.
- **`deliv_usuarios` queda oculta al equipo con `revoke` a nivel de tabla y `grant` por columnas**, no con
  `revoke select (hash)`, que no basta si hay un `grant` de tabla. Con sesión de equipo, leer usuarios
  falla; toda ruta que los lee usa el repositorio de servicio tras comprobar al equipo.
- **`/publicar` exige reenviar `rutas`** (y `tipo` y `entrada` si es una versión nueva): no se guardan entre
  la subida y la publicación. La decisión (versión válida, archivos que faltan, avisos) es pura y vive en
  `decidirPublicacion`.
- **`/version` limpia el prefijo `v(N+1)` antes de crear las URL firmadas**: no hay upsert y un intento
  abandonado no debe colarse en la publicación.
- **La barra del visor muestra «Volver a la ficha» al equipo** en lugar de «Cerrar sesión», que no le
  corresponde (su sesión es la de Google).
- **Las subidas en `subiendo` salen en el listado** con la etiqueta «Subiendo» y una ficha reducida que solo
  permite «Borrar artefacto».
- **Los reintentos del modo nuevo reutilizan el borrador**: solo se vuelve a subir lo que falta, con los
  tokens vigentes; si hay que empezar de cero se borra antes el borrador abandonado.
- **El middleware refresca la sesión de Supabase del equipo en `/clientes`**, para que «Ver» desde la ficha
  funcione con una sesión persistida.
- **`app/robots.ts` es nuevo para todo el sitio**: `Allow: /` y `Disallow: /clientes`. No existía.
- **`publicar` guarda `tipo` y `entrada`** de la versión nueva, y `reactivar` solo vale para usuarios
  desactivados.
- **El enlace que devuelve la API es relativo** (`/clientes/...`): la interfaz antepone el origen al
  copiarlo o mostrarlo.

## Pendiente

**Requiere a Carlos (o acceso al proyecto de Supabase y a Netlify):**

- Poner `SUPABASE_SERVICE_ROLE_KEY` en Netlify. Sin ella `/clientes` responde «Servicio no disponible.».
- Aplicar la migración en el SQL Editor.
- Pasar las comprobaciones posteriores (nueve, en `.superpowers/sdd/2026-11-18-deliv-r/post-apply-checklist.md`):
  privilegios de las tablas, que la sesión de equipo no lea el hash, que anónimo no lea nada, que ninguna
  política de `storage.objects` dé `select` sin filtro de bucket, bucket no público, hook de alta limitado
  a `@interactius.com`, subida y borrado de Storage con sesión de equipo, y la service role.
- Confirmar el plan de Supabase y fijar el límite real por archivo del bucket (hoy sin `file_size_limit`; el
  límite de 100 MB es solo orientativo, sobre tamaños declarados).

**Preguntas para Alberto:**

- Los tamaños de 11, 12 y 24 px del prototipo no están en `lib/typeScale.ts`.
- El tamaño de la barra del visor (11 px, valor del prototipo).

**Menores aplazados que conviene seguir:**

- Las páginas del workspace repiten la agrupación en vez de usar `resumenEquipo`, `fichaArtefacto` y
  `fichaUsuarios` (consultas en serie por cliente).
- «Copiar enlace» no avisa si el portapapeles falla.
- La barra de progreso de la subida avanza por archivo completo: con un solo archivo salta de 0 a 100 %.
- Si publicar devuelve 404 o 410 con el borrador ya perdido, «Reintentar» se repite; la salida es elegir
  otro archivo.
- Dar acceso a un correo nuevo no es atómico y puede competir con otra petición en paralelo.
- Las referencias desde `.js` y `.json` no se reescriben al optimizar; `data:` con `image/jpg` o `avif` no
  se extrae; no hay tope de entradas en el ZIP.
- La guarda de la service role no detecta un re-export desde un módulo permitido ni `import()` con plantilla.
- Sin validar título vacío en `crearBorrador` desde fuera de la API.

**Verificación manual** (en el deploy preview, con navegador real; misma lista que en *Verificación*):

1. Subir un HTML, un PDF de unos 10 MB y un ZIP con un vídeo de unos 12 MB; el informe de peso cuadra.
2. Dos personas y dos artefactos cruzados: cada una ve solo el suyo.
3. Revocar con la sesión abierta: «No tienes acceso» en la siguiente carga.
4. Regenerar contraseña: la sesión abierta vuelve al login.
5. Cinco fallos: bloqueo; un correo inexistente responde igual de rápido.
6. El iframe no lee la cookie ni hace peticiones con sesión.
7. Una cuenta que no es `@interactius.com` no entra en `/workspace/deliv_r` ni en `/api/deliv_r/*`, tampoco en una ruta con correo (p. ej. `/api/deliv_r/usuarios/<email>/password` o `/api/deliv_r/artefactos/<id>/accesos/<email>`). **Requiere Carlos** (cuenta ajena al dominio).
8. Con la clave anónima no se lee `deliv_*` ni se lista `deliv-r`. **Requiere Carlos** (acceso a la base de datos).
9. La exportación HTML del entregable piloto funciona: carrusel, pestañas, descargas, imágenes optimizadas.
10. Un PDF se ve en Chrome, Safari y Firefox.
11. Móvil: login y visor sin desbordes.
12. Borrar un artefacto deja cero objetos en `deliv-r/<uuid>/`. **Requiere Carlos** (se contrasta en Storage).
13. Los 13 detalles del prototipo están en la implementación.

Antes de cualquiera: migración aplicada y `SUPABASE_SERVICE_ROLE_KEY` en Netlify.

## Contexto

Hasta ahora un entregable confidencial se mandaba como PDF adjunto o como enlace público. Ninguno de los
dos sirve: el adjunto circula sin control y el enlace público lo abre cualquiera que lo reciba.

Deliv_r nace de una pieza que ya existe: la **zona privada de clientes** que se construyó y probó en la web
(`platform-clonica/interactius-web`, `lib/clientes/`, `app/clientes/`, noviembre de 2026). Allí publicar
y dar acceso pasaba por Claude Code. Se trae a brand para que **el equipo sea autónomo**: sube, comparte
y revoca desde el workspace con su login de Google. Es la herramentalización de algo que ya funciona, no
un producto nuevo; el código de seguridad se porta, no se reinventa.

## Alcance

**Sí:**

- Galería por cliente: artefactos agrupados, buscador por título y cliente, contador de personas con acceso.
- Nuevo artefacto: cliente (con sugerencia de los existentes), título y un archivo `.html`, `.pdf` o `.zip`
  (con `index.html` en la raíz o en una única carpeta raíz). Hasta 100 MB por artefacto.
- Optimización de peso al subir: imágenes reescaladas a 2400 px como máximo y pasadas a WebP (calidad
  0,82) si pesan menos, imágenes incrustadas en el HTML (`data:`) extraídas y optimizadas, e informe de
  peso (archivo · original · final · total) con un aviso en Burdeos para cada archivo de más de 5 MB:
  - vídeo: «Si es solo audio, expórtalo como M4A o MP3. Si es vídeo, expórtalo a 720p.»
  - PDF: «Expórtalo con la opción de reducir tamaño. En Mac: Vista Previa › Exportar › Filtro Quartz ›
    Reducir tamaño de archivo.»
  - imagen que no se ha podido reducir: «Usa imágenes de 2400 px como máximo.»
- Ficha del artefacto: enlace con «Copiar enlace» y «Ver», dar acceso a una persona, tabla de accesos con
  revocar, sustituir el archivo (el enlace no cambia), borrar.
- Usuarios de cliente: a qué artefactos tiene acceso cada persona, último acceso, regenerar contraseña,
  desactivar y reactivar.
- Superficie pública `/clientes/<cliente>/<id>`: login de cliente y visor del artefacto.
- Un cliente tiene **varios artefactos**; una persona puede tener acceso a varios. El permiso es siempre
  por persona y artefacto, nunca «todo el cliente».

**No:**

- **Editor.** Deliv_r no edita el entregable: se crea en claude.ai y aquí solo se publica.
- **Duplicar.** Un entregable no se duplica; se sube otro.
- **Caducidad automática de accesos, correos automáticos al cliente, portada de cliente** con todos sus
  artefactos. Cada artefacto es un enlace independiente que el equipo envía a mano.
- **Recompresión de PDF y vídeo en el navegador.** Lento y poco fiable: se optimizan al crearlos.
- **Convertir lienzos de diseño desde su código interno.** Se usa la exportación HTML/PDF de claude.ai.

## Decisiones

| Decisión | Valor | Por qué |
|---|---|---|
| Nombre y ruta | Deliv_r · `/workspace/deliv_r` · ficha `/workspace/deliv_r/[id]` · `/workspace/deliv_r/nuevo` · `/workspace/deliv_r/usuarios` | Decidido por Martina. Como IMG_r, el sufijo `Mak_r` no encaja: la tool entrega, no fabrica |
| Entrada en el catálogo | id `delivr`, wordmark `{ before: 'Deliv', after: 'r' }`, descripción «Entregables para clientes», al final de `tools`, tarjeta encendida (`href`) | Nació apagada (`href: null`) y se encendió en el bloque 10, al cerrar la tool |
| Acento del icono | magenta `#EC4899`, compartido con IMG_r | Decisión de **Martina**, noviembre de 2026. Compartir acento está permitido (ReWrit_r y DSMak_r ya comparten el cian). Alcance: `AppIcon.tsx` |
| Acceso del equipo | sesión de equipo (`@interactius.com`), `noindex` | Lo da `middleware.ts` para todo `/workspace/*` |
| Superficie pública | `/clientes/<cliente>/<id>`, fuera de `/workspace` y de next-intl | Es la URL que se manda al cliente: no se mueve nunca |
| Acceso del cliente | usuario (su correo) y contraseña generada, propios de Deliv_r | Los clientes no pueden ser usuarios de Supabase Auth: el alta está limitada a `@interactius.com` |
| Fuente de verdad | tablas `deliv_*`; los ficheros en el bucket privado | No hay documento editable: la fila manda |
| Persistencia | `deliv_artefactos`, `deliv_usuarios`, `deliv_accesos` | Ver *Datos* |
| Ficheros subidos | bucket **privado** `deliv-r`, ruta `<uuid>/v<version>/<ruta>` (el `id` del artefacto, no el `public_id`) | Divergencia deliberada con `deck-assets`, que es público (ver *Divergencias*) |
| Clave de servidor | `SUPABASE_SERVICE_ROLE_KEY`, solo en `lib/deliv/servidor.ts`, `app/clientes/**`, las API de accesos y usuarios (`/api/deliv_r/artefactos/[id]/accesos`, `/api/deliv_r/usuarios/**`) y `app/workspace/deliv_r/usuarios/page.tsx` | El cliente no tiene sesión de Supabase y el hash no se lee con la del equipo; el resto del equipo usa su sesión. Un test vigila la lista |
| Idioma | castellano, sin next-intl | El workspace es interno y la superficie pública también va en castellano |
| Modelo de IA | no usa IA | |
| Estilos | CSS propio en `components/deliv/deliv.css` con las variables `--c-*` | La superficie pública no monta el studio |

## Datos

Migración `supabase/migrations/20261118120000_create_deliv_r.sql`. Aditiva: no toca ninguna tabla ni
bucket existente.

**`deliv_artefactos`**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | la URL estable de la ficha |
| `public_id` | text unique | 10 caracteres de `abcdefghijkmnpqrstuvwxyz23456789`; va en la URL del cliente |
| `cliente` | text | slug `^[a-z0-9]+(-[a-z0-9]+)*$`; reservados `login`, `logout`, `admin`, `archivos` |
| `cliente_nombre` | text | «Cliente Ejemplo», para mostrar |
| `titulo` | text | |
| `tipo` | text | `html` · `pdf` |
| `entrada` | text | ruta del archivo de entrada |
| `version` | int | sube al sustituir el archivo |
| `estado` | text | `subiendo` · `publicado` |
| `avisos` | text[] | p. ej. «usa funciones de Claude» |
| `creado_por` | text | correo del equipo |
| `publicado_en` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | trigger `set_updated_at` |

**`deliv_usuarios`**: `email` text PK (normalizado), `hash` text (scrypt; null = desactivado),
`creado_por`, `credenciales_en` timestamptz (las sesiones anteriores dejan de valer), `fallos` int,
`bloqueado_hasta` timestamptz, `created_at` / `updated_at`.

**`deliv_accesos`**: `artefacto_id` uuid → `deliv_artefactos(id)` on delete cascade, `email` text →
`deliv_usuarios(email)` on delete cascade, `concedido_por`, `concedido_en`, `ultimo_acceso`, PK
`(artefacto_id, email)`.

**RLS:**

```sql
-- anon: nada (ninguna política). El cliente nunca toca la base de datos directamente.
-- authenticated (= equipo, el alta está limitada al dominio): gestiona artefactos y accesos.
create policy deliv_artefactos_team on public.deliv_artefactos for all to authenticated using (true) with check (true);
create policy deliv_accesos_team    on public.deliv_accesos    for all to authenticated using (true) with check (true);
-- deliv_usuarios: el equipo lee y escribe por columnas; el hash NO se lee nunca desde el cliente.
revoke all on public.deliv_usuarios from authenticated;  -- más grant select/insert/update por columnas, sin hash
```

Las rutas del equipo usan `supabaseAuthServer()`, como el resto del workspace. Lo que necesita el hash
(crear usuario, regenerar, reactivar, login de cliente) pasa por `lib/deliv/servidor.ts`, el único módulo
con la `service role`, que empieza por `import 'server-only'`.

**Bucket `deliv-r`:** `public = false`. Políticas para `authenticated`: `insert`, `select` y `delete`
sobre `bucket_id = 'deliv-r'`, como en `20260915224000_storage_select_team.sql` (sin `select`, borrar no
borra). Ninguna para `anon`: al cliente se le sirve desde el servidor.

## Referentes y prototipo

**Referentes:** no se revisaron. Decisión de Martina: el mecanismo (enlace más usuario y contraseña) ya
estaba probado en la web.

**Prototipo:** `deliv-r-prototype.html`, hecho por Claude con Martina. Manda en la interacción; sus
detalles, uno a uno, están en la tabla de abajo y entran en los checks.

| # | Detalle del prototipo | Se implementa | Nota |
|---|---|---|---|
| 1 | Galería agrupada por cliente con contador «· N» y buscador | Sí | |
| 2 | Estado vacío de la galería con «Nuevo artefacto» | Sí | |
| 3 | Subida: elegir archivo → informe de peso → «Publicar» | Sí | |
| 4 | Informe de peso con original, final y consejo en Burdeos para > 5 MB | Sí | |
| 5 | Barra de progreso de la subida | Sí | |
| 6 | Aviso «usa funciones de Claude» con confirmación | Sí | |
| 7 | Ficha: enlace en caja + «Copiar enlace» (pasa a «Copiado» 1,5 s) + «Ver» | Sí | |
| 8 | Dar acceso: credenciales una sola vez con «Copiar datos» | Sí | |
| 9 | Revocar: la fila desaparece sin recargar | Sí | |
| 10 | Borrar: escribir el título para confirmar | Sí | |
| 11 | Usuarios: regenerar muestra la contraseña nueva una vez | Sí | |
| 12 | Reactivar: lista de lo que recupera y confirmación | Sí | |
| 13 | Cliente: login, visor con barra negra (isotipo · título · Cerrar sesión), «No tienes acceso» | Sí | |

## Interfaz

- **Galería** `/workspace/deliv_r` — cabecera de las galerías (`Wordmark`, `UserMenu`), buscador por
  título y cliente (desde el tercer carácter, como las demás), secciones por cliente; cada artefacto en una
  fila: título, tipo, fecha, personas con acceso. Estado vacío. Acciones: «Nuevo artefacto», «Usuarios».
- **Ficha** `/workspace/deliv_r/[id]` — no hay editor ni split: pantalla única con enlace, accesos,
  sustituir y borrar.
- **Superficie pública** `/clientes/<cliente>/<public_id>` — login de cliente; visor con barra negra de
  32 px (isotipo · título · correo · «Cerrar sesión»); HTML en iframe `sandbox`, PDF en iframe sin
  `sandbox` (Chrome bloquea su visor de PDF en un iframe aislado). La URL no se podrá mover: es la que
  recibe el cliente.
- **Diferencias deliberadas con DeckMak_r / FormMak_r / DSMak_r:** no hay editor ni autoguardado (no
  hay documento); hay una superficie pública con login propio.

## Guardado, concurrencia y ficheros

- **Autoguardado y debounce:** no aplica, no hay documento. Cada acción guarda de inmediato.
- **Dos pestañas:** las acciones son atómicas en la base de datos (dar y revocar son un `insert` y un
  `delete` de una fila). Quien llega segundo ve el resultado al refrescar; dar acceso dos veces a la misma
  persona no duplica ni cambia su contraseña.
- **Ficheros subidos:** bucket privado `deliv-r`, ruta `<uuid>/v<version>/`. La subida va del
  navegador a Storage con URLs firmadas que da el servidor tras comprobar al equipo. Sustituir sube la
  versión nueva, apunta la fila a ella y **después** borra la anterior. **Borrar elimina la fila, sus
  accesos y todos sus objetos**: cero huérfanos. Una subida a medias queda en `subiendo` y se puede borrar.
- **Duplicar:** no aplica.

## Ficheros

```
NUEVO
  lib/deliv/{ids,passwords,hmac,session,file-tokens,http,redirigir,tipos,repo,repo-memoria,
             auth,acceso,operaciones,subida,optimizar,config,servidor}.ts
  lib/deliv/__tests__/*.test.ts
  supabase/migrations/20261118120000_create_deliv_r.sql
  app/workspace/deliv_r/{page.tsx,nuevo/page.tsx,[id]/page.tsx,usuarios/page.tsx}
  app/api/deliv_r/**/route.ts
  app/clientes/{layout.tsx,not-found.tsx,[cliente]/[id]/page.tsx,login/route.ts,logout/route.ts,
                archivos/[id]/[token]/[...ruta]/route.ts}
  components/deliv/** y components/deliv/deliv.css
  deliv-r-prototype.html
MODIFICADO
  lib/workspace/catalog.ts            entrada delivr (tarjeta encendida con href)
  lib/workspace/__tests__/catalog.test.ts
  lib/tokens.ts                       toolIconAccents: delivr magenta, con nota
  middleware.ts                       /clientes fuera de i18n; /api/deliv_r en EDITOR_API
  app/robots.ts                       Disallow: /clientes
  docs/features/urls-workspace.md     rutas nuevas
  .env.example                        DELIV_SESSION_SECRET, SUPABASE_SERVICE_ROLE_KEY
  package.json                        lib/deliv/__tests__ en el glob de test
```

## Qué se reutiliza en vez de duplicar

- De la web (`lib/clientes/`): contraseñas, sesiones, tokens de archivo, bloqueo, `origenValido`,
  `destinoSeguro`, `rutaSegura`, redirección relativa, visor y login. Con sus tests.
- De brand: `lib/auth/team.ts` (`isTeamEmail`), `requireUser()` y `supabaseAuthServer()`,
  `components/studio/{Wordmark,UserMenu,LogoutButton,BrandMark}`, `Modal` y `ConfirmModal`,
  `fflate` para el ZIP.
- **Extraer a compartido:** el patrón de subida con URL firmada si DeckMak_r o IMG_r lo adoptan más
  adelante. No entra en el alcance.

## Marca

- **Copy:** sin `!`, `¡`, `…` ni `...` («Dando acceso», no «Dando acceso…»); sin el vocabulario prohibido
  por raíz de `forbiddenVocabularyDetailed`. Se pasa por `/api/eval` antes de cerrar.
- **Tipografía:** Plex Mono 400/500/600 y Plex Serif 300/400, tamaños de `lib/typeScale.ts`, sin cursiva.
- **CTA como enlace subrayado** con el `hover-wipe` de `lib/motion.ts` («Entrar», «Dar acceso», «Copiar
  enlace», «Ver», «Revocar», «Publicar»), no botones con relleno. Los campos de texto mantienen su caja.
- **Alertas y errores en Burdeos**, su `uiRole`.
- **Icono:** magenta de `toolIconAccents`, solo en `AppIcon.tsx`.
- Lo que hay **dentro** del artefacto es del cliente o del equipo que lo creó: no se audita contra
  `lib/tokens.ts`.

## Divergencias con las tools existentes

- **Bucket privado propio** en vez de `deck-assets`: los entregables son confidenciales y `deck-assets` es
  público por URL.
- **`service role` en el servidor:** ninguna otra tool la usa. Se acota a un módulo `server-only`, la
  superficie pública, las API de accesos y usuarios y la página de usuarios del workspace, y un test lo vigila.
- **Superficie pública con login propio:** el visor de decks es público sin login; aquí no puede serlo.

## Seguridad

- Sesión de cliente: cookie `__Host-deliv_clientes` (HttpOnly, Secure, SameSite=Lax, 7 días, HMAC con
  `DELIV_SESSION_SECRET`). En cada petición se comprueba firma, caducidad, usuario activo, sesión posterior
  a `credenciales_en` y fila en `deliv_accesos`: revocar y regenerar tienen efecto en la siguiente carga.
- El equipo puede abrir cualquier artefacto con su sesión de Google desde «Ver»; no cuenta como último acceso.
- Login de cliente: bloqueo de 15 min tras 5 fallos; el mismo coste si el correo no existe; mensajes
  «Usuario o contraseña incorrectos.» y «Demasiados intentos. Prueba de nuevo en unos minutos.».
- CSRF: `Origin` igual al host, o `Origin` nulo con `Sec-Fetch-Site: same-origin`. Redirecciones con
  `Location` relativa. `Referrer-Policy: same-origin` en `/clientes`.
- Archivos: token HMAC de 15 min en la ruta. HTML con `CSP: sandbox …; frame-ancestors 'self'`; PDF con
  `Content-Disposition: inline`, `nosniff` y `frame-ancestors 'self'`.
- Fail-closed: sin `DELIV_SESSION_SECRET` (≥ 32 caracteres) o sin `SUPABASE_SERVICE_ROLE_KEY`,
  `/clientes` responde «Servicio no disponible.» y no autentica a nadie.
- `noindex`, `Disallow: /clientes`, fuera del sitemap. Ningún archivo de cliente en el repo, que es público.
- **Rutas con correo y el middleware.** El `matcher` de `middleware.ts` salta las rutas con un punto, así que
  las que llevan un correo (`/api/deliv_r/usuarios/<email>/*`, `/api/deliv_r/artefactos/<id>/accesos/<email>`)
  no pasan por la puerta `EDITOR_API` del middleware. Cada handler comprueba al equipo por su cuenta
  (`equipoDeLaPeticion`). La comprobación manual 7 incluye una de esas rutas.
- **Tokens de archivo tras revocar.** Después de revocar, desactivar o regenerar, la página del visor
  deniega en la siguiente carga, pero los tokens de archivo ya emitidos siguen valiendo hasta 15 minutos.
- **«Demasiados intentos» solo sale para cuentas que existen.** Un correo inexistente responde siempre
  «Usuario o contraseña incorrectos.». Conocido y aceptado.

## Verificación

Automática: `npm run type-check`, `npm test`, `npm run lint`, `npm run eval:content`, `npm run build`.
Tests de `lib/deliv/__tests__/`: contraseñas, sesión, tokens, bloqueo, permisos, http, operaciones sobre
el repo en memoria, validación de subida (html, pdf, zip, rutas maliciosas, tamaño), extracción de
imágenes incrustadas, informe de peso, catálogo, y una guarda que falla si la `service role` aparece fuera
de los ficheros permitidos.

Manual, en el deploy preview con navegador real:

1. Subir un HTML, un PDF de unos 10 MB y un ZIP con un vídeo de unos 12 MB; el informe de peso cuadra.
2. Dos personas y dos artefactos cruzados: cada una ve solo el suyo.
3. Revocar con la sesión abierta: «No tienes acceso» en la siguiente carga.
4. Regenerar contraseña: la sesión abierta vuelve al login.
5. Cinco fallos: bloqueo; un correo inexistente responde igual de rápido.
6. El iframe no lee la cookie ni hace peticiones con sesión.
7. Una cuenta que no es `@interactius.com` no entra en `/workspace/deliv_r` ni en `/api/deliv_r/*`, tampoco en una ruta con correo (p. ej. `/api/deliv_r/usuarios/<email>/password` o `/api/deliv_r/artefactos/<id>/accesos/<email>`). **Requiere Carlos** (cuenta ajena al dominio).
8. Con la clave anónima no se lee `deliv_*` ni se lista `deliv-r`. **Requiere Carlos** (acceso a la base de datos).
9. La exportación HTML del entregable piloto funciona: carrusel, pestañas, descargas, imágenes optimizadas.
10. Un PDF se ve en Chrome, Safari y Firefox.
11. Móvil: login y visor sin desbordes.
12. Borrar un artefacto deja cero objetos en `deliv-r/<uuid>/`. **Requiere Carlos** (se contrasta en Storage).
13. Los 13 detalles del prototipo están en la implementación.

**No-regresión:** DeckMak_r y FormMak_r siguen guardando, publicando, compartiendo y exportando; el
visor público de decks y los formularios públicos siguen abiertos; el catálogo conserva su orden.

**Limpieza:** se borran los artefactos y usuarios de prueba; el informe dice qué queda.

## Entrega

- Rama `feat/deliv-r`; commits `feat(delivr): … (bloque N)` en castellano y sin acentos.
- **Netlify despliega `main` en cuanto llega el merge: no hay staging.** La verificación manual se hace en
  el deploy preview del PR, antes del merge.
- Antes del merge: migración aplicada (aditiva), `DELIV_SESSION_SECRET` (hecho) y
  `SUPABASE_SERVICE_ROLE_KEY` (pendiente, Carlos) en Netlify.
- La tarjeta del catálogo se enciende (`href`) en el PR que cierra la tool.
- Vuelta atrás: revertir el merge. La migración es aditiva; deshacerla es `drop` de las tres tablas y del
  bucket, y solo si no hay entregables reales.
- Después: republicar el entregable piloto desde su exportación HTML y crear los accesos de su cliente. Cuando
  funcione en producción, retirar la zona de la web (`/clientes` en `staging`, PR #133, Netlify Blobs y
  `CLIENTES_SESSION_SECRET`).

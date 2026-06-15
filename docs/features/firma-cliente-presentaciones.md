# Firma del cliente en el generador de presentaciones — opciones y recomendación

> Documento de **análisis de opciones** (no de implementación). El encargo fue: estudiar
> cómo permitir que el cliente que recibe una presentación pueda **firmarla directamente**,
> y comparar enfoques antes de decidir. No se programa nada todavía.

## Contexto

El generador de decks (`/[locale]/presentaciones`) ya incluye una página de **aceptación de presupuesto** ([Acceptance.tsx](../../components/deck/layouts/Acceptance.tsx)), pero hoy es **estática**: muestra la firma de Interactius (`/presentaciones/sign.png`) y tres líneas en blanco pensadas para firmar **en papel**. El objetivo es que el cliente firme **digitalmente, en la propia presentación**, y que Interactius reciba **aviso automático** de la firma.

### Restricción arquitectónica que lo condiciona todo

El subsistema de decks es **100% cliente, sin backend ni persistencia**:

- La presentación viaja **entera codificada en la URL** (`#view=1&md=<base64url>`); no hay base de datos ni API de escritura (ver [ARQUITECTURA.md](../ARQUITECTURA.md) y `app/api/*`, todas de solo lectura).
- Editor vs cliente se distinguen con `ViewerContext` ([viewer.ts](../../components/deck/viewer.ts)); `ImageSlot` ([ImageSlot.tsx](../../components/deck/ImageSlot.tsx)) ya es el patrón de "elemento editable solo en modo cliente" — el *pad* de firma se modela igual.

**Capturar la firma es lo fácil** (un `<canvas>` con eventos de puntero). **Lo determinante es la persistencia y la entrega**: una firma solo sirve si queda constancia y si Interactius la recibe. Eso obliga a salir del modelo sin backend. Decisiones del usuario: planificar **las tres opciones de validez**, con **aviso automático** y **backend ligero propio** (aceptado).

### Infraestructura disponible

Organización **Interactius** ya existe en Supabase (proyecto previo activo en **eu-central-2**, UE). Se puede crear un proyecto/tabla dedicado sin montar infraestructura nueva. Las Route Handlers de Next se despliegan como funciones serverless en Netlify (`@netlify/plugin-nextjs`), así que el backend "ligero" no cambia el modelo de deploy.

---

## Las tres opciones de validez

Las tres comparten la **misma captura de firma** en `Acceptance.tsx`. Se diferencian en qué garantía dan y cuánta infraestructura piden. Como el usuario pidió **aviso automático**, incluso la opción 1 necesita un mínimo de backend.

### Opción 1 — Gesto de conformidad (MVP)
- El cliente dibuja su firma (canvas) + nombre, pulsa **Firmar**.
- Se genera el **PDF firmado** en el navegador y, vía una única función serverless, se **envía por email a Interactius** (con la firma incrustada). Registro mínimo o nulo.
- **Da:** confirmación visual y aviso inmediato. **No da:** identidad verificada, sello de tiempo fiable, ni prueba de integridad del documento.
- **Coste/infra:** una Route Handler + servicio de email. Sin BD si no se quiere histórico.

### Opción 2 — Prueba con registro  ⭐ recomendada como base
- Igual que la 1, pero la presentación se **guarda en servidor con un ID inmutable** y la firma se persiste: `firma + nombre + email + fecha/hora + IP + user-agent`, ligada a esa versión exacta del deck.
- Aviso automático a Interactius (email/notificación) **y** las firmas quedan consultables en un panel interno simple.
- **Da:** constancia robusta, trazabilidad y vínculo firma↔documento. Validez "informal pero defendible". **No da:** validez legal cualificada eIDAS.
- **Coste/infra:** Supabase (2 tablas) + 2 Route Handlers + email. Bajo.

### Opción 3 — Firma legal vinculante (eIDAS)
- La acción **Firmar** enruta el PDF de la propuesta a un **proveedor de firma electrónica** que gestiona identidad, sello de tiempo cualificado y pista de auditoría, devolviendo un PDF legalmente vinculante.
- Proveedores UE/España recomendados: **Signaturit** (Barcelona, eIDAS), **Yousign** (FR), **VIDsigner**. Encaja con la sede de Interactius (Barcelona) y la región Supabase UE.
- **Da:** aceptación de presupuesto con valor contractual real. **Cuesta:** dependencia externa, precio por firma/suscripción y datos compartidos con el proveedor.
- **Coste/infra:** lo de la Opción 2 (para gestionar estado y webhooks) + cuenta y SDK del proveedor.

| | Op. 1 Gesto | Op. 2 Registro ⭐ | Op. 3 eIDAS |
|---|---|---|---|
| Captura de firma (canvas) | ✓ | ✓ | ✓ |
| Aviso automático a Interactius | ✓ | ✓ | ✓ |
| Documento guardado e inmutable | — | ✓ | ✓ |
| Sello de tiempo + IP / auditoría | — | ✓ | ✓ (cualificado) |
| Identidad verificada | — | — | ✓ |
| Validez legal vinculante | — | parcial | ✓ |
| Infra propia | mínima | baja (Supabase) | media + proveedor |
| Coste recurrente | ~0 | ~0 | por firma |

---

## Recomendación

**Construir una base común y entregar la Opción 2**, dejando la 1 como su subconjunto MVP y la 3 como ampliación enchufable cuando una propuesta concreta requiera firma legal.

Razonamiento: la página se titula "Aprobación del presupuesto" → la firma tiene intención comercial, así que el "gesto" puro (Op. 1) se queda corto para dar tranquilidad; pero exigir eIDAS (Op. 3) en cada propuesta añade coste y fricción innecesarios para la mayoría de casos. La Opción 2 es el punto dulce y su base es exactamente la que necesitaría la Opción 3 después.

### Cambio arquitectónico imprescindible
Para que una firma signifique "el cliente aceptó **esta** propuesta", el deck debe dejar de vivir solo en la URL: hay que **persistir la versión firmada** con un ID. El enlace de compartición pasa de `#view=1&md=<base64>` a algo como `/presentaciones/v/<id>` que carga el deck guardado (el flujo base64 actual puede quedarse para previsualización rápida sin firma).

### Piezas de la base (Opción 2)
- **Supabase** (proyecto/tabla en la org Interactius, UE):
  - `proposals` (`id`, `title`, `client`, `md` o hash del contenido, `created_at`).
  - `signatures` (`id`, `proposal_id`, `signer_name`, `signer_email`, `signature_png`, `signed_at`, `ip`, `user_agent`).
- **Route Handlers** (Netlify functions vía `@netlify/plugin-nextjs`):
  - `POST /api/proposals` — el editor publica el deck → devuelve enlace con `id`. Usar `app/api/eval/route.ts` como referencia de estructura.
  - `POST /api/sign` — el cliente envía la firma → persiste + dispara email.
- **Email de aviso** a Interactius (Resend/Postmark o Supabase Edge Function) con el PDF firmado adjunto.
- **Captura en `Acceptance.tsx`**: canvas de firma + campos nombre/email, visibles **solo en modo viewer** (replicando el patrón `useContext(ViewerContext)` de `ImageSlot.tsx`). Botón **Firmar** → `POST /api/sign`. Extender el tipo `acceptance` en [types.ts](../../lib/deck/types.ts) si se necesita parametrizar.
- **PDF firmado**: reutilizar el flujo de impresión existente (`window.print()` de [DeckStudio.tsx](../../components/deck/DeckStudio.tsx)) o generar el PDF en el servidor para adjuntarlo al email.
- **Panel interno** mínimo (lista de firmas) protegido, fuera del routing i18n (como `/api/*`).

### Camino a la Opción 3 (cuando haga falta)
Sustituir/duplicar la acción **Firmar** por "Enviar a firma electrónica": la base ya guarda la propuesta y su estado; solo se añade el SDK del proveedor y un endpoint de **webhook** para recibir el documento firmado y actualizar el estado.

---

## Decisiones abiertas antes de implementar
- Proveedor de email para el aviso automático (Resend / Postmark / Supabase).
- Si la Opción 2 necesita ya el panel interno o basta con el email en una primera fase.
- Para la Opción 3 eventual: proveedor de firma (Signaturit como favorito por sede/UE).
- Identidad del firmante de Interactius en `Acceptance.tsx`: ¿sigue fija (Carlos Ruiz) o se parametriza?

## Verificación (cuando se implemente)
1. Publicar un deck desde el editor → obtener enlace `/presentaciones/v/<id>` y abrirlo como cliente.
2. Firmar en la página de aceptación (canvas + nombre/email) y enviar.
3. Comprobar fila en Supabase (`signatures`) con sello de tiempo e IP, y vínculo a `proposals`.
4. Confirmar que Interactius recibe el email de aviso con el PDF firmado.
5. Reabrir el enlace y verificar que la propuesta firmada es inmutable.

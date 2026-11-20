# Referencia de API

> Endpoints públicos del manual de marca. Todos viven bajo el dominio de producción
> `https://brand.interactius.com` y en local bajo `http://localhost:3000`.
> Los públicos no requieren autenticación; las de Deliv_r, al final, sí.

Estas rutas quedan **fuera** del routing de idioma (ver [middleware.ts](../middleware.ts)): se sirven sin prefijo de locale.

| Endpoint | Método | Tipo | Caché | Fuente |
|----------|--------|------|-------|--------|
| `/api/brand.json` | GET | `application/json` | `max-age=300, s-maxage=300` | [route](../app/api/brand.json/route.ts) |
| `/llms.txt` | GET | `text/plain` | `max-age=300, s-maxage=300` | [route](../app/llms.txt/route.ts) |
| `/api/eval` | GET, POST | `application/json` | `no-store` | [route](../app/api/eval/route.ts) |
| `/api/eval/manual` | GET | `application/json` | `no-store` | [route](../app/api/eval/manual/route.ts) |

---

## `GET /api/brand.json`

Devuelve **todos los tokens de marca** en JSON tipado. Es la representación legible por máquina de [lib/tokens.ts](../lib/tokens.ts) y módulos asociados. Pensado para sistemas de diseño externos, validadores y RAG.

Estructura (claves principales):

```jsonc
{
  "brand":      { "name", "wordmark", "tagline", "version", "versionDate", "concept", "visualUniverse" },
  "voice":      { "principle", "sentenceLength", "axes", "forbiddenVocabulary", "substitutionMatrix", "punctuation" },
  "colors":     { "base": [ { "name", "hex", "rgb", "cmyk" } ], "accent": [ { …, "service" } ], "rules" },
  "typography": { "brand", "contrast" },
  "typeScale":  [ { "className", "family", "weights", "clamp", "lineHeight", "usage" } ],
  "motion":     { "easings": [ { "name", "cssCubic", "usage" } ], "durations", "heroReferenceUrl" },
  "graphics":   { "serviceShapes": [ { "id", "colorName", "fillColor", "assetUrl", "usage" } ] },
  "logo":       { "minSize", "clearSpace", "assets" },
  "prompts":    { "master": { "es", "en", "ca" }, "tone": { "es", "en", "ca" } },
  "examples":   { "approved": [ … ], "rejected": [ … ] },
  "sections":   [ { "id", "num", "label", "url" } ],
  "documents":  { "pdf", "llms" }
}
```

Los campos de texto que dependen del idioma se entregan como objetos `{ es, en, ca }`.

```bash
curl -s https://brand.interactius.com/api/brand.json | jq '.brand'
```

---

## `GET /llms.txt`

Devuelve el **manual completo en Markdown plano**, generado por `buildLlmsMarkdown()` ([lib/llms.ts](../lib/llms.ts)). Es la vía recomendada para que un LLM ingiera la marca (NotebookLM, Claude Projects, GPTs).

Contiene, en orden: prompt de sistema (plegado), concepto, tono de marca (principio, ejes, vocabulario prohibido, matriz de sustitución, puntuación), tipografía, sistema de texto (escala con tokens), paleta cromática (RGB+CMYK), logo, reglas Do/Don't, universo visual, sistema gráfico, aplicaciones, movimiento, índice de secciones, ejemplos few-shot (aprobados + rechazados) y recursos (PDF, JSON).

```bash
curl -s https://brand.interactius.com/llms.txt | head -40
```

---

## `POST /api/eval`

Valida un texto contra las reglas de tono de marca y devuelve una puntuación. Motor: `evalText()` en [lib/eval.ts](../lib/eval.ts).

### Petición

```jsonc
{
  "text": "string (requerido)",
  "type": "string (opcional: copy | headline | lead)"
}
```

### Respuesta

```jsonc
{
  "score": 0,            // 0..100 → 100 − 10 por violación, suelo en 0
  "violations": [ … ],   // ver tabla de reglas
  "sentenceCount": 0,
  "wordCount": 0,
  "hardFail": false      // true si hay vocabulario o puntuación prohibidos
}
```

### Reglas

| `rule` | Condición | Severidad |
|--------|-----------|-----------|
| `forbidden` | El texto contiene un término de la lista roja (familia ES+EN) | **hard fail** |
| `punctuation:exclamation` | Uso de `!` o `¡` | **hard fail** |
| `punctuation:ellipsis` | Uso de `…` o `...` | **hard fail** |
| `length:under_min` | Frase con menos de 15 palabras | soft (estilo) |
| `length:over_max` | Frase con más de 22 palabras | soft (estilo) |

### Ejemplo

```bash
curl -s -X POST https://brand.interactius.com/api/eval \
  -H 'content-type: application/json' \
  -d '{"text":"Diseñamos soluciones innovadoras para empresas líderes."}'
```

```jsonc
{
  "score": 70,
  "hardFail": true,
  "violations": [ { "rule": "forbidden", "match": "soluciones", "root": "soluci" } ],
  "sentenceCount": 1,
  "wordCount": 6
}
```

`GET /api/eval` (sin cuerpo) devuelve esta misma documentación en JSON.

---

## `GET /api/eval/manual`

Audita **todos los strings de i18n** (`messages/es|en|ca.json`) contra las reglas de tono y devuelve un informe agregado. Útil para detectar deriva de voz en el propio contenido del sitio.

```jsonc
{
  "summary": {
    "totalHardFail": 0,
    "totalEntriesWithViolations": 0,
    "rulesApplied": { … },
    "excludedPathsCount": 0
  },
  "es": { "locale", "totalStrings", "evaluatedStrings", "entriesWithViolations", "violations": [ … ] },
  "en": { … },
  "ca": { … }
}
```

Exclusiones: las claves de chrome/UI (`menu.*`, `chrome.*`, `ui.*`), las que citan legítimamente vocabulario prohibido (la propia lista roja, reglas de puntuación) y las especificaciones técnicas quedan fuera de la evaluación. Las frases de menos de 6 palabras (labels, eyebrows) se saltan la regla de longitud.

```bash
curl -s http://localhost:3000/api/eval/manual | jq '.summary'
```

---

## `/api/deliv_r/*` (Deliv_r)

APIs internas de la tool Deliv_r. **Sí requieren autenticación**: sesión de Google del equipo (`@interactius.com`),
y `Origin` igual al host (o `Origin` nulo con `Sec-Fetch-Site: same-origin`). Todas son `no-store`, JSON y
quedan fuera del routing de idioma. Fuente: [app/api/deliv_r](../app/api/deliv_r).

Errores comunes: `403 { ok: false, mensaje: "Origen no permitido." }`, `401 { ok: false, mensaje: "No autenticado." }`,
`400 { ok: false, mensaje }` para datos no válidos y `503 { ok: false, mensaje }` si falta una clave o falla el
servicio. Los enlaces que devuelven son relativos (`/clientes/<cliente>/<id>`).

| Endpoint | Método | Para qué |
|----------|--------|----------|
| `/api/deliv_r/artefactos` | POST | Crea el borrador y da las URL de subida |
| `/api/deliv_r/artefactos/:id` | PATCH | Cambia el título |
| `/api/deliv_r/artefactos/:id` | DELETE | Borra ficha, accesos y archivos |
| `/api/deliv_r/artefactos/:id/portada` | POST | Guarda la portada (JPEG) de la versión actual |
| `/api/deliv_r/artefactos/:id/version` | POST | URL de subida para la versión siguiente |
| `/api/deliv_r/artefactos/:id/publicar` | POST | Publica la versión subida |
| `/api/deliv_r/artefactos/:id/accesos` | POST | Da acceso a una persona (la crea si no existe) |
| `/api/deliv_r/artefactos/:id/accesos/:email` | DELETE | Revoca un acceso |
| `/api/deliv_r/usuarios/:email/password` | POST | Regenera la contraseña |
| `/api/deliv_r/usuarios/:email/desactivar` | POST | Desactiva a la persona |
| `/api/deliv_r/usuarios/:email/reactivar` | POST | Vista previa y reactivación |

### `POST /api/deliv_r/artefactos`

```jsonc
// Petición
{ "clienteNombre": "Cliente Ejemplo", "cliente": "cliente-ejemplo" /* opcional, slug */, "titulo": "Informe",
  "tipo": "html" /* o "pdf" */, "entrada": "index.html",
  "rutas": ["index.html", "img/a.webp"], "tamanos": [1200, 3400] /* bytes, mismo orden */ }
// Respuesta
{ "id": "<uuid>", "version": 1, "subidas": [ /* una URL firmada por ruta, para subir directo al bucket */ ] }
```

`entrada` debe estar en `rutas`; el total declarado no puede pasar de 100 MB.

### `PATCH /api/deliv_r/artefactos/:id`

Petición `{ titulo }`. Respuesta `{ titulo }`, ya recortado. Solo actualiza la columna `titulo`: no toca el
enlace, la versión ni los accesos. Título vacío → «El título no puede quedar vacío.»; artefacto inexistente →
«El artefacto no existe.».

### `POST /api/deliv_r/artefactos/:id/portada?version=N`

Cuerpo: el JPEG en bruto (`Content-Type: image/jpeg`, 2 MB como máximo, cabecera `FF D8 FF`). Lo genera
la galería en el navegador del equipo (`lib/deliv/portada.ts`). Se guarda en
`deliv-r/<uuid>/portadas/v<N>.jpg` y se borran las de versiones anteriores. Rechaza si el artefacto no
está publicado o si `N` ya no es su versión. Respuesta `{ ok: true }`.

### `POST /api/deliv_r/artefactos/:id/version`

Petición `{ tipo, entrada, rutas, tamanos }`. Respuesta `{ id, version, subidas }` con `version` = la actual + 1.
No guarda nada: la ficha cambia al publicar. Falla si la ficha actual no está publicada («Publica primero la
versión actual.»). Borra antes lo que hubiera en el prefijo de esa versión.

### `POST /api/deliv_r/artefactos/:id/publicar`

Petición `{ "version": 1, "rutas": [...], "aceptarAvisos"?: true, "tipo"?, "entrada"? }`. Las rutas se repiten
siempre; `tipo` y `entrada` solo en una versión nueva.

| Caso | Respuesta |
|------|-----------|
| Faltan archivos por subir | `409 { ok: false, faltan: ["ruta", ...] }` |
| Hay avisos sin aceptar | `200 { publicado: false, avisos: [...] }`; se repite con `aceptarAvisos: true` |
| Publicado | `200 { publicado: true, enlace }`; en un reemplazo se borra la versión anterior |

### `POST /api/deliv_r/artefactos/:id/accesos`

Petición `{ "email": "persona@cliente.test" }`. Respuesta
`{ ok: true, email, nuevo, password, enlace, titulo }`. `password` solo viene si la persona es nueva (`null`
en otro caso) y no se puede volver a ver. Dar acceso dos veces no cambia nada. Falla si el artefacto no está
publicado o la persona está desactivada.

### `DELETE /api/deliv_r/artefactos/:id/accesos/:email`

Respuesta `{ ok: true, revocado: boolean }`. El correo va codificado en la URL.

### `DELETE /api/deliv_r/artefactos/:id`

Respuesta `{ ok: true }`.

### `POST /api/deliv_r/usuarios/:email/password`

Respuesta `{ password }`, visible una sola vez. Las sesiones abiertas de esa persona dejan de valer.

### `POST /api/deliv_r/usuarios/:email/desactivar`

Respuesta `{ ok: true }`. Conserva sus accesos; sin contraseña no entra.

### `POST /api/deliv_r/usuarios/:email/reactivar`

Sin cuerpo, o sin `confirmar: true`: `{ recupera: [{ id, titulo }] }` con lo que volvería a ver. Con
`{ "confirmar": true }`: `{ password }`, visible una sola vez. Solo vale para usuarios desactivados.

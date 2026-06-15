# Referencia de API

> Endpoints públicos del manual de marca. Todos viven bajo el dominio de producción
> `https://brand.interactius.com` y en local bajo `http://localhost:3000`.
> No requieren autenticación.

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

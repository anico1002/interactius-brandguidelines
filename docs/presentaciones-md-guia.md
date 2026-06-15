# Guía del `.md` — Generador de presentaciones

Reglas completas para escribir el contenido de un deck en el editor de
`brand.interactius.com/presentaciones`. El generador es **determinista**: no
hay IA en runtime, todo sale de estas reglas. Pulsa **Generar** para recompilar.

---

## 1. Estructura general

- **Separar diapositivas**: una línea con `---` (tres guiones o más) sola, con
  una línea en blanco antes y después.
- Cada bloque entre separadores se convierte en **una** diapositiva.
- El tipo de diapositiva se **deduce** del contenido (ver §4). No se declara a mano.

```markdown
# Primera diapositiva

---

## Segunda diapositiva
```

---

## 2. Elementos de línea (sintaxis markdown reconocida)

| Escribes | Se interpreta como |
|---|---|
| `# … ######` | Encabezado (el número de `#` marca el nivel) |
| `TEXTO EN MAYÚSCULAS` | Antetítulo (*eyebrow*) — máx. 48 car., sin `.` `;` `:` |
| `- texto` o `* texto` | Ítem de lista |
| `> texto` | Cita |
| `> cliente: Nombre` | Asigna el cliente (sale en la portada) |
| `![alt](/ruta.jpg)` | Imagen (en su propia línea; ruta desde `/public`) |
| Bloque cercado ```` ```gantt ```` … ```` ``` ```` | Datos del diagrama de Gantt |
| Cualquier otra línea | Párrafo |

**Negrita**: envuelve el texto en `**dobles asteriscos**`. Funciona en el cuerpo
(párrafos, viñetas, objetivos, columnas, fases del roadmap, condiciones del
presupuesto). **No** se aplica en los títulos grandes (tipografía display).

---

## 3. Temas (claro / oscuro)

- Por defecto: **oscuro** en portada, *statement* y cierre; **claro** en el resto.
- Forzar tema añadiendo al final del **encabezado**: `{oscuro}` / `{dark}` /
  `{claro}` / `{light}`.

```markdown
## Nuestra mirada {oscuro}
```

---

## 4. Tipos de diapositiva (orden de prioridad)

El generador prueba estas reglas **en orden** y se queda con la primera que encaja:

1. **Gantt** — un bloque cercado de tipo `gantt` (ver §5). Gana aunque el título sea «Roadmap».
2. **Secciones por palabra clave**:
   - Antetítulo `CONTEXTO` → bloque de texto serif (versión larga si ≥150 car.).
   - Antetítulo `EL RETO` → imagen + título serif.
   - Encabezado `Objetivos` → lista numerada + imagen.
   - Encabezado `Roadmap` → columnas de fases (cada `###` es una fase, ver §6).
   - Encabezado `Presupuesto` → tabla de presupuesto (ver §7).
3. **Portada** — primera diapositiva con `#` (H1) y subtítulo, cliente o imagen.
4. **Cierre** — última diapositiva titulada «Gracias» o con una línea de URL.
5. **Statement** — antetítulo en mayúsculas + encabezado, sin nada más.
6. **Columnas** — encabezado + 2 o más subencabezados `###`.
7. **Viñetas** — encabezado + lista.
8. **Split** — encabezado + imagen + párrafo.
9. **Párrafo** — cualquier otra cosa (caso por defecto).

> Las palabras clave (`CONTEXTO`, `EL RETO`, `Objetivos`, `Roadmap`,
> `Presupuesto`) son sensibles al texto pero **no** a mayúsculas/minúsculas.
> `CONTEXTO` y `EL RETO` van como antetítulo (línea en mayúsculas);
> `Objetivos`, `Roadmap` y `Presupuesto` van como encabezado (`##`).

---

## 5. Diagrama de Gantt

````markdown
## Roadmap
```gantt
semanas: 8
Diagnóstico: 1
Discovery: 2-3
Volumetría: 4-8
hitos cliente: 1, 3, 5, 8
```
````

- `semanas: N` → nº de columnas (por defecto 8).
- `Etiqueta: N` → barra de una semana en la semana N. `Etiqueta: inicio-fin` → barra de rango.
- **Medias semanas**: usa `.5` en cualquier extremo del rango; la barra dibuja
  media celda.
  - `Discovery: 2-3.5` → semanas 2 y 3 + la primera mitad de la 4.
  - `Cierre: 4-4.5` → solo la primera mitad de la semana 4.
  - `Kick Off: 0.5` → media semana al inicio (un valor suelto con decimal).
- `hitos …: a, b, c` → semanas con hito.
- Los colores de las barras rotan automáticamente (opal · burdeos · esmeralda).

---

## 6. Roadmap por fases

```markdown
## Roadmap
Estimamos que la duración del proyecto será de 6 semanas.
### Diagnóstico
Texto introductorio de la fase.
- Tarea 1
- Tarea 2
### Discovery
...
```

- El primer párrafo tras `## Roadmap` es el subtítulo.
- Cada `###` abre una fase: su texto = primer párrafo; sus viñetas = «¿Qué hacemos?».
- Las fases se numeran solas (Fase 01, Fase 02…).

---

## 7. Presupuesto

```markdown
## Presupuesto
- Análisis Heurístico: 3.315 €
- Benchmark Android/Mobile: 3.770 €
- Inmersión + gestión: 3.991 €
### Condiciones
- Pago a 30 días.
- IVA aparte.
```

- Cada viñeta es `Partida: importe`. Separadores válidos: `:` `—` `–` `|`.
- **Total**: se **suma solo** a partir de las partidas. Para fijarlo a mano,
  añade `- Total: 12.000 €` y ese valor manda.
- Formato es-ES: miles con `.`, decimales con `,` (`1.200,50 €`).
- **Condiciones**: opcionales bajo `### Condiciones`. Si no las pones, salen las
  condiciones de pago estándar de Interactius.
- Si dejas `## Presupuesto` vacío, se muestra el ejemplo de referencia (p.42).

---

## 8. Páginas automáticas (solo tipo «Comercial»)

Con el deck en modo **Comercial** se insertan solas y **no** se escriben en el `.md`:

- Tras la portada: **Manifiesto**, **Equipo**, **Clientes**.
- Tras cada **Presupuesto**: **Aprobación del presupuesto** (firma).

---

## 9. Atajos del editor

- **Generar** — recompila el deck con el `.md` actual.
- **Descargar PDF** — imprime/guarda el deck (print-CSS).
- **Copiar URL** — copia un enlace con el deck embebido (vista cliente, sin chrome interno).

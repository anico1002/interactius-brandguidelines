import type { CSSProperties } from 'react';

/* Schematic 16:9 thumbnail for a layout: placeholder blocks that show the STRUCTURE
   (where the title/image/columns go), never real content. Pure SVG, UI-Kit tones. */

const C = {
  bg: '#F5F2ED',
  dark: '#1C1A17',
  img: '#D8D2C8',   // image placeholder
  bar: '#B9B2A6',   // solid block / heading
  line: '#CDC6BB',  // text line
  lite: 'rgba(245,242,237,.75)', // lines on dark ground
  opal: '#B0B5B0', bordeaux: '#99335F', emerald: '#5999A6',
};

const DARK = new Set(['portada', 'enunciado', 'cierre']);

// rect helper
function R(x: number, y: number, w: number, h: number, fill: string, rx = 1) {
  return <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} />;
}

function schema(marker: string, ln: string) {
  switch (marker) {
    case 'portada':
      return <>{R(0, 0, 160, 90, C.img, 0)}{R(12, 12, 14, 14, C.lite)}{R(12, 60, 96, 7, C.lite)}{R(12, 71, 64, 7, C.lite)}</>;
    case 'cierre':
      return <>{R(66, 30, 28, 12, C.lite)}{R(56, 52, 48, 5, C.lite)}</>;
    case 'enunciado':
      return <>{R(58, 24, 28, 4, ln)}{R(28, 38, 104, 9, ln)}{R(40, 52, 80, 9, ln)}</>;
    case 'texto':
      return <>{R(16, 20, 22, 4, ln)}{R(16, 34, 128, 6, ln)}{R(16, 46, 128, 6, ln)}{R(16, 58, 96, 6, ln)}</>;
    case 'contexto':
      return <>{R(16, 26, 130, 8, ln)}{R(16, 40, 130, 8, ln)}{R(16, 54, 100, 8, ln)}</>;
    case 'lista':
      return <>{R(16, 16, 60, 7, C.bar)}
        {[34, 48, 62].map((y) => <g key={y}>{R(16, y, 5, 5, C.bar)}{R(26, y + 1, 110, 4, ln)}</g>)}</>;
    case 'columnas':
      return <>{R(16, 14, 60, 7, C.bar)}
        {[16, 60, 104].map((x) => <g key={x}>{R(x, 30, 40, 46, C.bg)}<rect x={x} y={30} width={40} height={46} fill="none" stroke={C.line} />{R(x + 5, 36, 14, 5, C.bar)}{R(x + 5, 48, 30, 4, ln)}{R(x + 5, 56, 30, 4, ln)}</g>)}</>;
    case 'split-izq':
      return <>{R(0, 0, 72, 90, C.img, 0)}{R(86, 26, 20, 4, ln)}{R(86, 36, 60, 8, ln)}{R(86, 52, 58, 5, ln)}{R(86, 61, 50, 5, ln)}</>;
    case 'split-der':
      return <>{R(88, 0, 72, 90, C.img, 0)}{R(16, 26, 20, 4, ln)}{R(16, 36, 60, 8, ln)}{R(16, 52, 58, 5, ln)}{R(16, 61, 50, 5, ln)}</>;
    case 'reto':
      return <>{R(0, 0, 70, 90, C.img, 0)}{R(86, 24, 18, 4, ln)}{R(86, 36, 62, 9, ln)}{R(86, 50, 48, 9, ln)}</>;
    case 'objetivos':
      return <>{R(16, 16, 50, 7, C.bar)}
        {[32, 44, 56, 68].map((y, i) => <g key={y}>{R(16, y, 5, 5, C.bar)}{R(26, y + 1, 62, 4, ln)}</g>)}
        {R(100, 28, 46, 50, C.img)}</>;
    case 'roadmap':
      return <>{R(16, 14, 54, 7, C.bar)}
        {[16, 52, 88, 124].map((x) => <g key={x}>{R(x, 30, 12, 5, C.bar)}{R(x, 40, 30, 4, ln)}{R(x, 48, 26, 4, ln)}{R(x, 60, 24, 4, ln)}</g>)}</>;
    case 'gantt':
      return <>{R(16, 14, 40, 7, C.bar)}
        {[30, 44, 58].map((y, i) => <g key={y}>{R(16, y, 26, 5, C.line)}{R(46 + i * 18, y, 36 - i * 4, 6, [C.opal, C.bordeaux, C.emerald][i])}</g>)}
        {[60, 96, 132].map((x) => <rect key={x} x={x} y={72} width={4} height={4} transform={`rotate(45 ${x + 2} 74)`} fill={C.dark} />)}</>;
    case 'presupuesto':
      return <>{R(16, 14, 50, 7, C.bar)}
        {[30, 42, 54].map((y) => <g key={y}>{R(16, y, 70, 4, ln)}{R(120, y, 26, 4, ln)}</g>)}
        {R(16, 70, 30, 5, C.bar)}{R(120, 70, 26, 5, C.bar)}</>;
    case 'manifiesto':
      return <>{R(30, 30, 100, 9, ln)}{R(44, 44, 72, 9, ln)}{R(58, 60, 44, 5, ln)}</>;
    case 'equipo':
      return <>{R(14, 24, 66, 5, ln)}{R(14, 34, 66, 5, ln)}{R(14, 44, 54, 5, ln)}{R(14, 54, 60, 5, ln)}
        {[0, 1].flatMap((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={96 + c * 26} y={26 + r * 26} width={22} height={22} rx={1} fill={C.img} />))}</>;
    case 'clientes':
      return <>{[0, 1].flatMap((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={24 + c * 40} y={26 + r * 26} width={32} height={18} rx={1} fill={C.img} />))}</>;
    case 'aceptacion':
      return <>{R(16, 16, 70, 7, C.bar)}{R(96, 34, 48, 18, C.img)}{R(96, 58, 48, 4, ln)}{R(96, 66, 36, 4, ln)}{R(16, 70, 60, 4, ln)}</>;
    default:
      return <>{R(16, 24, 128, 6, ln)}{R(16, 40, 128, 6, ln)}{R(16, 56, 90, 6, ln)}</>;
  }
}

export function LayoutThumb({ marker, width = 120 }: { marker: string; width?: number }) {
  const dark = DARK.has(marker);
  const ln = dark ? C.lite : C.line;
  const style: CSSProperties = { display: 'block', width, height: (width * 90) / 160, border: '1px solid #E0DAD2' };
  return (
    <svg viewBox="0 0 160 90" style={style} role="img" aria-label={`Esquema del layout ${marker}`}>
      <rect x={0} y={0} width={160} height={90} fill={dark ? C.dark : C.bg} />
      {schema(marker, ln)}
    </svg>
  );
}

import { Fragment } from 'react';
import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';

/* Continuous bar geometry so half-weeks (e.g. 2-3.5, 0.5) draw half a cell.
   A whole number sits on a cell edge; a .5 cuts that cell at its midpoint.
   Returns the hosting week column, the left inset within it (0 or .5 of a
   cell) and the span measured in week-columns. */
function barGeom(start: number, end: number) {
  const leftPos = Number.isInteger(start) ? start - 1 : Math.floor(start) - 0.5;
  const rightPos = Number.isInteger(end) ? end : Math.floor(end) - 0.5;
  const span = Math.max(rightPos - leftPos, 0);
  return { span, hostWeek: Math.floor(leftPos) + 1, fracLeft: leftPos - Math.floor(leftPos) };
}

export function Gantt({ slide, page }: { slide: Extract<Slide, { kind: 'gantt' }>; page: number }) {
  const weeks = Array.from({ length: slide.weeks }, (_, i) => i + 1);
  const cols = `130px repeat(${slide.weeks}, 1fr)`;
  return (
    <div className={`frame theme-${slide.theme} gantt`}>
      <Chrome page={page} />
      <div className="title">{slide.title}</div>
      {slide.subtitle && <div className="sub">{slide.subtitle}</div>}
      <div className="chart" style={{ gridTemplateColumns: cols }}>
        <div className="ghd lbl">{slide.unit ?? 'Semanas'}</div>
        {weeks.map((n) => (
          <div className="ghd" key={`h${n}`}>{n}</div>
        ))}
        <div className="sep" />
        {slide.rows.map((row, ri) => {
          const { span, hostWeek, fracLeft } = barGeom(row.start, row.end);
          return (
            <Fragment key={`r${ri}`}>
              <div className="rlabel">{row.label}</div>
              {weeks.map((n) => (
                <div className="cell" key={`c${ri}-${n}`}>
                  {n === hostWeek && span > 0 && (
                    <div
                      className="bar"
                      style={{
                        background: `var(--${row.accent})`,
                        left: `calc(${fracLeft} * 100% + 6px)`,
                        width: `calc(${span} * 100% - 12px)`,
                      }}
                    />
                  )}
                </div>
              ))}
              <div className="sep" />
            </Fragment>
          );
        })}
        <div className="rlabel" style={{ background: 'transparent', fontWeight: 600, color: 'var(--dark)' }}>
          Cliente
        </div>
        {weeks.map((n) => (
          <div className="mil" key={`m${n}`}>{slide.milestones.includes(n) ? '◆' : ''}</div>
        ))}
      </div>
      {slide.note && <div className="note">{slide.note}</div>}
    </div>
  );
}

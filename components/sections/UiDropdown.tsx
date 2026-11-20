'use client';

/* Desplegable vivo del kit (.ixu-field--select o .ixu-chip--list + .ixu-menu): se abre de verdad en la guía, igual que
   los botones conmutables. Comportamiento canónico (ver estado «Desplegado» en lib/ui.ts):
   clic o Enter/Espacio/↓ abre · flechas recorren · Enter elige · Escape cierra y devuelve el foco
   al campo · clic fuera cierra. */
import { useEffect, useId, useRef, useState } from 'react';
import { Ico } from './uiIcons';

export function UiDropdown({ label, options, className = '', variant = 'field' }: { label: string; options: string[]; className?: string; variant?: 'field' | 'chip' }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(options[0]);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };
  const choose = (i: number) => {
    setValue(options[i]);
    setOpen(false);
    trigger.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); trigger.current?.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + options.length) % options.length); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={root} className={`ixu-dropdown ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        className={variant === 'chip' ? 'ixu-chip ixu-chip--list' : 'ixu-field ixu-field--select w-full text-left'}
        aria-pressed={variant === 'chip' ? value !== options[0] : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={value === label ? label : `${label}: ${value}`}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        {variant === 'chip' ? value : <span className="ixu-field__value">{value}</span>}
        {variant === 'chip' ? Ico.chevron(10) : Ico.chevron()}
      </button>
      {open && (
        <div id={listId} role="listbox" aria-label={label} className="ixu-menu">
          {options.map((o, i) => (
            <div
              key={o}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o === value}
              className={`ixu-menu__item${i === active ? ' is-hover' : ''}`}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Barra de filtros viva, como la de las galerías: un chip con lista (cliente) y chips de etiqueta. */
export function UiFilterBar({ clientLabel, clients, tags }: { clientLabel: string; clients: string[]; tags: string[] }) {
  const [on, setOn] = useState<string[]>([]);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <UiDropdown variant="chip" label={clientLabel} options={[clientLabel, ...clients]} />
      {tags.map((t) => (
        <button key={t} type="button" className="ixu-chip" aria-pressed={on.includes(t)}
          onClick={() => setOn((o) => (o.includes(t) ? o.filter((x) => x !== t) : [...o, t]))}>
          {t}
        </button>
      ))}
    </div>
  );
}

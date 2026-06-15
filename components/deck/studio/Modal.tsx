'use client';
import { useEffect } from 'react';
import { overlay, card, cardTitle } from './ui';

/* Minimal modal shell: dimmed overlay + warm-light card, closes on Escape / backdrop click. */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={card} role="dialog" aria-modal aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div style={cardTitle}>{title}</div>
        {children}
      </div>
    </div>
  );
}

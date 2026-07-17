'use client';
import { useEffect } from 'react';
import { overlay, card, cardTitle } from './ui';

/* Minimal modal shell: dimmed overlay + warm-light card, closes on Escape / backdrop click. */
export function Modal({
  title,
  onClose,
  children,
  width,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
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
      <div style={{ ...card, ...(width ? { width: `min(${width}px, 100%)` } : {}) }} role="dialog" aria-modal aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div style={cardTitle}>{title}</div>
        {children}
      </div>
    </div>
  );
}

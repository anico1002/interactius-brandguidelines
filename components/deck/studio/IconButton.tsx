'use client';
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* Iconographic button with an on-hover/focus tooltip showing the action name.
   Styled with the existing UI Kit tones (matches the editor's icon buttons). */
export function IconButton({
  label,
  onClick,
  active = false,
  ariaPressed,
  children,
  tooltip,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  ariaPressed?: boolean;
  children: ReactNode;
  // Optional richer tooltip (multi-line via "\n"); falls back to `label` when absent.
  tooltip?: string;
}) {
  const [show, setShow] = useState(false);
  const btn: CSSProperties = {
    appearance: 'none', border: '1px solid #E0DAD2', cursor: 'pointer', padding: '5px 6px', lineHeight: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: active ? '#1C1A17' : '#fff', color: active ? '#F5F2ED' : '#1C1A17',
    transition: 'background .25s cubic-bezier(0.16,1,0.3,1), color .25s cubic-bezier(0.16,1,0.3,1)',
  };
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button
        type="button"
        style={btn}
        onClick={onClick}
        aria-label={label}
        aria-pressed={ariaPressed}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        {children}
      </button>
      {show && (
        <span
          role="tooltip"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: tooltip ? 0 : 'auto', left: tooltip ? 'auto' : '50%',
            transform: tooltip ? 'none' : 'translateX(-50%)',
            background: '#1C1A17', color: '#F5F2ED',
            font: tooltip ? '500 10px/1.7 var(--font-ibm-plex-mono, monospace)' : '500 10px/1 var(--font-ibm-plex-mono, monospace)',
            letterSpacing: '.04em', padding: tooltip ? '8px 10px' : '5px 7px',
            whiteSpace: tooltip ? 'pre' : 'nowrap', textAlign: 'left', zIndex: 50, pointerEvents: 'none',
          }}
        >
          {tooltip ?? label}
        </span>
      )}
    </span>
  );
}

'use client';
import { useEffect, useState } from 'react';
import type { DeckListItem } from '@/lib/decks/types';
import { deleteDeck, listDecks } from '@/lib/decks/api';
import { ConfirmModal } from './ConfirmModal';
import { colors, iconBtn, menuMeta, menuPanel, menuRow, menuRowMain } from './ui';

const fmt = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
};

/* The "Abrir ▾" dropdown: deck history with open / duplicate / delete per row. */
export function OpenMenu({
  onOpen,
  onDuplicate,
  onClose,
}: {
  onOpen: (item: DeckListItem) => void;
  onDuplicate: (item: DeckListItem) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<DeckListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DeckListItem | null>(null);

  const refresh = () => {
    listDecks()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar'));
  };
  useEffect(refresh, []);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteDeck(pendingDelete.id);
      setPendingDelete(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
      setPendingDelete(null);
    }
  };

  return (
    <>
      {/* transparent backdrop to close on outside click */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onMouseDown={onClose} />
      <div style={menuPanel}>
        {error && <div style={{ ...menuRow, color: '#99335F' }}>{error}</div>}
        {!items && !error && <div style={{ ...menuRow, color: colors.ash }}>Cargando…</div>}
        {items && items.length === 0 && <div style={{ ...menuRow, color: colors.ash }}>No hay presentaciones guardadas.</div>}
        {items?.map((it) => (
          <div key={it.id} style={menuRow}>
            <button
              style={menuRowMain}
              onClick={() => onOpen(it)}
              title="Abrir presentación"
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.commercial_id}</div>
              <div style={menuMeta}>Creado el {fmt(it.created_at)}</div>
            </button>
            <button style={iconBtn} title="Duplicar" aria-label="Duplicar" onClick={() => onDuplicate(it)}>⧉</button>
            <button style={{ ...iconBtn, color: '#99335F' }} title="Eliminar" aria-label="Eliminar" onClick={() => setPendingDelete(it)}>✕</button>
          </div>
        ))}
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Eliminar presentación"
          message={`¿Eliminar «${pendingDelete.commercial_id}»? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}

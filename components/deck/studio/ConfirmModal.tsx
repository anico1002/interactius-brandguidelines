'use client';
import { Modal } from './Modal';
import { btn, btnGhost, btnDanger } from './ui';

/* Generic confirmation dialog — used for the unsaved-changes guard and delete confirm. */
export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Aceptar',
  danger = false,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ font: '400 13px/1.55 var(--font-ibm-plex-mono, monospace)', color: '#1C1A17', marginBottom: 24 }}>
        {message}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button style={btnGhost} onClick={onClose}>Cancelar</button>
        <button style={danger ? btnDanger : btn} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

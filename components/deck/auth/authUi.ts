import type { CSSProperties } from 'react';
import { colors } from '../studio/ui';

const MONO = 'var(--font-ibm-plex-mono, monospace)';

/* Auth-screen styles, composed from the existing Deck Maker UI kit (studio/ui.ts).
   No new brand tokens — same warm-light card, mono type, dark filled button. */

export const card: CSSProperties = {
  background: colors.white, border: `1px solid ${colors.dark}`, padding: 28,
};
export const title: CSSProperties = {
  font: `600 13px/1.3 ${MONO}`, letterSpacing: '.06em', textTransform: 'uppercase',
  color: colors.dark, marginBottom: 6,
};
export const subtitle: CSSProperties = {
  font: `400 12px/1.5 ${MONO}`, color: colors.ash, marginBottom: 22,
};
export const label: CSSProperties = {
  display: 'block', font: `500 10px/1.4 ${MONO}`, letterSpacing: '.08em',
  textTransform: 'uppercase', color: colors.ash, marginBottom: 6,
};
export const input: CSSProperties = {
  width: '100%', padding: '10px 12px', border: `1px solid ${colors.warmDark}`, background: colors.white,
  font: `400 13px/1.4 ${MONO}`, color: colors.dark, outline: 'none',
};
export const field: CSSProperties = { marginBottom: 16 };
export const submit: CSSProperties = {
  width: '100%', appearance: 'none', border: `1px solid ${colors.dark}`, background: colors.dark,
  color: colors.warmLight, font: `500 12px/1 ${MONO}`, letterSpacing: '.04em',
  padding: '12px', cursor: 'pointer', marginTop: 4,
};
export const submitBusy: CSSProperties = { ...submit, opacity: 0.6, cursor: 'default' };
export const link: CSSProperties = {
  appearance: 'none', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
  font: `500 11px/1.4 ${MONO}`, color: colors.brick, textDecoration: 'none',
};
export const footer: CSSProperties = {
  marginTop: 18, textAlign: 'center', font: `400 11px/1.4 ${MONO}`, color: colors.ash,
};
export const errorBox: CSSProperties = {
  font: `400 11px/1.4 ${MONO}`, color: '#99335F', marginBottom: 14,
  border: '1px solid #99335F', padding: '9px 11px', background: 'rgba(153,51,95,.05)',
};
export const noticeBox: CSSProperties = {
  font: `400 12px/1.5 ${MONO}`, color: colors.dark, border: `1px solid ${colors.warmDark}`,
  padding: '12px 14px', background: colors.warmLight,
};

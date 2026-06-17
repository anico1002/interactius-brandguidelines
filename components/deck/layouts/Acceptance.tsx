'use client';
import { useContext } from 'react';
import type { Slide } from '@/lib/deck/types';
import { Chrome } from '../Chrome';
import { SignContext } from '../viewer';
import { SignatureCapture } from '../SignatureCapture';

const DEFAULT_TITLE = 'Aprobación del presupuesto';
const DEFAULT_WHO = 'CARLOS RUIZ RE\nco-CEO / Administrador\nHappy User Experiences S.L.\nB65914848\nPau Claris 100, 2ª Planta 08009\nBarcelona';
const DEFAULT_NOTE = 'La firma de esta página acuerda la aceptación total de la propuesta presentada en este documento.';
const DEFAULT_CTA = '¡Una firma y empezamos!';
const DEFAULT_SIG = '/presentaciones/sign.png';

/* Brand page (ref p.43): budget approval / signature. Title, signer block, note, CTA and
   signature image are editable from the markdown; missing fields fall back to defaults. */
export function Acceptance({ slide, page }: { slide: Extract<Slide, { kind: 'acceptance' }>; page: number }) {
  const s = slide.signer;
  const who = s
    ? [s.name, s.role, s.company, s.nif, s.address].filter(Boolean).join('\n')
    : DEFAULT_WHO;
  // On the saved-deck viewer route the client can sign digitally; everywhere else (editor
  // preview, base64 share) we keep the static paper-signature lines.
  const sign = useContext(SignContext);
  return (
    <div className="frame theme-light accept">
      <div className="whitehalf" />
      <Chrome page={page} />
      <div className="title">{slide.title ?? DEFAULT_TITLE}</div>

      <div className="sign">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="sig" src={slide.signatureImage?.src ?? DEFAULT_SIG} alt={slide.signatureImage?.alt ?? 'Firma'} />
        <div className="who">{who}</div>
      </div>

      {sign ? (
        <SignatureCapture deckId={sign.deckId} initial={sign.initial} />
      ) : (
        <div className="lines" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      )}

      <div className="note">{slide.note ?? DEFAULT_NOTE}</div>
      <div className="cta">{slide.cta ?? DEFAULT_CTA}</div>
    </div>
  );
}

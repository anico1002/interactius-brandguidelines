/* Success state — replaces the form after a successful submit (hero stays visible, PRD §9.4). */

import { Md } from './Md';

export function SuccessPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="ixf-success" role="status" aria-live="polite">
      <h2 className="ixf-success__title">{title}</h2>
      <div className="ixf-success__msg">
        <Md>{message}</Md>
      </div>
    </div>
  );
}

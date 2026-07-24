/* 404 for the /forms segment (unknown id or draft form). Kept noindex via the X-Robots-Tag header
   set in middleware for all non-api /forms paths. Does not reveal whether a form exists. */

import '@/components/forms/forms.css';

export default function FormNotFound() {
  return (
    <main className="ixf-notfound">
      <p className="ixf-notfound__code">404 · interactīus forms</p>
      <h1 className="ixf-notfound__title">Este formulario no está disponible.</h1>
      <p className="ixf-signature" style={{ color: 'rgba(245,242,237,0.72)' }}>
        Comprueba el enlace que te compartieron.
      </p>
    </main>
  );
}

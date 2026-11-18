import { Marco, TituloMarco } from './Marco';

const ERRORES: Record<string, string> = {
  credenciales: 'Usuario o contraseña incorrectos.',
  bloqueado: 'Demasiados intentos. Prueba de nuevo en unos minutos.',
};

/** Formulario HTML puro: funciona sin JavaScript. */
export function Login({ next, error }: { next: string; error?: string }) {
  const mensaje = error && Object.hasOwn(ERRORES, error) ? ERRORES[error] : undefined;
  return (
    <Marco>
      <TituloMarco>Acceso privado</TituloMarco>
      <p className="dc-lead">Introduce el usuario y la contraseña que te ha enviado Interactius.</p>

      <form method="post" action="/clientes/login" className="dc-form">
        <input type="hidden" name="next" value={next} />
        <label className="dc-campo">
          <span className="dc-etiqueta">Usuario</span>
          <input
            className="dc-input"
            name="email"
            type="email"
            required
            autoComplete="username"
            aria-invalid={mensaje ? true : undefined}
          />
        </label>
        <label className="dc-campo">
          <span className="dc-etiqueta">Contraseña</span>
          <input
            className="dc-input"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            aria-invalid={mensaje ? true : undefined}
          />
        </label>

        {mensaje && (
          <p className="dc-error" role="alert">
            {mensaje}
          </p>
        )}

        <div>
          <button type="submit" className="dc-link">
            <span>Entrar</span>
          </button>
        </div>
      </form>
    </Marco>
  );
}

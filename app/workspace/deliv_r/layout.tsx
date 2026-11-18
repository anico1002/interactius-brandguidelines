import '@/components/deliv/deliv.css';

/* Deliv_r del equipo: mismas variables, enlaces e inputs que la zona de clientes (deliv.css). */
export default function DelivEquipoLayout({ children }: { children: React.ReactNode }) {
  return <div className="deliv-equipo">{children}</div>;
}

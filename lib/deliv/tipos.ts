export type TipoArtefacto = 'html' | 'pdf'
export type EstadoArtefacto = 'subiendo' | 'publicado'

export interface Artefacto {
  /** uuid: clave primaria y URL de la ficha. */
  id: string
  /** 10 caracteres: URL del cliente. */
  publicId: string
  cliente: string
  clienteNombre: string
  titulo: string
  tipo: TipoArtefacto
  entrada: string
  version: number
  estado: EstadoArtefacto
  avisos: string[]
  creadoPor: string
  creadoEn: string
  publicadoEn: string | null
}

export interface UsuarioCliente {
  email: string
  hash: string | null
  creadoPor: string
  creadoEn: string
  credencialesEn: string
  fallos: number
  bloqueadoHasta: string | null
}

export interface Acceso {
  artefactoId: string
  email: string
  concedidoPor: string
  concedidoEn: string
  ultimoAcceso: string | null
}

/**
 * Formateos consistentes con la terminología de la spec (rioplatense, lenguaje natural).
 */

const pesosFmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function formatPesos(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0)
  if (!Number.isFinite(n)) return '$0'
  return pesosFmt.format(n)
}

/**
 * Frase para mostrar el estado de crédito de un alumno.
 * Usa terminología exacta de la spec: "viandas a favor", "Debe plata".
 */
export function describirCredito(viandas: number, pesos: number): string {
  if (pesos < 0) return `Debe ${formatPesos(-pesos)}`
  if (viandas > 0) return `${viandas} ${viandas === 1 ? 'vianda' : 'viandas'} a favor`
  if (pesos > 0) return `${formatPesos(pesos)} a favor`
  return 'Sin crédito'
}

/**
 * Saldo expandido para la home del padre: muestra disponibles + reservadas.
 * "Disponibles" = lo que se puede usar para pedir más viandas.
 * "Reservadas" = pedidos confirmados con fecha futura (ya descontados del
 * saldo, pero el padre los ve como "viandas pagas que aún no se consumieron").
 */
export function describirCreditoConReservas(
  disponibles: number,
  reservadas: number,
  pesos: number,
): string {
  if (pesos < 0) return `Debe ${formatPesos(-pesos)}`
  const total = disponibles + reservadas
  if (total === 0) return 'Sin crédito'
  const partes: string[] = []
  if (disponibles > 0) partes.push(`${disponibles} ${disponibles === 1 ? 'libre' : 'libres'}`)
  if (reservadas > 0) partes.push(`${reservadas} ${reservadas === 1 ? 'reservada' : 'reservadas'}`)
  return partes.join(' · ')
}

const dateFmt = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatFecha(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return dateFmt.format(d)
}

const dateTimeFmt = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatFechaHora(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return dateTimeFmt.format(d)
}

const horaFmt = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' })
export function formatHora(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return horaFmt.format(d)
}

/**
 * Fecha YYYY-MM-DD en zona horaria Argentina, para comparar con `pedidos.fecha` (date sin TZ).
 */
export function fechaHoyAR(): string {
  const now = new Date()
  // Argentina = UTC-3 fijo (sin DST). Trabajar con offsets manualmente para evitar problemas.
  const ar = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return ar.toISOString().slice(0, 10)
}

export function fechaMananaAR(): string {
  const now = new Date()
  const ar = new Date(now.getTime() - 3 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000)
  return ar.toISOString().slice(0, 10)
}

/**
 * Ventana en la que las familias pueden hacer pedidos:
 * - Lunes a viernes: abierto 00:00-09:59 y 15:00-23:59 (cierra entre 10 y 15
 *   para la preparación de las viandas del día)
 * - Sábados y domingos: todo el día
 *
 * Devuelve un objeto con el estado y, si está cerrado, una explicación corta
 * para mostrar al usuario.
 */
export function estadoVentanaPedidos(): { abierto: boolean; motivo: string | null } {
  const now = new Date()
  // Argentina = UTC-3 fijo
  const ar = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const diaSemana = ar.getUTCDay() // 0=domingo .. 6=sábado
  const horaAR = ar.getUTCHours()
  const minutosAR = ar.getUTCMinutes()

  const esFinde = diaSemana === 0 || diaSemana === 6
  if (esFinde) return { abierto: true, motivo: null }

  const minutosTotales = horaAR * 60 + minutosAR
  const inicioCierre = 10 * 60 // 10:00
  const finCierre = 15 * 60 // 15:00

  if (minutosTotales >= inicioCierre && minutosTotales < finCierre) {
    return {
      abierto: false,
      motivo: 'Los pedidos cierran de 10:00 a 15:00 mientras preparan las viandas. Volvé a las 15.',
    }
  }

  return { abierto: true, motivo: null }
}

export function diaCicloDe(fecha: string): number {
  // Mapea una fecha YYYY-MM-DD a un dia del ciclo 1-14.
  // Usamos los días desde una fecha de referencia (lunes anclado en 2026-01-05).
  const ref = Date.UTC(2026, 0, 5)
  const [y, m, d] = fecha.split('-').map(Number)
  const target = Date.UTC(y, m - 1, d)
  const diasDesde = Math.floor((target - ref) / (24 * 60 * 60 * 1000))
  const dia = ((diasDesde % 14) + 14) % 14
  return dia + 1
}

export const FORMAS_PAGO_LABEL = {
  credito: 'Crédito a favor',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  a_deber: 'A deber',
} as const

export const FORMAS_PAGO_LABEL_CORTO = {
  credito: 'Crédito',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  a_deber: 'A deber',
} as const

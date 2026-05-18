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

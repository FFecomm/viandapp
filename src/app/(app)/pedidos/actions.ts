'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import type { FormaPago, TipoMenu } from '@/lib/supabase/types'

export async function borrarPedido(formData: FormData): Promise<{ error?: string } | void> {
  await requireRole(['operadora', 'administrativo'])
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Falta el id' }

  const supabase = createClient()
  const { error } = await supabase.rpc('fn_borrar_pedido', { p_pedido_id: id })
  if (error) return { error: 'No se pudo borrar el pedido' }

  revalidatePath('/pedidos')
}

type CargarPedidoInput = {
  alumno_id: string
  fecha: string
  menu: TipoMenu
  observaciones: string | null
  forma_pago_vianda: FormaPago
  precio_vianda: number
  productos: { producto_id: string; cantidad: number }[]
}

/**
 * Variante de un solo día — usada por la vista de "vianda extra" en la encargada
 * y por casos donde se carga un pedido aislado (no múltiple). Para flujos
 * normales, usar `cargarPedidoOperadora` (multi-días).
 */
export async function cargarPedido(input: CargarPedidoInput): Promise<{ error?: string; pedido_id?: string }> {
  await requireRole(['operadora', 'administrativo'])

  const supabase = createClient()
  const { data, error } = await supabase.rpc('fn_cargar_pedido', {
    p_alumno_id: input.alumno_id,
    p_fecha: input.fecha,
    p_menu: input.menu,
    p_observaciones: input.observaciones,
    p_forma_pago_vianda: input.forma_pago_vianda,
    p_precio_vianda: input.precio_vianda,
    p_productos: input.productos,
  })
  if (error) return { error: error.message || 'No se pudo guardar el pedido' }

  revalidatePath('/pedidos')
  revalidatePath('/credito')
  revalidatePath(`/credito/${input.alumno_id}`)
  return { pedido_id: String(data ?? '') }
}

export async function cargarPedidoYVolver(input: CargarPedidoInput): Promise<{ error?: string } | void> {
  const res = await cargarPedido(input)
  if (res.error) return { error: res.error }
  redirect(`/pedidos?fecha=${input.fecha}`)
}

type DiaPedido = {
  fecha: string
  menu: TipoMenu
  observaciones: string | null
}

type CargarPedidoMultiInput = {
  alumno_id: string
  precio_vianda: number
  forma_pago_vianda: FormaPago
  dias: DiaPedido[]
}

/**
 * Carga N pedidos (uno por día) para un alumno. La operadora elige forma de pago:
 * - 'credito' → consume saldo (requiere saldo suficiente)
 * - 'efectivo' / 'transferencia' → cobro por fuera de la app, va a caja
 * - 'a_deber' → queda como deuda del alumno
 */
export async function cargarPedidoOperadora(
  input: CargarPedidoMultiInput,
): Promise<{ error?: string } | void> {
  await requireRole(['operadora', 'administrativo', 'encargada'])

  if (!input.dias.length) return { error: 'Elegí al menos un día' }

  const FORMAS_VALIDAS: FormaPago[] = ['credito', 'efectivo', 'transferencia', 'a_deber']
  if (!FORMAS_VALIDAS.includes(input.forma_pago_vianda)) {
    return { error: 'Forma de pago inválida' }
  }

  const supabase = createClient()

  // Solo validamos saldo si la forma elegida es crédito. Efectivo/transferencia/
  // a_deber NO requieren saldo previo: el dinero entra (o no) por fuera del app.
  if (input.forma_pago_vianda === 'credito') {
    const { data: alumno, error: errAlumno } = await supabase
      .from('alumnos')
      .select('viandas_credito')
      .eq('id', input.alumno_id)
      .single()
    if (errAlumno || !alumno) return { error: 'No se pudo verificar el saldo' }
    if (alumno.viandas_credito < input.dias.length) {
      return {
        error: `Saldo insuficiente: ${alumno.viandas_credito} viandas disponibles, ${input.dias.length} necesarias.`,
      }
    }
  }

  for (const dia of input.dias) {
    const { error } = await supabase.rpc('fn_cargar_pedido', {
      p_alumno_id: input.alumno_id,
      p_fecha: dia.fecha,
      p_menu: dia.menu,
      p_observaciones: dia.observaciones,
      p_forma_pago_vianda: input.forma_pago_vianda,
      p_precio_vianda: input.precio_vianda,
      p_productos: [],
    })
    if (error) {
      return { error: error.message || `No se pudo cargar el pedido del ${dia.fecha}` }
    }
  }

  revalidatePath('/pedidos')
  revalidatePath('/credito')
  revalidatePath(`/credito/${input.alumno_id}`)
  revalidatePath('/caja')
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { enviarPushAUsuario } from '@/lib/push'
import type { TipoMenu } from '@/lib/supabase/types'

type DiaPedido = {
  fecha: string
  menu: TipoMenu
  observaciones: string | null
}

type CargarPedidoInput = {
  alumno_id: string
  precio_vianda: number
  dias: DiaPedido[]
}

export async function cargarPedidoFamilia(
  input: CargarPedidoInput,
): Promise<{ error?: string } | void> {
  await requireRole(['padre'])

  if (!input.dias.length) return { error: 'Elegí al menos un día' }

  const supabase = createClient()

  // Prepago estricto: verificar server-side que el saldo en viandas alcance para
  // todos los días seleccionados antes de insertar ningún pedido.
  const { data: alumno, error: errAlumno } = await supabase
    .from('alumnos')
    .select('viandas_credito')
    .eq('id', input.alumno_id)
    .single()
  if (errAlumno || !alumno) return { error: 'No se pudo verificar el saldo' }
  if (alumno.viandas_credito < input.dias.length) {
    return {
      error: `Saldo insuficiente: tenés ${alumno.viandas_credito} y necesitás ${input.dias.length}.`,
    }
  }

  // Cargamos pedidos uno por uno. fn_cargar_pedido descuenta crédito atómicamente
  // por pedido; el saldo verificado arriba garantiza que ninguno caiga en deuda.
  for (const dia of input.dias) {
    const { error } = await supabase.rpc('fn_cargar_pedido', {
      p_alumno_id: input.alumno_id,
      p_fecha: dia.fecha,
      p_menu: dia.menu,
      p_observaciones: dia.observaciones,
      p_forma_pago_vianda: 'credito',
      p_precio_vianda: input.precio_vianda,
      p_productos: [],
    })
    if (error) {
      return { error: error.message || `No se pudo cargar el pedido del ${dia.fecha}` }
    }
  }

  // Notificación push: pedido confirmado + saldo bajo si quedó ≤ 2 viandas.
  // Best-effort: no rompe el flujo si falla.
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: alumnoActual } = await supabase
      .from('alumnos')
      .select('nombre_completo, viandas_credito')
      .eq('id', input.alumno_id)
      .maybeSingle()
    if (user && alumnoActual) {
      const nombre = (alumnoActual as { nombre_completo: string }).nombre_completo
      const saldo = (alumnoActual as { viandas_credito: number }).viandas_credito
      const n = input.dias.length
      await enviarPushAUsuario(user.id, {
        title: 'Pedido confirmado',
        body: `${n} ${n === 1 ? 'vianda' : 'viandas'} para ${nombre.split(' ')[0]}.`,
        url: '/familia/historial',
        tag: `pedido-${input.alumno_id}`,
      })
      if (saldo <= 2) {
        await enviarPushAUsuario(user.id, {
          title: 'Saldo bajo',
          body: `${nombre.split(' ')[0]} tiene ${saldo} ${saldo === 1 ? 'vianda' : 'viandas'} disponibles.`,
          url: '/familia/saldo',
          tag: `saldo-bajo-${input.alumno_id}`,
        })
      }
    }
  } catch (e) {
    console.error('[push] fallo notificando pedido confirmado:', e)
  }

  revalidatePath('/familia')
  revalidatePath('/familia/historial')
  revalidatePath('/familia/credito')
  redirect(`/familia/pedir/exito?n=${input.dias.length}&alumno=${input.alumno_id}`)
}

export async function borrarMiPedido(formData: FormData): Promise<{ error?: string } | void> {
  await requireRole(['padre'])
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Falta el id' }

  const supabase = createClient()
  const { error } = await supabase.rpc('fn_borrar_pedido', { p_pedido_id: id })
  if (error) return { error: error.message || 'No se pudo borrar el pedido' }

  revalidatePath('/familia/historial')
  revalidatePath('/familia')
}

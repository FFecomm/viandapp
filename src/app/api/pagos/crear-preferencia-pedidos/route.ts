import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { COMISION_POR_VIANDA, preferenceClient, tieneMpConectado, tieneMpOAuthConfigurado } from '@/lib/mercadopago'
import { reportarError } from '@/lib/reportar-error'

type PedidoInput = {
  fecha: string
  menu: string
  observaciones?: string
}

type Body = {
  alumno_id: string
  pedidos: PedidoInput[]
}

const MENUS_VALIDOS = new Set(['A', 'B', 'C', 'Hamburguesa', 'Fideos', 'Sandwich'])

export async function POST(req: Request) {
  if (!tieneMpOAuthConfigurado()) {
    return NextResponse.json({ error: 'Mercado Pago OAuth no está configurado' }, { status: 503 })
  }
  if (!(await tieneMpConectado())) {
    return NextResponse.json(
      { error: 'El colegio todavía no conectó su cuenta de Mercado Pago' },
      { status: 503 },
    )
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const alumno_id = String(body.alumno_id ?? '').trim()
  const pedidos = Array.isArray(body.pedidos) ? body.pedidos : []

  if (!alumno_id) return NextResponse.json({ error: 'Falta el alumno' }, { status: 400 })
  if (pedidos.length < 1) return NextResponse.json({ error: 'Tenés que elegir al menos un día' }, { status: 400 })
  if (pedidos.length > 30) return NextResponse.json({ error: 'Demasiados días en un solo pago' }, { status: 400 })

  for (const p of pedidos) {
    if (!p.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(p.fecha)) {
      return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
    }
    if (!p.menu || !MENUS_VALIDOS.has(p.menu)) {
      return NextResponse.json({ error: `Menú inválido: ${p.menu}` }, { status: 400 })
    }
  }

  const [{ data: alumno }, { data: config }] = await Promise.all([
    supabase.from('alumnos').select('id, nombre_completo').eq('id', alumno_id).maybeSingle(),
    supabase.from('configuracion').select('value').eq('key', 'precio_vianda_actual').maybeSingle(),
  ])
  if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })

  const precioVianda = Number(config?.value ?? 0)
  if (!Number.isFinite(precioVianda) || precioVianda <= 0) {
    return NextResponse.json({ error: 'Precio de vianda no configurado' }, { status: 500 })
  }

  // Crea pago + pedidos en pendiente_pago, todo en una transacción
  const pedidosJsonb = pedidos.map((p) => ({
    fecha: p.fecha,
    menu: p.menu,
    observaciones: p.observaciones ?? null,
  }))

  const { data: pagoId, error: rpcError } = await supabase.rpc('fn_iniciar_pedidos_con_pago', {
    p_alumno_id: alumno_id,
    p_pedidos: pedidosJsonb,
    p_precio_unitario: precioVianda,
  })
  if (rpcError || !pagoId) {
    return NextResponse.json(
      { error: rpcError?.message ?? 'No se pudo iniciar el pedido' },
      { status: 400 },
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const cantidad = pedidos.length

  try {
    const pref = await preferenceClient()
    const preference = await pref.create({
      body: {
        items: [
          {
            id: `vianda-${alumno_id}`,
            title: `ViandApp — ${cantidad} ${cantidad === 1 ? 'vianda' : 'viandas'} para ${(alumno as { nombre_completo: string }).nombre_completo}`,
            quantity: cantidad,
            currency_id: 'ARS',
            unit_price: precioVianda,
          },
        ],
        external_reference: String(pagoId),
        marketplace_fee: COMISION_POR_VIANDA * cantidad,
        back_urls: {
          success: `${baseUrl}/familia/pedir/resultado?pago=${pagoId}`,
          failure: `${baseUrl}/familia/pedir/resultado?pago=${pagoId}`,
          pending: `${baseUrl}/familia/pedir/resultado?pago=${pagoId}`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/pagos/webhook`,
        metadata: { pago_id: String(pagoId) },
      },
    })

    await supabase.rpc('fn_set_preference_id', {
      p_pago_id: pagoId,
      p_preference_id: preference.id ?? '',
    })

    return NextResponse.json({
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      pago_id: pagoId,
    })
  } catch (e) {
    // Si falla la creación de preferencia, cancelamos los pedidos pendientes
    // para liberar los días. Best-effort.
    await supabase
      .from('pedidos')
      .update({ estado: 'cancelado' })
      .eq('pago_id', pagoId)
      .eq('estado', 'pendiente_pago')

    await reportarError('mp-crear-preferencia-pedidos', e, { alumno_id, cantidad })
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al crear preferencia: ${msg}` }, { status: 500 })
  }
}

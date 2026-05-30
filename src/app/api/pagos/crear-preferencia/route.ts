import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { COMISION_POR_VIANDA, preferenceClient, tieneMpConfigurado } from '@/lib/mercadopago'

type Body = {
  alumno_id: string
  viandas: number
}

export async function POST(req: Request) {
  if (!tieneMpConfigurado()) {
    return NextResponse.json({ error: 'Mercado Pago no está configurado' }, { status: 503 })
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
  const viandas = Number(body.viandas)
  if (!alumno_id) return NextResponse.json({ error: 'Falta el alumno' }, { status: 400 })
  if (!Number.isInteger(viandas) || viandas < 1) {
    return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })
  }

  // Traer alumno (con RLS valida que sea del padre) y precio vigente.
  const [{ data: alumno }, { data: config }] = await Promise.all([
    supabase.from('alumnos').select('id, nombre_completo').eq('id', alumno_id).maybeSingle(),
    supabase.from('configuracion').select('value').eq('key', 'precio_vianda_actual').maybeSingle(),
  ])
  if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })

  const precioVianda = Number(config?.value ?? 0)
  if (!Number.isFinite(precioVianda) || precioVianda <= 0) {
    return NextResponse.json({ error: 'Precio de vianda no configurado' }, { status: 500 })
  }

  // Crear el registro local de pago (pendiente).
  const { data: pagoId, error: rpcError } = await supabase.rpc('fn_iniciar_pago_mp', {
    p_alumno_id: alumno_id,
    p_viandas: viandas,
    p_precio_unitario: precioVianda,
  })
  if (rpcError || !pagoId) {
    return NextResponse.json({ error: rpcError?.message ?? 'No se pudo iniciar el pago' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  try {
    const preference = await preferenceClient().create({
      body: {
        items: [
          {
            id: `vianda-${alumno_id}`,
            title: `ViandApp — ${viandas} viandas para ${(alumno as { nombre_completo: string }).nombre_completo}`,
            quantity: viandas,
            currency_id: 'ARS',
            unit_price: precioVianda,
          },
        ],
        external_reference: String(pagoId),
        marketplace_fee: COMISION_POR_VIANDA * viandas,
        back_urls: {
          success: `${baseUrl}/familia/saldo/resultado?pago=${pagoId}`,
          failure: `${baseUrl}/familia/saldo/resultado?pago=${pagoId}`,
          pending: `${baseUrl}/familia/saldo/resultado?pago=${pagoId}`,
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
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: `Error al crear preferencia: ${msg}` }, { status: 500 })
  }
}

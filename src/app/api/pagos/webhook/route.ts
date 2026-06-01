import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { paymentClient, tieneMpOAuthConfigurado } from '@/lib/mercadopago'
import { enviarPushAUsuario } from '@/lib/push'
import { reportarError } from '@/lib/reportar-error'

/**
 * Valida la firma `x-signature` de Mercado Pago.
 * Formato del header: `ts=1234567890,v1=abc123...`
 * Cadena firmada: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * Algoritmo: HMAC-SHA256 con MP_WEBHOOK_SECRET.
 * Si MP_WEBHOOK_SECRET no está configurado, no se valida (modo dev).
 */
function validarFirmaMp(req: Request, dataId: string): { ok: boolean; motivo?: string } {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return { ok: true } // Dev: sin secret, no se valida.

  const signatureHeader = req.headers.get('x-signature')
  const requestId = req.headers.get('x-request-id')
  if (!signatureHeader || !requestId) {
    return { ok: false, motivo: 'Faltan headers de firma' }
  }

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, ...rest] = p.trim().split('=')
      return [k, rest.join('=')]
    }),
  )
  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return { ok: false, motivo: 'Firma con formato inválido' }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    const ok = crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'))
    return ok ? { ok: true } : { ok: false, motivo: 'Firma no coincide' }
  } catch {
    return { ok: false, motivo: 'Firma malformada' }
  }
}

/**
 * Webhook de Mercado Pago. MP llama con `type=payment` y `data.id` con el
 * mp_payment_id. Buscamos el payment vía la API, encontramos su
 * external_reference (= nuestro pago_id) y acreditamos.
 */
export async function POST(req: Request) {
  if (!tieneMpOAuthConfigurado()) {
    return NextResponse.json({ ok: true, skipped: 'no-mp-config' })
  }

  let body: { type?: string; data?: { id?: string | number } } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // MP puede mandar otros tipos (merchant_order, etc.); solo nos importa payment.
  if (body.type !== 'payment') {
    return NextResponse.json({ ok: true, ignored: body.type ?? 'unknown' })
  }
  const mp_payment_id = String(body.data?.id ?? '')
  if (!mp_payment_id) {
    return NextResponse.json({ error: 'Falta data.id' }, { status: 400 })
  }

  const firma = validarFirmaMp(req, mp_payment_id)
  if (!firma.ok) {
    await reportarError('mp-webhook-firma', new Error(firma.motivo ?? 'firma inválida'), { mp_payment_id })
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  try {
    const pay = await paymentClient()
    const payment = await pay.get({ id: mp_payment_id })
    const externalRef = String(payment.external_reference ?? '')
    if (!externalRef) {
      return NextResponse.json({ error: 'Pago sin external_reference' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.rpc('fn_acreditar_pago_mp', {
      p_pago_id: externalRef,
      p_mp_payment_id: mp_payment_id,
      p_mp_status: String(payment.status ?? 'pendiente'),
    })
    if (error) {
      await reportarError('mp-webhook-acreditar', error, { mp_payment_id, pago_id: externalRef })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aviso push al padre si el pago fue aprobado.
    if (String(payment.status) === 'approved') {
      try {
        const { data: pago } = await supabase
          .from('pagos')
          .select('usuario_id, viandas_compradas, monto_total')
          .eq('id', externalRef)
          .maybeSingle()
        if (pago) {
          const p = pago as { usuario_id: string; viandas_compradas: number; monto_total: number | string }
          await enviarPushAUsuario(p.usuario_id, {
            title: '¡Pago acreditado!',
            body: `Cargamos ${p.viandas_compradas} ${p.viandas_compradas === 1 ? 'vianda' : 'viandas'} a tu cuenta.`,
            url: '/familia',
            tag: `pago-${externalRef}`,
          })
        }
      } catch (e) {
        console.error('[push] fallo notificando pago acreditado:', e)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    await reportarError('mp-webhook', e, { mp_payment_id })
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  // Para health-check del webhook
  return NextResponse.json({ ok: true, hint: 'POST aquí desde MP' })
}

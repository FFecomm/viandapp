import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:admin@viandapp.local'

let configured = false
function ensureConfigured() {
  if (configured) return true
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY)
  configured = true
  return true
}

export function tieneVapidConfigurado(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY)
}

type Payload = {
  title: string
  body: string
  url?: string
  tag?: string
}

type PushSubscription = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Envía una notificación a todas las suscripciones activas del usuario.
 * Si el endpoint devuelve 404/410, se borra la fila (suscripción caducada).
 * No tira: las fallas se loggean pero no rompen el flujo del caller.
 */
export async function enviarPushAUsuario(usuarioId: string, payload: Payload): Promise<void> {
  if (!ensureConfigured()) {
    console.warn('[push] VAPID no configurado, saltando notificación')
    return
  }

  const supabase = createAdminClient()
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('usuario_id', usuarioId)
  if (error) {
    console.error('[push] error leyendo suscripciones:', error.message)
    return
  }
  if (!subs || subs.length === 0) return

  const body = JSON.stringify(payload)
  await Promise.all(
    (subs as PushSubscription[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        )
      } catch (e) {
        const status =
          e && typeof e === 'object' && 'statusCode' in e
            ? (e as { statusCode: number }).statusCode
            : null
        if (status === 404 || status === 410) {
          // Suscripción caducada, limpiarla
          await supabase.from('push_subscriptions').delete().eq('id', s.id)
        } else {
          console.error('[push] error enviando:', e instanceof Error ? e.message : e)
        }
      }
    }),
  )
}

/**
 * Notifica al usuario que es PADRE del alumno indicado.
 */
export async function enviarPushAFamiliaDeAlumno(alumnoId: string, payload: Payload): Promise<void> {
  if (!tieneVapidConfigurado()) return
  const supabase = createAdminClient()
  const { data: vinculos } = await supabase
    .from('familias_alumnos')
    .select('usuario_id')
    .eq('alumno_id', alumnoId)
  if (!vinculos) return
  await Promise.all(
    (vinculos as { usuario_id: string }[]).map((v) =>
      enviarPushAUsuario(v.usuario_id, payload),
    ),
  )
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validarPasswordFuerte } from '@/lib/auth/password'
import { emailNotificacionSeguridad, enviarEmail } from '@/lib/email'
import { reportarError } from '@/lib/reportar-error'

type Result = { error?: string; ok?: boolean }

/**
 * Actualiza la contraseña del usuario que viene de un flujo de recuperación.
 * Requiere sesión activa (la genera el callback OTP). Envía email de
 * notificación al final. Best-effort en el envío del mail.
 */
export async function guardarNuevaClave(formData: FormData): Promise<Result> {
  const nueva = String(formData.get('nueva') ?? '')
  const repetir = String(formData.get('repetir') ?? '')

  if (!nueva || !repetir) return { error: 'Completá ambos campos' }
  if (nueva !== repetir) return { error: 'Las contraseñas no coinciden' }
  const motivo = validarPasswordFuerte(nueva)
  if (motivo) return { error: motivo }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { error: 'El link expiró o ya fue usado. Volvé a pedir uno nuevo.' }
  }

  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) {
    await reportarError('nueva-clave-update', error, { user_id: user.id })
    return { error: error.message || 'No pudimos cambiar la contraseña' }
  }

  // Notificación de seguridad por email.
  const cuando = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  const meta = (user.user_metadata ?? {}) as { nombre?: string; full_name?: string }
  const nombreCorto =
    meta.nombre?.split(' ')[0] ||
    meta.full_name?.split(' ')[0] ||
    user.email.split('@')[0]
  await enviarEmail({
    to: user.email,
    subject: 'Tu contraseña de ViandApp fue cambiada',
    html: emailNotificacionSeguridad({
      titulo: 'Contraseña restablecida',
      saludoNombre: nombreCorto,
      accion: 'restableciste tu contraseña desde el flujo de "olvidé mi contraseña"',
      cuando,
      consejo: 'Volvé a usar "Olvidaste tu contraseña" inmediatamente para tomar el control de la cuenta y avisanos a fmajul2@gmail.com.',
    }),
  })

  revalidatePath('/', 'layout')
  return { ok: true }
}

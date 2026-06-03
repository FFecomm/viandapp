'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/auth/profile'
import { reportarError } from '@/lib/reportar-error'
import { validarPasswordFuerte } from '@/lib/auth/password'
import { emailNotificacionSeguridad, enviarEmail } from '@/lib/email'

type Result = { error?: string; ok?: boolean; info?: string }

/**
 * Cambia la contraseña del usuario logueado.
 * Pide la contraseña actual y la verifica con un re-login para confirmar
 * identidad (Supabase no requiere esto, pero es buena práctica de seguridad
 * para que un atacante que toma una sesión robada no pueda cambiar la clave).
 */
export async function cambiarMiPassword(formData: FormData): Promise<Result> {
  const actual = String(formData.get('actual') ?? '')
  const nueva = String(formData.get('nueva') ?? '')
  const repetir = String(formData.get('repetir') ?? '')

  if (!actual || !nueva || !repetir) return { error: 'Completá los tres campos' }
  if (nueva !== repetir) return { error: 'Las contraseñas nuevas no coinciden' }
  const motivo = validarPasswordFuerte(nueva)
  if (motivo) return { error: motivo }
  if (actual === nueva) return { error: 'La nueva contraseña no puede ser igual a la actual' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'No estás autenticado' }

  // Re-login para confirmar la contraseña actual.
  const { error: errLogin } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: actual,
  })
  if (errLogin) return { error: 'La contraseña actual no es correcta' }

  const { error: errUpdate } = await supabase.auth.updateUser({ password: nueva })
  if (errUpdate) {
    await reportarError('cuenta-cambiar-password', errUpdate, { user_id: user.id })
    return { error: 'No pudimos cambiar la contraseña. Intentá de nuevo.' }
  }

  // Notificación de seguridad por email. Best-effort: no rompe el flujo si falla.
  const cuando = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  const nombreCorto = user.user_metadata?.nombre?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'familia'
  await enviarEmail({
    to: user.email,
    subject: 'Tu contraseña de ViandApp fue cambiada',
    html: emailNotificacionSeguridad({
      titulo: 'Contraseña cambiada',
      saludoNombre: nombreCorto,
      accion: 'tu contraseña fue cambiada exitosamente',
      cuando,
      consejo: 'Cambiá tu contraseña ahora desde "Olvidaste tu contraseña" en la pantalla de login, y avisanos a fmajul2@gmail.com.',
    }),
  })

  return { ok: true, info: 'Contraseña actualizada. Te mandamos un email confirmando el cambio.' }
}

/**
 * Cambia el email del usuario logueado. Supabase manda mails de confirmación
 * al viejo y nuevo email — recién cuando ambos se confirman el cambio se aplica.
 */
export async function cambiarMiEmail(formData: FormData): Promise<Result> {
  const nuevo = String(formData.get('nuevo') ?? '').trim().toLowerCase()
  if (!nuevo || !nuevo.includes('@')) return { error: 'Ingresá un email válido' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }
  if (nuevo === user.email) return { error: 'Es el mismo email que tenés ahora' }

  const { error } = await supabase.auth.updateUser({ email: nuevo })
  if (error) {
    await reportarError('cuenta-cambiar-email', error, { user_id: user.id })
    return { error: error.message || 'No pudimos actualizar el email' }
  }
  return {
    ok: true,
    info: 'Te mandamos un email a la dirección nueva. Confirmá desde ahí para activarla.',
  }
}

/**
 * Inicia la inscripción de un factor TOTP. Devuelve el QR (data URI) y un
 * `factorId` que hay que usar en confirmar2FA con el primer código generado
 * por la app autenticadora.
 *
 * Si el usuario ya tiene un factor activo, devuelve error (primero hay que
 * desactivar el viejo para evitar zombies).
 */
export async function iniciarEnroll2FA(): Promise<{
  error?: string
  factorId?: string
  qr?: string
  secreto?: string
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }

  // Si ya tiene factors verificados, no permitimos enroll de uno nuevo.
  // listFactors() solo devuelve verified, así que con que haya uno alcanza.
  const { data: factores } = await supabase.auth.mfa.listFactors()
  if (factores?.totp && factores.totp.length > 0) {
    return { error: 'Ya tenés la verificación en dos pasos activada. Desactivala primero para volver a configurarla.' }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `ViandApp · ${new Date().toLocaleDateString('es-AR')}`,
  })
  if (error || !data) {
    await reportarError('mfa-enroll', error, { user_id: user.id })
    return { error: 'No pudimos generar el QR. Intentá de nuevo en un minuto.' }
  }
  return {
    factorId: data.id,
    qr: data.totp.qr_code,
    secreto: data.totp.secret,
  }
}

/**
 * Confirma la inscripción TOTP con el primer código generado por la app.
 * Después de esto el usuario va a tener que pasar por 2FA en cada login.
 */
export async function confirmarEnroll2FA(formData: FormData): Promise<Result> {
  const factorId = String(formData.get('factor_id') ?? '')
  const codigo = String(formData.get('codigo') ?? '').trim()
  if (!factorId) return { error: 'Falta el factor_id' }
  if (!/^\d{6}$/.test(codigo)) return { error: 'El código tiene 6 dígitos' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }

  const { data: challenge, error: errChallenge } = await supabase.auth.mfa.challenge({ factorId })
  if (errChallenge || !challenge) {
    return { error: 'No pudimos validar el código. Probá de nuevo.' }
  }

  const { error: errVerify } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: codigo,
  })
  if (errVerify) {
    return { error: 'El código no es correcto. Mirá la app autenticadora y reintentá.' }
  }
  return { ok: true, info: 'Verificación en dos pasos activada.' }
}

/**
 * Desactiva todos los factores TOTP del usuario. Necesita haber pasado 2FA
 * recientemente (la sesión tiene que estar en AAL2).
 */
export async function desactivar2FA(): Promise<Result> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado' }

  const { data: factores } = await supabase.auth.mfa.listFactors()
  const totp = factores?.totp ?? []
  if (totp.length === 0) return { ok: true, info: 'Ya estaba desactivada.' }

  for (const f of totp) {
    await supabase.auth.mfa.unenroll({ factorId: f.id })
  }
  return { ok: true, info: 'Verificación en dos pasos desactivada.' }
}

/**
 * Cierra todas las sesiones del usuario en otros dispositivos.
 * Útil si la persona perdió un dispositivo o cree que alguien más entró.
 */
export async function cerrarSesionesEnOtrosDispositivos(): Promise<Result> {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  if (error) return { error: 'No pudimos cerrar las sesiones. Intentá de nuevo.' }
  return { ok: true, info: 'Cerramos sesión en todos los otros dispositivos.' }
}

/**
 * Borra la cuenta del usuario logueado. Solo padres pueden auto-borrarse
 * (el staff debe ser dado de baja por un administrativo).
 * Pedimos la contraseña actual para confirmar identidad.
 *
 * Los datos asociados (hijos, pedidos, pagos) NO se borran — quedan como
 * histórico de la operación. Solo se borra el vínculo auth y la fila en
 * `usuarios`. Si el padre quiere borrado de datos personales más profundo
 * tiene que pedirlo expresamente por mail (derecho ARCO Ley 25.326).
 */
export async function borrarMiCuenta(formData: FormData): Promise<Result | void> {
  const password = String(formData.get('password') ?? '')
  if (!password) return { error: 'Confirmá con tu contraseña actual' }

  const profile = await getProfile()
  if (!profile) return { error: 'No estás autenticado' }
  if (profile.rol !== 'padre') {
    return { error: 'Solo las familias pueden auto-borrar su cuenta. Si sos parte del equipo, pedile la baja al administrativo.' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'No estás autenticado' }

  // Re-login para verificar contraseña actual.
  const { error: errLogin } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (errLogin) return { error: 'La contraseña no es correcta' }

  // Borrado via admin client. ON DELETE CASCADE de auth.users limpia la fila
  // en `usuarios` (por la FK con CASCADE en la migración 0001).
  const admin = createAdminClient()
  const { error: errDelete } = await admin.auth.admin.deleteUser(user.id)
  if (errDelete) {
    await reportarError('cuenta-borrar', errDelete, { user_id: user.id })
    return { error: 'No pudimos borrar tu cuenta. Escribinos a fmajul2@gmail.com' }
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login?borrado=1')
}

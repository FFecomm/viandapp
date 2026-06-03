'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/auth/profile'
import { reportarError } from '@/lib/reportar-error'
import { validarPasswordFuerte } from '@/lib/auth/password'

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

  return { ok: true, info: 'Contraseña actualizada.' }
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

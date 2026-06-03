'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { reportarError } from '@/lib/reportar-error'

type Result = { error?: string }

/**
 * Verifica el código de 6 dígitos generado por la app autenticadora.
 * Si pasa, la sesión sube a AAL2 y el usuario puede operar. Si no pasa,
 * mostramos el error y dejamos que reintenten.
 */
export async function verificarCodigo2FA(formData: FormData): Promise<Result | void> {
  const codigo = String(formData.get('codigo') ?? '').trim()
  if (!/^\d{6}$/.test(codigo)) return { error: 'El código tiene 6 dígitos' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No estás autenticado. Volvé a ingresar.' }

  const { data: factores } = await supabase.auth.mfa.listFactors()
  const totp = factores?.totp?.find((f) => f.status === 'verified')
  if (!totp) return { error: 'No tenés un factor TOTP activado.' }

  const { data: challenge, error: errChallenge } = await supabase.auth.mfa.challenge({ factorId: totp.id })
  if (errChallenge || !challenge) {
    await reportarError('2fa-challenge', errChallenge, { user_id: user.id })
    return { error: 'No pudimos validar el código. Probá de nuevo.' }
  }

  const { error: errVerify } = await supabase.auth.mfa.verify({
    factorId: totp.id,
    challengeId: challenge.id,
    code: codigo,
  })
  if (errVerify) {
    return { error: 'Código incorrecto. Mirá la app y reintentá.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Cancela el flujo de 2FA cerrando la sesión. Útil si el usuario perdió el
 * acceso a su app autenticadora — vuelve a /login y desde ahí puede pedir
 * help al admin (que puede desactivar el factor vía service_role).
 */
export async function cancelar2FA(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login?dos_factores_cancelado=1')
}

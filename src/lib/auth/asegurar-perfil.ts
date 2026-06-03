import { createClient } from '@/lib/supabase/server'

/**
 * Asegura que el usuario logueado tenga una fila en `usuarios`. Si no la tiene
 * (caso típico: signup por email-confirmation o login OAuth con Google), la
 * crea como 'padre' con los datos del user_metadata o un fallback.
 *
 * Idempotente: si el perfil ya existe, no hace nada.
 * Llamar después de cualquier flujo que cree la sesión (login con password,
 * verifyOtp, exchangeCodeForSession).
 */
export async function asegurarPerfilPadre(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (perfil) return

  const meta = (user.user_metadata ?? {}) as {
    nombre?: string
    full_name?: string
    name?: string
    telefono?: string
  }
  const nombre =
    meta.nombre?.trim() ||
    meta.full_name?.trim() ||
    meta.name?.trim() ||
    user.email?.split('@')[0] ||
    'Sin nombre'

  await supabase.rpc('fn_self_register_padre', {
    p_nombre: nombre,
    p_telefono: meta.telefono ?? null,
  })
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Completá email y contraseña' }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Email o contraseña incorrectos' }
  }

  // Caso post-confirmación de email: el signup creó la fila de auth pero
  // como no había sesión, no se pudo crear el perfil. Lo creamos ahora si falta.
  if (data.user) {
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle()
    if (!perfil) {
      const meta = (data.user.user_metadata ?? {}) as { nombre?: string; telefono?: string }
      const nombre = meta.nombre?.trim() || (data.user.email?.split('@')[0] ?? 'Sin nombre')
      await supabase.rpc('fn_self_register_padre', {
        p_nombre: nombre,
        p_telefono: meta.telefono ?? null,
      })
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

/**
 * Devuelve el perfil del usuario autenticado, o null si no hay sesión o
 * no existe fila en `usuarios` (ej: cuenta de auth creada sin perfil).
 *
 * Cacheado por request para evitar múltiples roundtrips a Supabase en una misma render.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, activo')
    .eq('id', user.id)
    .maybeSingle()

  if (!data || !data.activo) return null
  return data as Profile
})

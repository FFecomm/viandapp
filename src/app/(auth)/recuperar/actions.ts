'use server'

import { createClient } from '@/lib/supabase/server'

export async function pedirRecupero(formData: FormData): Promise<{ ok?: true; error?: string }> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { error: 'Ingresá tu email' }

  const supabase = createClient()
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/recuperar/nueva-clave`,
  })

  // Por seguridad, devolvemos OK aunque el email no exista (no leak de cuentas).
  if (error) {
    console.error('[recuperar] error:', error.message)
  }
  return { ok: true }
}

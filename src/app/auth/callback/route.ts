import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { asegurarPerfilPadre } from '@/lib/auth/asegurar-perfil'

/**
 * Callback de Supabase Auth. Soporta dos flujos:
 *  - PKCE: ?code=... → exchangeCodeForSession (OAuth, magic link disparado client-side)
 *  - OTP : ?token_hash=...&type=... → verifyOtp (recuperación de contraseña,
 *    confirmación de email — más robusto porque no necesita verifier en cookies).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = url.searchParams.get('next') ?? '/'

  const supabase = createClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      // El flujo OTP también puede traer signup confirmations: asegurar perfil.
      if (type === 'signup' || type === 'email') {
        await asegurarPerfilPadre()
      }
      return NextResponse.redirect(`${url.origin}${next}`)
    }
    console.error('[auth/callback] verifyOtp falló:', error.message)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // OAuth (Google) y signups por PKCE crean sesión sin pasar por nuestro
      // login action: aseguramos el perfil acá.
      await asegurarPerfilPadre()
      return NextResponse.redirect(`${url.origin}${next}`)
    }
    console.error('[auth/callback] exchangeCodeForSession falló:', error.message)
  }

  return NextResponse.redirect(`${url.origin}/login?auth_error=1`)
}

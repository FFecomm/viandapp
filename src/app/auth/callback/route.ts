import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Callback de Supabase Auth para flujo PKCE (recuperación de contraseña,
 * confirmación de email, magic link). Intercambia el ?code= por una sesión
 * y redirige a `next`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${url.origin}${next}`)
    }
    console.error('[auth/callback] exchange falló:', error.message)
  }

  return NextResponse.redirect(`${url.origin}/login?auth_error=1`)
}

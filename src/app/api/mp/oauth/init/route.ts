import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { mpClientId, mpOAuthUrl } from '@/lib/mercadopago'

const STATE_COOKIE = 'mp_oauth_state'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle()
  const rol = (perfil as { rol?: string } | null)?.rol
  if (rol !== 'administrativo') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (!mpClientId()) {
    return NextResponse.json({ error: 'MP_CLIENT_ID no configurado' }, { status: 500 })
  }

  const state = crypto.randomBytes(16).toString('hex')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin
  const redirectUri = `${baseUrl}/api/mp/oauth/callback`
  const url = mpOAuthUrl(state, redirectUri)

  const res = NextResponse.redirect(url)
  // Cookie httpOnly de 10 minutos para validar el callback contra CSRF.
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  })
  return res
}

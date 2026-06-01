import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mpExchangeCode } from '@/lib/mercadopago'

const STATE_COOKIE = 'mp_oauth_state'

function redirectConEstado(req: Request, estado: 'ok' | 'error', detalle?: string) {
  const url = new URL('/credito', req.url)
  url.searchParams.set('mp', estado)
  if (detalle) url.searchParams.set('detalle', detalle)
  return NextResponse.redirect(url)
}

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

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) return redirectConEstado(req, 'error', error)
  if (!code || !state) return redirectConEstado(req, 'error', 'faltan_params')

  const cookieState = req.headers.get('cookie')?.match(/mp_oauth_state=([^;]+)/)?.[1]
  if (!cookieState || cookieState !== state) {
    return redirectConEstado(req, 'error', 'state_mismatch')
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin
  const redirectUri = `${baseUrl}/api/mp/oauth/callback`

  try {
    const token = await mpExchangeCode(code, redirectUri)
    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

    const admin = createAdminClient()
    const { error: upsertError } = await admin
      .from('mp_conexion')
      .upsert(
        {
          nombre: 'principal',
          mp_user_id: String(token.user_id),
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          public_key: token.public_key,
          expires_at: expiresAt,
          conectado_por: user.id,
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: 'mp_user_id' },
      )
    if (upsertError) {
      return redirectConEstado(req, 'error', upsertError.message)
    }

    const res = redirectConEstado(req, 'ok')
    res.cookies.delete(STATE_COOKIE)
    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'desconocido'
    return redirectConEstado(req, 'error', msg)
  }
}

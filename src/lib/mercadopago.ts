import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'

const MP_OAUTH_BASE = 'https://auth.mercadopago.com.ar/authorization'
const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token'

export const COMISION_POR_VIANDA = Number(process.env.COMISION_POR_VIANDA ?? 400)

export function mpClientId(): string | null {
  return process.env.MP_CLIENT_ID ?? null
}

function mpClientSecret(): string | null {
  return process.env.MP_CLIENT_SECRET ?? null
}

/**
 * URL para iniciar la autorización OAuth.
 * @param state nonce para validar el callback
 * @param redirectUri URL absoluta del callback
 */
export function mpOAuthUrl(state: string, redirectUri: string): string {
  const clientId = mpClientId()
  if (!clientId) throw new Error('MP_CLIENT_ID no configurado')
  const url = new URL(MP_OAUTH_BASE)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('platform_id', 'mp')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  return url.toString()
}

type TokenResponse = {
  access_token: string
  refresh_token: string
  user_id: number | string
  public_key: string
  expires_in: number  // segundos
  token_type: string
}

/**
 * Intercambia un code por tokens. Llamado desde el callback.
 */
export async function mpExchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
  const clientId = mpClientId()
  const clientSecret = mpClientSecret()
  if (!clientId || !clientSecret) throw new Error('MP_CLIENT_ID o MP_CLIENT_SECRET no configurados')

  const res = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MP token exchange falló: ${res.status} ${text}`)
  }
  return (await res.json()) as TokenResponse
}

/**
 * Refresca un token expirado usando el refresh_token.
 */
async function mpRefreshToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = mpClientId()
  const clientSecret = mpClientSecret()
  if (!clientId || !clientSecret) throw new Error('MP_CLIENT_ID o MP_CLIENT_SECRET no configurados')

  const res = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MP refresh falló: ${res.status} ${text}`)
  }
  return (await res.json()) as TokenResponse
}

type ConexionMp = {
  id: string
  mp_user_id: string
  access_token: string
  refresh_token: string
  public_key: string | null
  expires_at: string
}

/**
 * Devuelve la conexión MP activa con el token vigente. Si está por vencer, lo refresca.
 * Retorna null si no hay conexión.
 */
export async function obtenerConexionMpActiva(): Promise<ConexionMp | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('mp_conexion')
    .select('id, mp_user_id, access_token, refresh_token, public_key, expires_at')
    .order('actualizado_en', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null

  const c = data as ConexionMp
  const expira = new Date(c.expires_at).getTime()
  const enMenosDeUnDia = Date.now() > expira - 24 * 60 * 60 * 1000

  if (enMenosDeUnDia) {
    try {
      const fresh = await mpRefreshToken(c.refresh_token)
      const expiresAt = new Date(Date.now() + fresh.expires_in * 1000).toISOString()
      await supabase
        .from('mp_conexion')
        .update({
          access_token: fresh.access_token,
          refresh_token: fresh.refresh_token,
          public_key: fresh.public_key,
          expires_at: expiresAt,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', c.id)
      return {
        ...c,
        access_token: fresh.access_token,
        refresh_token: fresh.refresh_token,
        public_key: fresh.public_key,
        expires_at: expiresAt,
      }
    } catch (e) {
      console.error('[mp] no se pudo refrescar el token, uso el actual:', e)
    }
  }

  return c
}

/**
 * Crea un cliente de MP usando el access_token del colegio conectado (no la env var).
 * Tira si no hay conexión configurada.
 */
async function clientFromActiveConnection(): Promise<MercadoPagoConfig> {
  const conexion = await obtenerConexionMpActiva()
  if (!conexion) throw new Error('No hay una conexión de Mercado Pago activa')
  return new MercadoPagoConfig({ accessToken: conexion.access_token })
}

export async function preferenceClient(): Promise<Preference> {
  return new Preference(await clientFromActiveConnection())
}

export async function paymentClient(): Promise<Payment> {
  return new Payment(await clientFromActiveConnection())
}

export function tieneMpOAuthConfigurado(): boolean {
  return Boolean(mpClientId() && mpClientSecret())
}

/**
 * Indica si hay una conexión MP activa (un colegio que ya autorizó vía OAuth).
 */
export async function tieneMpConectado(): Promise<boolean> {
  const c = await obtenerConexionMpActiva()
  return Boolean(c)
}

// Compatibilidad hacia atrás: algunas pantallas viejas usaban este check.
export function tieneMpConfigurado(): boolean {
  return tieneMpOAuthConfigurado()
}

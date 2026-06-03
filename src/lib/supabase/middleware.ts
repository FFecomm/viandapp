import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const isAuthRoute = path.startsWith('/login') || path.startsWith('/registro') || path.startsWith('/bienvenida') || path.startsWith('/confirmar-email') || path.startsWith('/recuperar') || path.startsWith('/dos-factores')
  const isLegalRoute = path.startsWith('/politica-privacidad') || path.startsWith('/terminos')
  const isPublic = isAuthRoute || isLegalRoute || path.startsWith('/api/pagos/webhook') || path.startsWith('/auth/callback') || path.startsWith('/_next') || path === '/manifest.webmanifest' || path === '/sw.js' || path === '/icon.svg' || path.startsWith('/icon-') || path === '/apple-icon.png'

  // Rutas que permitimos aunque el usuario esté autenticado (no lo redirigimos
  // a `/` desde acá). Caso típico: el padre apretó "recuperar contraseña" estando
  // logueado vía el link del mail — necesita poder cambiar la clave.
  const permitirAunqueLogueado = path.startsWith('/recuperar/nueva-clave') || path.startsWith('/dos-factores')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    // Sin sesión, los visitantes que entran al root van a la bienvenida;
    // cualquier otra ruta protegida los manda al login.
    url.pathname = path === '/' ? '/bienvenida' : '/login'
    return NextResponse.redirect(url)
  }

  // Defensa en profundidad: si el usuario fue desactivado por un admin pero
  // todavía tiene token válido, cerramos su sesión en cuanto vuelva a pegar al
  // server. Sin este check podría seguir navegando hasta que se le venza el JWT.
  if (user) {
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('activo')
      .eq('id', user.id)
      .maybeSingle()
    const activo = (perfil as { activo?: boolean } | null)?.activo
    if (perfil && activo === false) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('desactivado', '1')
      return NextResponse.redirect(url)
    }
  }

  if (user && isAuthRoute && !permitirAunqueLogueado) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // MFA: si el usuario tiene 2FA activado y la sesión está en AAL1
  // (logueado con password pero no completó el código TOTP), forzar el paso
  // por /dos-factores antes de dejar entrar a cualquier ruta protegida.
  // No bloqueamos /dos-factores ni recursos estáticos para no caer en loops.
  if (user && !isPublic) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel === 'aal1') {
      const url = request.nextUrl.clone()
      url.pathname = '/dos-factores'
      return NextResponse.redirect(url)
    }
  }

  return response
}

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

  const isAuthRoute = path.startsWith('/login') || path.startsWith('/registro') || path.startsWith('/bienvenida') || path.startsWith('/confirmar-email') || path.startsWith('/recuperar')
  const isLegalRoute = path.startsWith('/politica-privacidad') || path.startsWith('/terminos')
  const isPublic = isAuthRoute || isLegalRoute || path.startsWith('/api/pagos/webhook') || path.startsWith('/auth/callback') || path.startsWith('/_next') || path === '/manifest.webmanifest' || path === '/sw.js' || path === '/icon.svg' || path.startsWith('/icon-') || path === '/apple-icon.png'

  // Rutas que permitimos aunque el usuario esté autenticado (no lo redirigimos
  // a `/` desde acá). Caso típico: el padre apretó "recuperar contraseña" estando
  // logueado vía el link del mail — necesita poder cambiar la clave.
  const permitirAunqueLogueado = path.startsWith('/recuperar/nueva-clave')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    // Sin sesión, los visitantes que entran al root van a la bienvenida;
    // cualquier otra ruta protegida los manda al login.
    url.pathname = path === '/' ? '/bienvenida' : '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute && !permitirAunqueLogueado) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

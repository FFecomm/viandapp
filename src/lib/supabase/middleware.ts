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

  const isAuthRoute = path.startsWith('/login') || path.startsWith('/registro') || path.startsWith('/bienvenida') || path.startsWith('/confirmar-email')
  const isPublic = isAuthRoute || path.startsWith('/api/pagos/webhook') || path.startsWith('/_next') || path === '/manifest.webmanifest' || path === '/sw.js' || path === '/icon.svg' || path.startsWith('/icon-') || path === '/apple-icon.png'

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    // Sin sesión, los visitantes que entran al root van a la bienvenida;
    // cualquier otra ruta protegida los manda al login.
    url.pathname = path === '/' ? '/bienvenida' : '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match todas las rutas excepto:
     * - _next/static, _next/image (assets)
     * - favicon, manifest, sw, iconos (PWA y branding)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icon.svg|icon-.*|apple-icon.png).*)',
  ],
}

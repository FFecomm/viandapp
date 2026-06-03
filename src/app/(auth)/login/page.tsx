import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { LoginForm } from './login-form'

type SearchParams = {
  desactivado?: string
  borrado?: string
  auth_error?: string
  dos_factores_cancelado?: string
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await getProfile()
  if (profile) redirect('/')

  const aviso =
    searchParams.desactivado === '1'
      ? { tono: 'warning' as const, texto: 'Tu cuenta está desactivada. Si creés que es un error, contactá al administrativo.' }
      : searchParams.borrado === '1'
        ? { tono: 'info' as const, texto: 'Tu cuenta fue eliminada. Si querés volver, registrate de nuevo.' }
        : searchParams.auth_error === '1'
          ? { tono: 'warning' as const, texto: 'El link expiró o ya fue usado. Pedí uno nuevo desde "Olvidaste tu contraseña".' }
          : searchParams.dos_factores_cancelado === '1'
            ? { tono: 'info' as const, texto: 'Cancelaste el segundo paso. Si perdiste el acceso a tu app autenticadora, pedile al administrativo que la desactive.' }
            : null

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">ViandApp</h1>
          <p className="text-sm text-muted-foreground">Entrá con tu cuenta</p>
        </div>
        {aviso ? (
          <div
            role="alert"
            className={
              aviso.tono === 'warning'
                ? 'rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900'
                : 'rounded-xl border bg-card p-3 text-sm'
            }
          >
            {aviso.texto}
          </div>
        ) : null}
        <LoginForm googleHabilitado={process.env.NEXT_PUBLIC_GOOGLE_AUTH === '1'} />
        <div className="space-y-2 text-sm text-center text-muted-foreground">
          <p>
            <Link href="/recuperar" className="text-primary font-medium">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p>
            ¿No tenés cuenta?{' '}
            <Link href="/registro" className="text-primary font-medium">
              Registrate
            </Link>
          </p>
        </div>
        <p className="text-xs text-center text-muted-foreground pt-2">
          Al entrar aceptás los{' '}
          <Link href="/terminos" className="underline">Términos</Link>{' '}y la{' '}
          <Link href="/politica-privacidad" className="underline">Política de Privacidad</Link>.
        </p>
      </div>
    </main>
  )
}

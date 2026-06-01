import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const profile = await getProfile()
  if (profile) redirect('/')

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">ViandApp</h1>
          <p className="text-sm text-muted-foreground">Entrá con tu cuenta</p>
        </div>
        <LoginForm />
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

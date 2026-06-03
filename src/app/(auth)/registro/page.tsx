import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/profile'
import { RegistroForm } from './registro-form'

export default async function RegistroPage() {
  const profile = await getProfile()
  if (profile) redirect('/')

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Para padres y tutores. Después vinculás a tus hijos.
          </p>
        </div>
        <RegistroForm googleHabilitado={process.env.NEXT_PUBLIC_GOOGLE_AUTH === '1'} />
        <p className="text-sm text-center text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-primary font-medium">
            Entrá
          </Link>
        </p>
      </div>
    </main>
  )
}

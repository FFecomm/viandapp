import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DosFactoresForm } from './dos-factores-form'

export default async function DosFactoresPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Si ya está en AAL2, no necesitamos pedir nada.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === 'aal2') redirect('/')

  // Si no tiene factor verificado, no debería estar acá — lo mandamos al home.
  const { data: factores } = await supabase.auth.mfa.listFactors()
  const tieneTotp = factores?.totp?.some((f) => f.status === 'verified')
  if (!tieneTotp) redirect('/')

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Verificación en dos pasos</h1>
          <p className="text-sm text-muted-foreground">
            Abrí tu app autenticadora y copiá el código de 6 dígitos.
          </p>
        </div>
        <DosFactoresForm />
      </div>
    </main>
  )
}

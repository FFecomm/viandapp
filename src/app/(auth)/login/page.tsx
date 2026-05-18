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
      </div>
    </main>
  )
}

import Link from 'next/link'
import { RecuperarForm } from './recuperar-form'

export default function RecuperarPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Te mandamos un link a tu email para crear una nueva.
          </p>
        </div>
        <RecuperarForm />
        <p className="text-sm text-center text-muted-foreground">
          <Link href="/login" className="text-primary font-medium">
            Volver al login
          </Link>
        </p>
      </div>
    </main>
  )
}

import Link from 'next/link'
import { NuevaClaveForm } from './nueva-clave-form'

export default function NuevaClavePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Elegí una contraseña nueva para tu cuenta.
          </p>
        </div>
        <NuevaClaveForm />
        <p className="text-sm text-center text-muted-foreground">
          <Link href="/login" className="text-primary font-medium">
            Cancelar y volver al login
          </Link>
        </p>
      </div>
    </main>
  )
}

import Link from 'next/link'
import { Mail } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SearchParams = { email?: string }

export default function ConfirmarEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const email = searchParams.email ?? ''

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="size-20 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <Mail className="size-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Confirmá tu email</h1>
          <p className="text-muted-foreground">
            Te mandamos un mail{email ? <> a <span className="font-medium text-foreground">{email}</span></> : null}{' '}
            con un link para activar tu cuenta. Una vez que lo abrás, volvé y entrá normalmente.
          </p>
        </div>
        <div className="space-y-2">
          <Link href="/login" className={cn(buttonVariants(), 'w-full h-12 text-base')}>
            Ir al inicio de sesión
          </Link>
          <p className="text-xs text-muted-foreground">
            ¿No te llegó? Revisá la carpeta de spam o probá volver a registrarte.
          </p>
        </div>
      </div>
    </main>
  )
}

import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <div className="p-6 max-w-md mx-auto space-y-4 text-center">
      <h1 className="text-xl font-semibold">No encontramos lo que buscabas</h1>
      <p className="text-sm text-muted-foreground">
        Esta página no existe o se movió a otro lugar.
      </p>
      <Link href="/pedidos" className={cn(buttonVariants(), 'h-11')}>
        Volver al inicio
      </Link>
    </div>
  )
}

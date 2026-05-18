import { getProfile } from '@/lib/auth/profile'
import { logout } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'

export default async function PedidosPage() {
  const profile = await getProfile()
  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {profile?.nombre.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">Pedidos del día (placeholder — Tarea 7)</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" className="h-10">Salir</Button>
        </form>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Acá va la lista de pedidos.
      </div>
    </main>
  )
}

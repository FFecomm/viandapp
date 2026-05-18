import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth/profile'
import { puedeEscribirProductos } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ProductoRow } from './producto-row'
import { NuevoProductoForm } from './nuevo-producto-form'

export default async function ProductosPage() {
  const profile = await getProfile()
  if (!profile || !puedeEscribirProductos(profile.rol)) {
    redirect('/pedidos')
  }

  const supabase = createClient()
  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre, precio, categoria, activo')
    .order('activo', { ascending: false })
    .order('nombre')

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Productos"
        subtitle="Bebidas y extras que se pueden sumar al pedido"
      />

      {!productos?.length ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Todavía no hay productos. Cargá el primero abajo.
        </div>
      ) : (
        <ul className="space-y-2">
          {productos.map((p) => (
            <li key={p.id}>
              <ProductoRow producto={p} />
            </li>
          ))}
        </ul>
      )}

      <NuevoProductoForm />
    </div>
  )
}

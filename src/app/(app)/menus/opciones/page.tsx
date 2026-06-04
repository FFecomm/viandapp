import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { OpcionesMenu, type OpcionRow } from './opciones-cliente'

const MENUS = ['A', 'B', 'C', 'Hamburguesa', 'Fideos', 'Sandwich'] as const

export default async function OpcionesPage() {
  await requireRole(['administrativo'])
  const supabase = createClient()

  const { data } = await supabase
    .from('menu_opciones')
    .select('id, menu, texto, orden, activa')
    .order('menu')
    .order('orden')

  const opciones = (data ?? []) as OpcionRow[]
  const porMenu = new Map<string, OpcionRow[]>()
  for (const m of MENUS) porMenu.set(m, [])
  for (const op of opciones) {
    const arr = porMenu.get(op.menu) ?? []
    arr.push(op)
    porMenu.set(op.menu, arr)
  }

  return (
    <div className="p-5 space-y-5 max-w-3xl mx-auto">
      <Link href="/menus" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver a menús
      </Link>
      <PageHeader
        title="Opciones por menú"
        subtitle="Las familias eligen entre estas opciones en lugar de escribir observaciones."
      />

      <div className="space-y-6">
        {MENUS.map((menu) => (
          <OpcionesMenu key={menu} menu={menu} opciones={porMenu.get(menu) ?? []} />
        ))}
      </div>
    </div>
  )
}

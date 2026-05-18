import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { MenuCell } from './menu-cell'

type MenuRow = { id: string; dia_ciclo: number; tipo_menu: 'A' | 'B' | 'C'; descripcion: string }

export default async function MenusPage() {
  await requireRole(['administrativo'])
  const supabase = createClient()

  const { data } = await supabase
    .from('menu_ciclo')
    .select('id, dia_ciclo, tipo_menu, descripcion')
    .order('dia_ciclo')
    .order('tipo_menu')

  const menus = (data ?? []) as MenuRow[]
  const dias = Array.from(new Set(menus.map((m) => m.dia_ciclo))).sort((a, b) => a - b)

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Menús del ciclo"
        subtitle="14 días × 3 tipos. Se repiten cada 2 semanas."
      />

      <div className="space-y-4">
        {dias.map((dia) => {
          const delDia = menus.filter((m) => m.dia_ciclo === dia)
          return (
            <section key={dia} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Día {dia}</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {delDia.map((m) => (
                  <MenuCell key={m.id} menu={{ id: m.id, tipo_menu: m.tipo_menu, descripcion: m.descripcion }} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

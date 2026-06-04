import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { NuevoPedidoWizard } from './wizard'

export default async function NuevoPedidoPage() {
  const profile = await requireRole(['operadora', 'administrativo', 'encargada'])
  const volverHref = profile.rol === 'encargada' ? '/encargada' : '/pedidos'

  const supabase = createClient()
  const [{ data: alumnos }, { data: menus }, { data: config }] = await Promise.all([
    supabase
      .from('alumnos')
      .select('id, nombre_completo, grado, division, credito_pesos, viandas_credito')
      .eq('activo', true)
      .order('nombre_completo')
      .limit(500),
    supabase
      .from('menu_ciclo')
      .select('dia_ciclo, tipo_menu, descripcion')
      .order('dia_ciclo'),
    supabase
      .from('configuracion')
      .select('value')
      .eq('key', 'precio_vianda_actual')
      .maybeSingle(),
  ])

  return (
    <div className="p-5 space-y-4">
      <Link href={volverHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Volver
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Cargar pedido</h1>
      <NuevoPedidoWizard
        alumnos={(alumnos ?? []) as never}
        menus={(menus ?? []) as never}
        precioVianda={Number(config?.value ?? 9500)}
        volverHref={volverHref}
      />
    </div>
  )
}

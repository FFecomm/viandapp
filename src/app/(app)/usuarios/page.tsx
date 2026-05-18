import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/roles'
import { PageHeader } from '@/components/page-header'
import { UsuariosClient } from './usuarios-client'

export default async function UsuariosPage() {
  const me = await requireRole(['administrativo'])
  const supabase = createClient()

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, activo, created_at')
    .order('created_at')

  return (
    <div className="p-5 space-y-5">
      <PageHeader
        title="Usuarios"
        subtitle="Cuentas que pueden entrar a la app"
      />
      <UsuariosClient
        usuarios={(usuarios ?? []) as { id: string; nombre: string; rol: 'operadora' | 'encargada' | 'administrativo'; activo: boolean }[]}
        meId={me.id}
      />
    </div>
  )
}

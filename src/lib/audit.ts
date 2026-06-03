import { createAdminClient } from '@/lib/supabase/admin'
import { reportarError } from '@/lib/reportar-error'

type AuditInput = {
  actor_id: string
  accion: string
  recurso_tipo: string
  recurso_id?: string | null
  detalle?: Record<string, unknown> | null
  ip?: string | null
  user_agent?: string | null
}

/**
 * Registra una entrada de auditoría. Best-effort: si falla, no rompe la
 * operación principal pero notifica al canal de errores.
 * Usar SOLO en server actions / API routes con identidad ya validada.
 */
export async function registrarAudit(entrada: AuditInput): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: entrada.actor_id,
    accion: entrada.accion,
    recurso_tipo: entrada.recurso_tipo,
    recurso_id: entrada.recurso_id ?? null,
    detalle: entrada.detalle ?? null,
    ip: entrada.ip ?? null,
    user_agent: entrada.user_agent ?? null,
  })
  if (error) {
    await reportarError('audit-insert', error, { accion: entrada.accion, recurso_tipo: entrada.recurso_tipo })
  }
}

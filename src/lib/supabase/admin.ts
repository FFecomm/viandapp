import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Cliente con service-role key. SOLO usar server-side.
 * Bypasa RLS, así que SIEMPRE verificar autorización antes de invocar.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Falta configurar SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

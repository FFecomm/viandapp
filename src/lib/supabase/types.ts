// Tipos generados con `npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`
// Hasta tener un proyecto Supabase real, esta versión es permisiva (Tables tipados sin shape estricto).
// Regenerar después de aplicar las migraciones para tipos estrictos.

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[]

type AnyTable = { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any>; Relationships: [] }

export interface Database {
  public: {
    Tables: { [k: string]: AnyTable }
    Views: { [k: string]: { Row: Record<string, any>; Relationships: [] } }
    Functions: { [k: string]: { Args: Record<string, any>; Returns: any } }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// Tipos de dominio frecuentes (manuales hasta tener generación automática).

export type Rol = 'operadora' | 'encargada' | 'administrativo' | 'padre'

export type Profile = {
  id: string
  nombre: string
  rol: Rol
  activo: boolean
}

export type FormaPago = 'credito' | 'transferencia' | 'efectivo' | 'a_deber'

export type TipoMenu = 'A' | 'B' | 'C' | 'Hamburguesa' | 'Fideos' | 'Sandwich'

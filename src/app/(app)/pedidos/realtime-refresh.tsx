'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Suscribe a cambios en `pedidos` para la fecha mostrada y refresca la página.
 * Refresh server-side recarga la query con los datos actualizados.
 */
export function RealtimeRefresh({ fecha }: { fecha: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`pedidos_${fecha}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `fecha=eq.${fecha}` },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedido_productos' },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fecha, router])

  return null
}

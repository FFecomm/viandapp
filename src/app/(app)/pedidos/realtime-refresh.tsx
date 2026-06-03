'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Suscribe a cambios en `pedidos` para la fecha mostrada y refresca la página.
 * Refresh server-side recarga la query con los datos actualizados.
 *
 * Solo escuchamos `pedidos` (con filtro de fecha). NO escuchamos
 * `pedido_productos` porque Supabase Realtime no permite filtrar por la fecha
 * del pedido padre — sin filtro, cada cambio de producto en CUALQUIER día
 * histórico forzaría refresh, lo que tira muchísima carga en celulares
 * (especialmente en la operadora con la página abierta todo el día).
 * En la práctica, agregar/quitar productos de un pedido también actualiza el
 * `updated_at` de `pedidos`, así que el evento llega por esta vía.
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fecha, router])

  return null
}

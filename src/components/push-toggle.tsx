'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export function PushToggle({ publicKey }: { publicKey: string | null }) {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [activo, setActivo] = useState<boolean>(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    setSupported(Boolean(ok))
    if (!ok) return

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setActivo(Boolean(sub)))
      .catch(() => setActivo(false))
  }, [])

  if (supported === false) return null
  if (!publicKey) return null

  function activar() {
    startTransition(async () => {
      try {
        if (Notification.permission === 'denied') {
          toast.error('Las notificaciones están bloqueadas en este navegador')
          return
        }
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          toast.error('Necesitamos permiso para mandarte notificaciones')
          return
        }
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey!) as BufferSource,
        })
        const res = await fetch('/api/notificaciones/suscribir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error ?? 'Error al guardar la suscripción')
        }
        setActivo(true)
        toast.success('Notificaciones activadas')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'No se pudo activar')
      }
    })
  }

  function desactivar() {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          const endpoint = sub.endpoint
          await sub.unsubscribe()
          await fetch('/api/notificaciones/desuscribir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint }),
          })
        }
        setActivo(false)
        toast.success('Notificaciones desactivadas')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'No se pudo desactivar')
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={activo ? desactivar : activar}
      disabled={pending}
      className="h-9"
    >
      {activo ? <BellOff className="size-4" /> : <Bell className="size-4" />}
      {pending ? '…' : activo ? 'Desactivar avisos' : 'Activar avisos'}
    </Button>
  )
}

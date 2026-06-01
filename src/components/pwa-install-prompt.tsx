'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'viandapp:pwa-install-dismissed-at'
const DISMISS_DAYS = 14  // Si rechazaste, no preguntamos por 2 semanas.

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // No mostrar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((navigator as Navigator & { standalone?: boolean }).standalone) return

    // Respetar dismiss reciente
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      const age = Date.now() - Number(dismissed)
      if (age < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  async function instalar() {
    if (!deferred) return
    setInstalling(true)
    try {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'dismissed') {
        localStorage.setItem(STORAGE_KEY, String(Date.now()))
      }
    } finally {
      setDeferred(null)
      setVisible(false)
      setInstalling(false)
    }
  }

  function descartar() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!visible || !deferred) return null

  return (
    <div className="rounded-xl border bg-card p-4 text-sm shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-medium">Agregá ViandApp a tu pantalla de inicio</p>
          <p className="text-muted-foreground mt-0.5">
            Más rápido y cómodo, como una app nativa.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={instalar} disabled={installing}>
              <Download className="size-4" />
              {installing ? 'Instalando…' : 'Instalar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={descartar}>
              Después
            </Button>
          </div>
        </div>
        <button
          aria-label="Cerrar"
          onClick={descartar}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

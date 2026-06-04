'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'viandapp:pwa-install-dismissed-at'
const DISMISS_DAYS = 14

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  if ((navigator as Navigator & { standalone?: boolean }).standalone) return true
  return false
}

function detectIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const esIOS = /iPhone|iPad|iPod/i.test(ua)
  // Safari es el único que soporta "Agregar a Inicio" en iOS. Chrome / Firefox /
  // Edge en iOS también van con WebKit pero no tienen la opción de instalar.
  const noEsOtroNavegador = !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/i.test(ua)
  return esIOS && noEsOtroNavegador
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [modo, setModo] = useState<'oculto' | 'android' | 'ios'>('oculto')
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      const age = Date.now() - Number(dismissed)
      if (age < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    if (detectIOSSafari()) {
      setModo('ios')
      return
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setModo('android')
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  async function instalarAndroid() {
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
      setModo('oculto')
      setInstalling(false)
    }
  }

  function descartar() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setModo('oculto')
  }

  if (modo === 'oculto') return null

  if (modo === 'ios') {
    return (
      <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 text-sm shadow-sm relative">
        <button
          aria-label="Cerrar"
          onClick={descartar}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <p className="font-medium pr-6">📱 Tené ViandApp como app en tu iPhone</p>
        <p className="text-muted-foreground mt-1">
          Se abre más rápido, en pantalla completa y con su propio ícono. 3 pasos:
        </p>
        <ol className="mt-3 space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="size-5 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </span>
            <span>
              Tocá los <strong>•••</strong> abajo a la derecha (al lado del URL)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="size-5 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </span>
            <span>
              Tocá{' '}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-xs font-medium">
                <Plus className="size-3" /> Agregar a Inicio
              </span>
              {' '}(o primero{' '}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-xs font-medium">
                <Share className="size-3" /> Compartir
              </span>
              )
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="size-5 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </span>
            <span>Tocá <strong>Agregar</strong> arriba a la derecha</span>
          </li>
        </ol>
        <Button size="sm" variant="ghost" onClick={descartar} className="mt-3">
          Después
        </Button>
      </div>
    )
  }

  // Android / desktop
  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card p-4 text-sm shadow-sm relative">
      <button
        aria-label="Cerrar"
        onClick={descartar}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <p className="font-medium pr-6">📱 Tené ViandApp como app</p>
      <p className="text-muted-foreground mt-0.5">
        Se abre más rápido y con su propio ícono en tu pantalla de inicio.
      </p>
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={instalarAndroid} disabled={installing}>
          <Download className="size-4" />
          {installing ? 'Instalando…' : 'Instalar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={descartar}>
          Después
        </Button>
      </div>
    </div>
  )
}

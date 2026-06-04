'use client'

import { useState } from 'react'
import { Smartphone, Share, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/**
 * Botón siempre visible que abre un instructivo con los pasos para
 * instalar ViandApp como app en iPhone (Safari) y Android (Chrome).
 * Lo usamos en login y bienvenida porque la detección automática
 * (beforeinstallprompt en Android, sniff de UA en iOS) falla en algunos
 * navegadores. Este link garantiza que cualquiera pueda encontrar las
 * instrucciones.
 */
export function InstalarAppLink() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 text-sm text-primary font-medium py-2"
          >
            <Smartphone className="size-4" />
            Instalar como app en tu celular
          </button>
        }
      />
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Instalá ViandApp como app</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2 text-sm">
          <p className="text-muted-foreground">
            Tenela en tu pantalla de inicio, abre más rápido y se ve igual a una app nativa.
          </p>

          <section className="space-y-2 rounded-xl border p-4 bg-card">
            <p className="font-medium">📱 iPhone (Safari)</p>
            <ol className="space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tocá los <strong>•••</strong> abajo a la derecha del URL en Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  En el menú que aparece, buscá y tocá{' '}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-xs font-medium">
                    <Plus className="size-3" /> Agregar a Inicio
                  </span>
                  .
                  <br />
                  <span className="text-xs text-muted-foreground">
                    (En algunos iPhones tenés que tocar primero{' '}
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-muted text-xs font-medium">
                      <Share className="size-3" /> Compartir
                    </span>
                    {' '}y después buscar la opción)
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tocá <strong>Agregar</strong> arriba a la derecha. Listo, el ícono te queda en tu pantalla de inicio.
                </span>
              </li>
            </ol>
          </section>

          <section className="space-y-2 rounded-xl border p-4 bg-card">
            <p className="font-medium">🤖 Android (Chrome)</p>
            <ol className="space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tocá el menú <strong>⋮</strong> arriba a la derecha en Chrome.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Tocá <strong>Instalar app</strong> o <strong>Agregar a pantalla de inicio</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center text-xs shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Confirmá. El ícono de ViandApp aparece en tu pantalla de inicio.
                </span>
              </li>
            </ol>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

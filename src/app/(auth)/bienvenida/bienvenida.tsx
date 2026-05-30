'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CalendarCheck, CreditCard, Sparkles, ChevronRight } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Slide = {
  icon: typeof Sparkles
  titulo: string
  texto: string
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    titulo: 'Pedí viandas desde el celular',
    texto:
      'Olvidate del cuaderno y de los grupos de WhatsApp. En 3 pasos elegís los días, el menú y confirmás.',
  },
  {
    icon: CreditCard,
    titulo: 'Pagás una vez, pedís cuando quieras',
    texto:
      'Cargás saldo con Mercado Pago — entra al instante. Cada vianda que pedís descuenta de tu saldo, sin deudas ni sustos.',
  },
  {
    icon: CalendarCheck,
    titulo: 'Estás siempre al día',
    texto:
      'Te avisamos por notificación cuando se acredita un pago, cuando confirmás un pedido o cuando se está acabando el saldo.',
  },
]

export function Bienvenida() {
  const [paso, setPaso] = useState(0)
  const slide = SLIDES[paso]
  const Icon = slide.icon
  const esUltimo = paso === SLIDES.length - 1

  return (
    <main className="min-h-screen flex flex-col p-6 bg-muted/30">
      <div className="flex-1 max-w-md mx-auto w-full flex flex-col justify-center space-y-8">
        <div className="rounded-3xl border bg-card p-8 space-y-6">
          <div className="size-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="size-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{slide.titulo}</h1>
            <p className="text-muted-foreground leading-relaxed">{slide.texto}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPaso(i)}
              className={cn(
                'h-2 rounded-full transition-all',
                i === paso ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30',
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="space-y-2">
          {esUltimo ? (
            <>
              <Link
                href="/registro"
                className={cn(buttonVariants(), 'w-full h-12 text-base')}
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full h-12 text-base')}
              >
                Ya tengo cuenta
              </Link>
            </>
          ) : (
            <>
              <Button
                onClick={() => setPaso((p) => p + 1)}
                className="w-full h-12 text-base"
              >
                Siguiente <ChevronRight className="size-4" />
              </Button>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'ghost' }), 'w-full h-12 text-base')}
              >
                Saltar
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

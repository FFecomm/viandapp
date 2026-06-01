'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BotonImprimir() {
  return (
    <Button onClick={() => window.print()} className="flex-1 h-11">
      <Printer className="size-4" />
      Imprimir / Guardar PDF
    </Button>
  )
}

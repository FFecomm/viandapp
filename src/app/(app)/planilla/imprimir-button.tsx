'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImprimirButton() {
  return (
    <Button onClick={() => window.print()} variant="outline" className="h-11">
      <Printer className="size-4" />
      Imprimir
    </Button>
  )
}

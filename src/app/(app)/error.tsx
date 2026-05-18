'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Algo no salió bien</h1>
      <p className="text-sm text-muted-foreground">
        No pudimos cargar esta pantalla. Probá de nuevo o avisanos si sigue pasando.
      </p>
      <Button onClick={reset} className="h-11">
        Reintentar
      </Button>
    </div>
  )
}

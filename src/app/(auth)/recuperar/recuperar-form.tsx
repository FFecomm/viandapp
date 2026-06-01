'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { pedirRecupero } from './actions'

export function RecuperarForm() {
  const [pending, startTransition] = useTransition()
  const [enviado, setEnviado] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await pedirRecupero(data)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setEnviado(true)
      }
    })
  }

  if (enviado) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-900">
        Si el email está registrado, te mandamos un link para crear una nueva contraseña.
        Revisá tu correo (y la carpeta de spam).
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 text-base"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full h-12 text-base">
        {pending ? 'Enviando…' : 'Enviar link'}
      </Button>
    </form>
  )
}

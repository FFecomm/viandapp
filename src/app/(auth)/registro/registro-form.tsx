'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registrar } from './actions'

export function RegistroForm() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await registrar({
        email: String(data.get('email') ?? ''),
        password: String(data.get('password') ?? ''),
        nombre: String(data.get('nombre') ?? ''),
        telefono: String(data.get('telefono') ?? ''),
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre" className="text-base">Nombre y apellido</Label>
        <Input id="nombre" name="nombre" required autoComplete="name" className="h-12 text-base" />
      </div>
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
      <div className="space-y-2">
        <Label htmlFor="telefono" className="text-base">Teléfono (opcional)</Label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          autoComplete="tel"
          className="h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="h-12 text-base"
        />
        <p className="text-xs text-muted-foreground">Mínimo 6 caracteres.</p>
      </div>
      <Button type="submit" disabled={pending} className="w-full h-12 text-base">
        {pending ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  )
}

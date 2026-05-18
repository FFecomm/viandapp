'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from './actions'

export function LoginForm() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(data)
      if (result?.error) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
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
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 text-base"
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="w-full h-12 text-base"
      >
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

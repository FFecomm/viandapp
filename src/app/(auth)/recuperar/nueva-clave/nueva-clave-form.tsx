'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { PASSWORD_HINT, PASSWORD_MIN, validarPasswordFuerte } from '@/lib/auth/password'

export function NuevaClaveForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [tieneSession, setTieneSession] = useState<boolean | null>(null)
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')

  // Supabase parsea el hash del email recovery y crea una sesión temporal.
  // Si no hay sesión, el link expiró o ya fue usado.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setTieneSession(Boolean(data.session))
    })
  }, [])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const motivo = validarPasswordFuerte(pwd)
    if (motivo) {
      toast.error(motivo)
      return
    }
    if (pwd !== pwd2) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: pwd })
      if (error) {
        toast.error(error.message || 'No se pudo cambiar la contraseña')
        return
      }
      toast.success('Contraseña actualizada')
      router.replace('/')
      router.refresh()
    })
  }

  if (tieneSession === null) {
    return <p className="text-sm text-muted-foreground text-center">Cargando…</p>
  }
  if (!tieneSession) {
    return (
      <div className="rounded-md bg-destructive/5 border border-destructive/30 p-4 text-sm text-destructive">
        Este link expiró o ya fue usado. Volvé a pedir uno nuevo desde la pantalla de recuperar contraseña.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="pwd" className="text-base">Contraseña nueva</Label>
        <Input
          id="pwd"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className="h-12 text-base"
        />
        <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pwd2" className="text-base">Repetí la contraseña</Label>
        <Input
          id="pwd2"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
          className="h-12 text-base"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full h-12 text-base">
        {pending ? 'Guardando…' : 'Guardar y entrar'}
      </Button>
    </form>
  )
}

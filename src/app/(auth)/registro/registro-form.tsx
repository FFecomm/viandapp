'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registrar } from './actions'
import { loginConGoogle } from '../login/actions'
import { PASSWORD_HINT, PASSWORD_MIN } from '@/lib/auth/password'

export function RegistroForm({ googleHabilitado = false }: { googleHabilitado?: boolean }) {
  const [pending, startTransition] = useTransition()
  const [pendingGoogle, startGoogle] = useTransition()
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
        correo_secundario: String(data.get('correo_secundario') ?? ''),
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function onGoogle() {
    startGoogle(async () => {
      const res = await loginConGoogle()
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <div className="space-y-4">
    {googleHabilitado ? (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={onGoogle}
          disabled={pendingGoogle || pending}
          className="w-full h-12 text-base gap-2"
        >
          <GoogleIcon />
          {pendingGoogle ? 'Conectando…' : 'Continuar con Google'}
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          <span>o con email</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      </>
    ) : null}
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Campo trampa para bots. Invisible para humanos (lectores de pantalla
          también lo ignoran porque está aria-hidden). */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}>
        <label htmlFor="correo_secundario">No completar este campo</label>
        <input id="correo_secundario" name="correo_secundario" type="text" tabIndex={-1} autoComplete="off" />
      </div>
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
          minLength={PASSWORD_MIN}
          className="h-12 text-base"
        />
        <p className="text-xs text-muted-foreground">{PASSWORD_HINT}</p>
      </div>
      <Button type="submit" disabled={pending || pendingGoogle} className="w-full h-12 text-base">
        {pending ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2a10.34 10.34 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.82 8.82 0 0 0 2.68-6.62Z" fill="#4285F4"/>
      <path d="M9 18a8.65 8.65 0 0 0 5.96-2.18l-2.92-2.26a5.42 5.42 0 0 1-8.06-2.84H.96v2.34A9 9 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.98 10.72a5.42 5.42 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34Z" fill="#FBBC04"/>
      <path d="M9 3.58a4.86 4.86 0 0 1 3.44 1.36l2.58-2.58A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .96 4.94l3.02 2.34A5.42 5.42 0 0 1 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

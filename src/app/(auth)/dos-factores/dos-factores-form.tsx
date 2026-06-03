'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cancelar2FA, verificarCodigo2FA } from './actions'

export function DosFactoresForm() {
  const [codigo, setCodigo] = useState('')
  const [pending, startTransition] = useTransition()
  const [pendingCancel, startCancel] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!/^\d{6}$/.test(codigo)) {
      toast.error('El código tiene 6 dígitos')
      return
    }
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await verificarCodigo2FA(fd)
      if (res?.error) toast.error(res.error)
    })
  }

  function onCancelar() {
    startCancel(async () => {
      await cancelar2FA()
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="codigo" className="text-base">Código de 6 dígitos</Label>
          <Input
            id="codigo"
            name="codigo"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            required
            autoFocus
            className="h-14 text-center text-2xl tracking-widest"
          />
        </div>
        <Button
          type="submit"
          disabled={pending || pendingCancel || codigo.length !== 6}
          className="w-full h-12 text-base"
        >
          {pending ? 'Verificando…' : 'Entrar'}
        </Button>
      </form>
      <div className="text-center">
        <button
          type="button"
          onClick={onCancelar}
          disabled={pending || pendingCancel}
          className="text-sm text-muted-foreground underline"
        >
          {pendingCancel ? 'Saliendo…' : 'Cancelar y volver al login'}
        </button>
      </div>
      <p className="text-xs text-center text-muted-foreground pt-4">
        ¿Perdiste el acceso a tu app autenticadora? Pedile al administrativo que desactive tu verificación en dos pasos desde la consola.
      </p>
    </div>
  )
}

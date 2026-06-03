'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Smartphone, KeyRound, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { confirmarEnroll2FA, desactivar2FA, iniciarEnroll2FA } from './actions'

type Estado = 'cargando' | 'desactivado' | 'enrolando' | 'activo'

export function TwoFactorSection() {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [secreto, setSecreto] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [pending, startTransition] = useTransition()

  // Estado inicial: ver si ya tiene MFA activado.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const activo = data?.totp?.some((f) => f.status === 'verified')
      setEstado(activo ? 'activo' : 'desactivado')
    }).catch(() => setEstado('desactivado'))
  }, [])

  function onIniciar() {
    startTransition(async () => {
      const res = await iniciarEnroll2FA()
      if (res.error) {
        toast.error(res.error)
        return
      }
      setFactorId(res.factorId ?? null)
      setQr(res.qr ?? null)
      setSecreto(res.secreto ?? null)
      setEstado('enrolando')
    })
  }

  function onConfirmar() {
    if (!factorId || !/^\d{6}$/.test(codigo)) {
      toast.error('El código tiene 6 dígitos')
      return
    }
    const fd = new FormData()
    fd.set('factor_id', factorId)
    fd.set('codigo', codigo)
    startTransition(async () => {
      const res = await confirmarEnroll2FA(fd)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(res.info ?? 'Verificación activada')
      setCodigo('')
      setQr(null)
      setSecreto(null)
      setFactorId(null)
      setEstado('activo')
    })
  }

  function onDesactivar() {
    if (!confirm('¿Seguro que querés desactivar la verificación en dos pasos? Tu cuenta va a ser menos segura.')) return
    startTransition(async () => {
      const res = await desactivar2FA()
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(res.info ?? 'Verificación desactivada')
      setEstado('desactivado')
    })
  }

  return (
    <section className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Smartphone className="size-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-0.5 flex-1">
          <h2 className="font-medium">Verificación en dos pasos</h2>
          <p className="text-xs text-muted-foreground">
            Cuando entres, además de la contraseña vamos a pedirte un código de 6 dígitos generado por una app autenticadora (Google Authenticator, Authy, 1Password, etc).
          </p>
        </div>
      </div>

      {estado === 'cargando' ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : null}

      {estado === 'desactivado' ? (
        <Button onClick={onIniciar} disabled={pending} variant="outline" className="w-full h-11">
          {pending ? 'Preparando…' : 'Activar verificación en dos pasos'}
        </Button>
      ) : null}

      {estado === 'enrolando' && qr ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Escaneá el QR con tu app autenticadora</p>
            <div className="flex justify-center bg-white p-3 rounded-xl border">
              <Image src={qr} alt="QR code de verificación en dos pasos" width={200} height={200} unoptimized />
            </div>
            {secreto ? (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">¿No podés escanear? Mostrá el código</summary>
                <code className="block mt-2 p-2 bg-muted rounded break-all font-mono text-xs">{secreto}</code>
              </details>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo">2. Ingresá el código de 6 dígitos que muestra la app</Label>
            <Input
              id="codigo"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="h-12 text-center tracking-widest text-lg"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEstado('desactivado')
                setQr(null)
                setSecreto(null)
                setFactorId(null)
                setCodigo('')
              }}
              disabled={pending}
              className="flex-1 h-11"
            >
              Cancelar
            </Button>
            <Button onClick={onConfirmar} disabled={pending || codigo.length !== 6} className="flex-1 h-11">
              {pending ? 'Verificando…' : 'Confirmar'}
            </Button>
          </div>
        </div>
      ) : null}

      {estado === 'activo' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
            <Check className="size-4 shrink-0" />
            <span>Verificación en dos pasos activada.</span>
          </div>
          <Button onClick={onDesactivar} disabled={pending} variant="outline" className="w-full h-11 text-destructive border-destructive/50 hover:bg-destructive/5">
            <KeyRound className="size-4" />
            Desactivar
          </Button>
        </div>
      ) : null}
    </section>
  )
}

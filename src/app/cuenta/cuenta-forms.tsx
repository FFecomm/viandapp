'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Lock, Mail, LogOut, ShieldAlert, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  borrarMiCuenta,
  cambiarMiEmail,
  cambiarMiPassword,
  cerrarSesionesEnOtrosDispositivos,
} from './actions'

export function CuentaForms({ esPadre }: { esPadre: boolean }) {
  return (
    <div className="space-y-4">
      <CardCambiarPassword />
      <CardCambiarEmail />
      <CardCerrarSesionesOtras />
      {esPadre ? <CardBorrarCuenta /> : null}
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Lock
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Icon className="size-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h2 className="font-medium">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="pt-1">{children}</div>
    </section>
  )
}

function CardCambiarPassword() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await cambiarMiPassword(fd)
      if (res.error) toast.error(res.error)
      else {
        toast.success(res.info ?? 'Contraseña actualizada')
        setOpen(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <Section
      icon={Lock}
      title="Contraseña"
      description="Cambiala cuando quieras. Vas a tener que ingresar la actual para confirmar."
    >
      {open ? (
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="actual">Contraseña actual</Label>
            <Input id="actual" name="actual" type="password" autoComplete="current-password" required className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nueva">Contraseña nueva</Label>
            <Input id="nueva" name="nueva" type="password" autoComplete="new-password" required className="h-11" />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, una letra y un número.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repetir">Repetir la nueva</Label>
            <Input id="repetir" name="repetir" type="password" autoComplete="new-password" required className="h-11" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11">
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="flex-1 h-11">
              {pending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)} className="w-full h-11">
          Cambiar contraseña
        </Button>
      )}
    </Section>
  )
}

function CardCambiarEmail() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await cambiarMiEmail(fd)
      if (res.error) toast.error(res.error)
      else {
        toast.success(res.info ?? 'Te mandamos un email a la dirección nueva.')
        setOpen(false)
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  return (
    <Section
      icon={Mail}
      title="Email"
      description="Para cambiarlo te mandamos un mail al nuevo y al actual. Tenés que confirmar desde el nuevo."
    >
      {open ? (
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nuevo">Email nuevo</Label>
            <Input id="nuevo" name="nuevo" type="email" autoComplete="email" required className="h-11" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11">
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="flex-1 h-11">
              {pending ? 'Enviando…' : 'Mandar confirmación'}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setOpen(true)} className="w-full h-11">
          Cambiar email
        </Button>
      )}
    </Section>
  )
}

function CardCerrarSesionesOtras() {
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const res = await cerrarSesionesEnOtrosDispositivos()
      if (res.error) toast.error(res.error)
      else toast.success(res.info ?? 'Sesiones cerradas')
    })
  }

  return (
    <Section
      icon={LogOut}
      title="Cerrar sesión en otros dispositivos"
      description="Si entraste desde otra compu o celular y querés sacar esa sesión, presioná acá. Tu sesión actual sigue activa."
    >
      <Button variant="outline" onClick={onClick} disabled={pending} className="w-full h-11">
        {pending ? 'Cerrando…' : 'Cerrar sesión en otros dispositivos'}
      </Button>
    </Section>
  )
}

function CardBorrarCuenta() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await borrarMiCuenta(fd)
      if (res?.error) toast.error(res.error)
      // Si todo OK, la action hace redirect; no llegamos acá.
    })
  }

  return (
    <Section
      icon={ShieldAlert}
      title="Borrar mi cuenta"
      description="Acción permanente. Tus pedidos y pagos pasados quedan como histórico de la operación, pero no vas a poder volver a entrar con este email."
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" className="w-full h-11 text-destructive border-destructive/50 hover:bg-destructive/5">
              <Trash2 className="size-4" /> Borrar mi cuenta
            </Button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Seguro que querés borrar tu cuenta?</DialogTitle>
            <DialogDescription>
              Esto borra tu acceso a ViandApp de forma permanente. Si en el futuro querés volver, vas a tener que registrarte de cero y volver a vincular tus hijos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">Confirmá con tu contraseña</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11" />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11">
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {pending ? 'Borrando…' : 'Borrar cuenta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Section>
  )
}

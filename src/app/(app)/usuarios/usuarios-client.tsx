'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Plus, Trash2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Usuario = {
  id: string
  nombre: string
  rol: 'operadora' | 'encargada' | 'administrativo'
  activo: boolean
}

const ROL_LABEL: Record<Usuario['rol'], string> = {
  operadora: 'Operadora',
  encargada: 'Encargada de salón',
  administrativo: 'Administrativo',
}

export function UsuariosClient({ usuarios, meId }: { usuarios: Usuario[]; meId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mostrarForm, setMostrarForm] = useState(false)

  function eliminar(u: Usuario) {
    if (u.id === meId) {
      toast.error('No podés borrarte a vos mismo')
      return
    }
    if (!confirm(`¿Eliminar la cuenta de ${u.nombre}? No se puede deshacer.`)) return
    startTransition(async () => {
      const res = await fetch('/api/admin/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error ?? 'No se pudo eliminar')
        return
      }
      toast.success('Cuenta eliminada')
      router.refresh()
    })
  }

  function onCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const body = {
      email: data.get('email'),
      password: data.get('password'),
      nombre: data.get('nombre'),
      rol: data.get('rol'),
    }
    startTransition(async () => {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(json.error ?? 'No se pudo crear')
        return
      }
      toast.success('Cuenta creada')
      form.reset()
      setMostrarForm(false)
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-2">
        {usuarios.map((u) => (
          <li key={u.id} className="rounded-xl border p-4 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {u.nombre} {u.id === meId && <span className="text-xs text-muted-foreground">(vos)</span>}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary">{ROL_LABEL[u.rol]}</Badge>
                {!u.activo && <Badge variant="outline">Inactivo</Badge>}
              </div>
            </div>
            <Button
              onClick={() => eliminar(u)}
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={pending || u.id === meId}
            >
              <Trash2 className={cn('size-4', u.id === meId ? 'text-muted-foreground' : 'text-destructive')} />
            </Button>
          </li>
        ))}
      </ul>

      {!mostrarForm ? (
        <Button onClick={() => setMostrarForm(true)} className="w-full h-12 text-base">
          <Plus className="size-4" />
          Crear nueva cuenta
        </Button>
      ) : (
        <form onSubmit={onCrear} className="rounded-xl border p-4 space-y-3">
          <p className="font-medium">Nueva cuenta</p>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña (mín. 8 caracteres)</Label>
            <Input id="password" name="password" type="text" minLength={8} required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <select id="rol" name="rol" required defaultValue="operadora" className="w-full h-11 px-3 rounded-lg border bg-background text-base">
              <option value="operadora">Operadora</option>
              <option value="encargada">Encargada de salón</option>
              <option value="administrativo">Administrativo</option>
            </select>
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <ShieldCheck className="size-3.5 mt-0.5 shrink-0" />
              <span>El usuario va a entrar con este email y contraseña. Comunicarlos por un canal seguro.</span>
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)} className="flex-1 h-11">
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="flex-1 h-11">
              {pending ? 'Creando…' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

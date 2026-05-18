'use client'

import { useState, useTransition } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { actualizarMenu } from './actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type Menu = { id: string; tipo_menu: 'A' | 'B' | 'C'; descripcion: string }

export function MenuCell({ menu }: { menu: Menu }) {
  const [valor, setValor] = useState(menu.descripcion)
  const [pending, startTransition] = useTransition()
  const cambiado = valor.trim() !== menu.descripcion

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await actualizarMenu(data)
      if (result?.error) toast.error(result.error)
      else if (result?.ok) toast.success('Menú actualizado')
    })
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border p-2 space-y-2 bg-card">
      <input type="hidden" name="id" value={menu.id} />
      <div className="flex items-center justify-between">
        <Badge variant="secondary">Menú {menu.tipo_menu}</Badge>
        {cambiado && (
          <Button type="submit" disabled={pending} variant="ghost" size="sm" className="h-7">
            <Check className="size-3.5" />
            {pending ? '…' : 'Guardar'}
          </Button>
        )}
      </div>
      <Textarea
        name="descripcion"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="min-h-16 text-sm resize-none"
        required
      />
    </form>
  )
}

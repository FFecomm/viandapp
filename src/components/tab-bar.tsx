'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  CalendarDays,
  Users,
  Wallet,
  MoreHorizontal,
  ShoppingBasket,
  FileText,
  UtensilsCrossed,
  UserCog,
  ReceiptText,
  LogOut,
  ClipboardList,
  HandCoins,
  HelpCircle,
  BarChart3,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'
import type { Rol } from '@/lib/supabase/types'

type LucideIcon = typeof CalendarDays
type Tab = { href: string; icon: LucideIcon; label: string }

const TABS_PRIMARIOS: Record<Rol, Tab[]> = {
  operadora: [
    { href: '/pedidos', icon: CalendarDays, label: 'Pedidos' },
    { href: '/alumnos', icon: Users, label: 'Alumnos' },
    { href: '/credito', icon: Wallet, label: 'Crédito' },
  ],
  encargada: [
    { href: '/encargada', icon: ClipboardList, label: 'Salón' },
    { href: '/encargada/cobro', icon: HandCoins, label: 'Cobrar' },
  ],
  administrativo: [
    { href: '/pedidos', icon: CalendarDays, label: 'Pedidos' },
    { href: '/caja', icon: ReceiptText, label: 'Caja' },
    { href: '/credito', icon: Wallet, label: 'Crédito' },
  ],
  padre: [],
}

const TABS_MAS: Record<Rol, Tab[]> = {
  operadora: [
    { href: '/productos', icon: ShoppingBasket, label: 'Productos' },
    { href: '/planilla', icon: FileText, label: 'Planilla' },
    { href: '/ayuda', icon: HelpCircle, label: 'Ayuda' },
  ],
  encargada: [
    { href: '/ayuda', icon: HelpCircle, label: 'Ayuda' },
  ],
  administrativo: [
    { href: '/alumnos', icon: Users, label: 'Alumnos' },
    { href: '/productos', icon: ShoppingBasket, label: 'Productos' },
    { href: '/menus', icon: UtensilsCrossed, label: 'Menús' },
    { href: '/usuarios', icon: UserCog, label: 'Usuarios' },
    { href: '/planilla', icon: FileText, label: 'Planilla' },
    { href: '/reportes', icon: BarChart3, label: 'Reportes' },
    { href: '/ayuda', icon: HelpCircle, label: 'Ayuda' },
  ],
  padre: [],
}

export function TabBar({ rol, nombre }: { rol: Rol; nombre: string }) {
  const pathname = usePathname()
  const primarios = TABS_PRIMARIOS[rol]
  const mas = TABS_MAS[rol]
  const [masOpen, setMasOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {primarios.map(({ href, icon: Icon, label }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className={cn('size-6', active && 'stroke-[2.5]')} />
            <span className={cn(active && 'font-semibold')}>{label}</span>
          </Link>
        )
      })}

      <Sheet open={masOpen} onOpenChange={setMasOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              className="flex-1 flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            />
          }
        >
          <MoreHorizontal className="size-6" />
          <span>Más</span>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl pb-10">
          <SheetHeader className="text-left">
            <SheetTitle>Hola, {nombre.split(' ')[0]}</SheetTitle>
          </SheetHeader>

          {mas.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {mas.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMasOpen(false)}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border bg-card hover:bg-muted transition-colors"
                >
                  <Icon className="size-6" />
                  <span className="text-sm text-center">{label}</span>
                </Link>
              ))}
            </div>
          )}

          <form action={logout} className="mt-6">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border text-destructive font-medium hover:bg-destructive/5"
            >
              <LogOut className="size-5" />
              Cerrar sesión
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </nav>
  )
}

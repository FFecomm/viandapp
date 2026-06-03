'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, History, Wallet, MoreHorizontal, LogOut, HelpCircle, UserCog } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { logout } from '@/app/(auth)/login/actions'
import { cn } from '@/lib/utils'

type Tab = { href: string; icon: typeof Home; label: string }

const TABS: Tab[] = [
  { href: '/familia', icon: Home, label: 'Inicio' },
  { href: '/familia/historial', icon: History, label: 'Pedidos' },
  { href: '/familia/credito', icon: Wallet, label: 'Saldo' },
]

export function TabBarFamilia({ nombre }: { nombre: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ href, icon: Icon, label }) => {
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

      <Sheet open={open} onOpenChange={setOpen}>
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
          <Link
            href="/cuenta"
            onClick={() => setOpen(false)}
            className="mt-4 flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted transition-colors"
          >
            <UserCog className="size-5" />
            <span className="font-medium">Mi cuenta</span>
          </Link>
          <Link
            href="/familia/ayuda"
            onClick={() => setOpen(false)}
            className="mt-3 flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted transition-colors"
          >
            <HelpCircle className="size-5" />
            <span className="font-medium">Ayuda</span>
          </Link>
          <form action={logout} className="mt-3">
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

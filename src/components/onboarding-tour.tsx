'use client'

import { useEffect, useState } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Rol } from '@/lib/supabase/types'

type Paso = { titulo: string; texto: string }

const PASOS: Record<Rol, Paso[]> = {
  encargada: [
    {
      titulo: '¡Bienvenida a ViandApp!',
      texto: 'Esta es tu herramienta para gestionar las viandas del salón. Te muestro las funciones principales en 4 pasos.',
    },
    {
      titulo: 'Lista del día',
      texto: 'Tu pantalla principal muestra todos los pedidos del día, ordenados por grado y división. Se actualiza sola.',
    },
    {
      titulo: 'Ausencias',
      texto: 'Si un alumno falta, tocá "Ausente" en su fila. La vianda se reprograma para el próximo día hábil.',
    },
    {
      titulo: 'Cobros en efectivo',
      texto: 'Si un alumno pasa sin haber pedido, usá "Dar vianda sin pedido" o "Cobrar" (abajo) para registrar pagos en efectivo.',
    },
  ],
  operadora: [
    {
      titulo: '¡Bienvenida a ViandApp!',
      texto: 'Te muestro las funciones principales para gestionar pedidos, familias y menús.',
    },
    {
      titulo: 'Pedidos en vivo',
      texto: 'La pantalla principal de pedidos se actualiza automáticamente cuando una familia confirma uno.',
    },
    {
      titulo: 'Alumnos y familias',
      texto: 'En "Alumnos" buscás por nombre, ves su saldo y el historial completo de pedidos y recargas.',
    },
    {
      titulo: 'Pedidos manuales',
      texto: 'Si una familia te pide algo por teléfono, usá "Nuevo pedido". Funciona igual que el wizard de las familias.',
    },
    {
      titulo: 'Editor de menús',
      texto: 'En "Más" → "Menús" editás los 14 menús del ciclo (nombre, descripción, imagen, orden).',
    },
  ],
  administrativo: [
    {
      titulo: '¡Bienvenido a ViandApp!',
      texto: 'Tenés acceso a todo el sistema. Te muestro las funciones más importantes.',
    },
    {
      titulo: 'Caja diaria',
      texto: 'En "Caja" ves los ingresos del día por Mercado Pago y efectivo. Hay exportador a Excel.',
    },
    {
      titulo: 'Reportes mensuales',
      texto: 'En "Más" → "Reportes" tenés facturación mensual, asistencia por curso y top consumo. También exportable.',
    },
    {
      titulo: 'Configuración crítica',
      texto: 'En "Crédito" cambiás el precio de vianda y conectás Mercado Pago. En "Usuarios" das de alta staff.',
    },
  ],
  padre: [],
}

const STORAGE_PREFIX = 'viandapp:tour-done:'

export function OnboardingTour({ rol }: { rol: Rol }) {
  const [visible, setVisible] = useState(false)
  const [paso, setPaso] = useState(0)

  useEffect(() => {
    if (rol === 'padre') return
    const key = STORAGE_PREFIX + rol
    if (localStorage.getItem(key)) return
    setVisible(true)
  }, [rol])

  const pasos = PASOS[rol] ?? []
  if (!visible || pasos.length === 0) return null

  const actual = pasos[paso]
  const ultimo = paso === pasos.length - 1

  function cerrar() {
    localStorage.setItem(STORAGE_PREFIX + rol, '1')
    setVisible(false)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-4 print:hidden">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-1.5">
            {pasos.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === paso ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`}
              />
            ))}
          </div>
          <button onClick={cerrar} aria-label="Saltar" className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-2 min-h-[120px]">
          <h2 className="text-xl font-semibold">{actual.titulo}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{actual.texto}</p>
        </div>

        <div className="flex gap-2 pt-2">
          {paso > 0 ? (
            <Button variant="outline" onClick={() => setPaso(paso - 1)} className="h-11">
              <ChevronLeft className="size-4" />
              Atrás
            </Button>
          ) : (
            <Button variant="ghost" onClick={cerrar} className="h-11">
              Saltar
            </Button>
          )}
          {ultimo ? (
            <Button onClick={cerrar} className="flex-1 h-11">
              ¡Empezar!
            </Button>
          ) : (
            <Button onClick={() => setPaso(paso + 1)} className="flex-1 h-11">
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

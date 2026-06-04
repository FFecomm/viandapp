'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Rol } from '@/lib/supabase/types'

type Faq = { p: string; r: React.ReactNode }

const FAQS: Record<Rol, Faq[]> = {
  encargada: [
    {
      p: '¿Cómo veo los pedidos del día?',
      r: 'Entrá a "Salón" en la barra de abajo — esa es tu pantalla principal y muestra todos los pedidos de hoy ordenados por grado y división.',
    },
    {
      p: '¿Qué hago si un alumno está ausente?',
      r: 'Buscalo en la lista y tocá "Ausente" en su fila. La vianda se reprograma automáticamente para el próximo día hábil. No devuelve dinero — solo traslada.',
    },
    {
      p: 'Vino un alumno que no había pedido. ¿Qué hago?',
      r: 'Tocá "Dar vianda sin pedido" arriba. Si tiene saldo, se descuenta automático. Si no, vas al flujo de cobro en efectivo.',
    },
    {
      p: '¿Cómo cobro en efectivo?',
      r: 'Andá a "Cobrar" en la barra de abajo. Buscá al alumno, escribí el monto y tocá "Registrar cobro". El movimiento queda en la caja.',
    },
    {
      p: '¿Puedo imprimir la lista del día?',
      r: 'Sí, hay un botón "PDF" arriba a la derecha en la pantalla de Salón.',
    },
  ],
  operadora: [
    {
      p: '¿Cómo veo los pedidos en vivo?',
      r: 'La pantalla principal de "Pedidos" se actualiza sola. Cuando una familia confirma un pedido, aparece sin que tengas que recargar.',
    },
    {
      p: '¿Cómo cargo un pedido manual?',
      r: 'Tocá "Nuevo pedido" en la pantalla de pedidos. Elegís el alumno y seguís el mismo wizard de 3 pasos que ven las familias.',
    },
    {
      p: '¿Cómo busco una familia o un alumno?',
      r: 'En "Alumnos" tenés la lista completa con buscador por nombre. Click en uno te muestra todo: pedidos, recargas, saldo.',
    },
    {
      p: '¿Cómo edito los menús del ciclo?',
      r: 'En "Más" → "Menús". Podés cambiar nombre, descripción, imagen, activar/desactivar y reordenar arrastrando.',
    },
    {
      p: 'Una familia me dice que pagó pero no le aparece el saldo.',
      r: 'Esperá 1–2 minutos por el webhook de MP. Si pasa más, contactá al admin con el número de operación de Mercado Pago.',
    },
  ],
  administrativo: [
    {
      p: '¿Cómo veo la caja del día?',
      r: 'Tocá "Caja" en la barra de abajo. Ves total MP, total efectivo, y todos los movimientos con hora y descripción. Hay botón para exportar a Excel.',
    },
    {
      p: '¿Cómo conecto Mercado Pago?',
      r: 'En "Crédito" hay un panel arriba: "Conectar Mercado Pago". Te lleva a MP, autorizás con la cuenta cobradora y volvés. Solo hace falta hacerlo una vez.',
    },
    {
      p: '¿Cómo cambio el precio de la vianda?',
      r: 'En "Crédito" hay un campo "Precio actual de vianda" — editás y guardás. El precio nuevo se aplica desde el próximo pedido/recarga.',
    },
    {
      p: '¿Cómo doy de alta a una encargada o operadora nueva?',
      r: '"Más" → "Usuarios" → "Crear nueva cuenta". Elegís rol, email y contraseña. Avisale al usuario por un canal seguro.',
    },
    {
      p: '¿Cómo veo los reportes?',
      r: 'En "Más" → "Reportes" tenés facturación mensual, asistencia por curso y top de consumo.',
    },
  ],
  padre: [
    {
      p: '¿Cómo pongo ViandApp como app en mi celular?',
      r: (
        <div className="space-y-3">
          <p>
            ViandApp funciona como una app nativa. Se instala desde el navegador,
            no desde la App Store ni Play Store.
          </p>
          <div>
            <p className="font-medium">En Android (Chrome):</p>
            <ol className="list-decimal pl-5 mt-1 space-y-0.5">
              <li>Entrá a viandapp.vercel.app</li>
              <li>Te aparece un cartel para instalar — tocá «Instalar»</li>
              <li>Si no aparece: menú ⋮ arriba a la derecha → «Instalar app»</li>
              <li>El ícono queda en tu pantalla de inicio</li>
            </ol>
          </div>
          <div>
            <p className="font-medium">En iPhone (Safari):</p>
            <ol className="list-decimal pl-5 mt-1 space-y-0.5">
              <li>Entrá a viandapp.vercel.app desde Safari</li>
              <li>Tocá los ••• abajo a la derecha del URL</li>
              <li>Tocá «Compartir»</li>
              <li>Bajá y tocá «Agregar a Inicio»</li>
              <li>Tocá «Agregar» arriba a la derecha</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      p: '¿Cómo pido una vianda?',
      r: 'Tocá "Pedir vianda". El wizard tiene 3 pasos: elegís los días (hay un botón "Próximos 5 días hábiles" para la semana completa), el menú de cada uno con sus opciones (sin queso, salsa pesto, etc.), y pagás con Mercado Pago.',
    },
    {
      p: '¿Hasta cuándo puedo hacer pedidos?',
      r: 'De lunes a viernes los pedidos están abiertos de 00:00 a 9:59 y de 15:00 a 23:59. Cierran de 10 a 15 mientras preparan las viandas. Los sábados y domingos están abiertos todo el día.',
    },
    {
      p: '¿Cómo cancelo un pedido?',
      r: 'En "Pedidos" tocás "Cancelar" en el pedido que quieras anular. ⚠️ No se puede cancelar después de las 8:00 AM del día de la vianda.',
    },
    {
      p: '¿Puedo cambiar el menú de un pedido ya hecho?',
      r: 'Sí. En "Pedidos" tocás "Editar" sobre el pedido y cambiás el menú o las opciones. La encargada del salón ve el cambio cuando refresca su lista.',
    },
    {
      p: 'Mi hijo está ausente. ¿Pierdo la vianda?',
      r: 'No. La encargada marca la ausencia y la vianda se reprograma para el próximo día hábil. No tenés que hacer nada.',
    },
    {
      p: '¿Cómo agrego otro hijo?',
      r: 'En la home, abajo del último hijo tenés "Sumar otro hijo". Te pregunta si lo cargás vos por primera vez o si ya está cargado por la otra mamá o papá.',
    },
    {
      p: '¿Cómo elimino un hijo?',
      r: 'En la home, debajo de la tarjeta del hijo, tocá "Eliminar hijo". Se cancelan sus pedidos futuros y te desvinculás de él. Si era el único padre vinculado, el alumno se da de baja.',
    },
    {
      p: 'Olvidé mi contraseña.',
      r: 'En el login tocás "¿Olvidaste tu contraseña?" y te llega un email para crear una nueva.',
    },
  ],
}

export function AyudaContenido({ rol }: { rol: Rol }) {
  const [abierto, setAbierto] = useState<number | null>(0)
  const faqs = FAQS[rol] ?? []

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Si no encontrás la respuesta, escribinos a{' '}
        <a href="mailto:fmajul2@gmail.com" className="text-primary underline">
          fmajul2@gmail.com
        </a>
        .
      </p>
      <ul className="space-y-2">
        {faqs.map((f, i) => {
          const open = abierto === i
          return (
            <li key={i} className="rounded-xl border bg-card">
              <button
                onClick={() => setAbierto(open ? null : i)}
                className="w-full flex items-center justify-between gap-2 p-4 text-left"
              >
                <span className="font-medium">{f.p}</span>
                <ChevronDown className={cn('size-5 shrink-0 transition-transform', open && 'rotate-180')} />
              </button>
              {open && (
                <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{f.r}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

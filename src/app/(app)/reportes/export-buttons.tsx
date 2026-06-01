'use client'

import { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Facturacion = {
  totalMp: number
  totalEfectivo: number
  totalIngresos: number
  totalEgresos: number
  neto: number
}
type FilaAsistencia = {
  curso: string
  total: number
  asistidos: number
  ausentes: number
  pct: number
}
type FilaConsumo = {
  nombre: string
  curso: string
  total: number
  ausentes: number
}

export function ReportesExport({
  mes,
  facturacion,
  asistencia,
  topConsumo,
}: {
  mes: string
  facturacion: Facturacion
  asistencia: FilaAsistencia[]
  topConsumo: FilaConsumo[]
}) {
  const [working, setWorking] = useState(false)

  async function exportar() {
    setWorking(true)
    try {
      const xlsx = await import('xlsx')

      const wb = xlsx.utils.book_new()

      const wsFact = xlsx.utils.json_to_sheet([
        { Concepto: 'Mercado Pago', Monto: facturacion.totalMp },
        { Concepto: 'Efectivo', Monto: facturacion.totalEfectivo },
        { Concepto: 'Ingresos totales', Monto: facturacion.totalIngresos },
        { Concepto: 'Egresos', Monto: facturacion.totalEgresos },
        { Concepto: 'Neto del mes', Monto: facturacion.neto },
      ])
      xlsx.utils.book_append_sheet(wb, wsFact, 'Facturación')

      const wsAsist = xlsx.utils.json_to_sheet(
        asistencia.map((f) => ({
          Curso: f.curso,
          Pedidos: f.total,
          Asistidos: f.asistidos,
          Ausentes: f.ausentes,
          'Asistencia %': f.pct,
        })),
      )
      xlsx.utils.book_append_sheet(wb, wsAsist, 'Asistencia')

      const wsTop = xlsx.utils.json_to_sheet(
        topConsumo.map((a) => ({
          Alumno: a.nombre,
          Curso: a.curso,
          Viandas: a.total,
          Ausentes: a.ausentes,
        })),
      )
      xlsx.utils.book_append_sheet(wb, wsTop, 'Top consumo')

      xlsx.writeFile(wb, `viandapp-reporte-${mes}.xlsx`)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="flex justify-end">
      <Button onClick={exportar} disabled={working} variant="outline" className="h-11">
        <FileSpreadsheet className="size-4" />
        {working ? 'Generando…' : 'Exportar Excel'}
      </Button>
    </div>
  )
}

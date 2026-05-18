'use client'

import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FORMAS_PAGO_LABEL_CORTO } from '@/lib/format'

type Movimiento = {
  hora: string
  alumno: string
  gradoDivision: string
  concepto: string
  forma_pago: 'efectivo' | 'transferencia' | 'credito' | 'a_deber'
  monto: number
  esIngreso: boolean
  created_at: string
}

type Row = Record<string, string | number>

function buildRows(movimientos: Movimiento[]): Row[] {
  return movimientos.map((m) => ({
    Fecha: m.created_at.slice(0, 10),
    Hora: m.hora,
    Alumno: m.alumno,
    'Grado y div.': m.gradoDivision,
    Concepto: m.concepto,
    'Forma de pago': FORMAS_PAGO_LABEL_CORTO[m.forma_pago],
    Monto: m.esIngreso ? m.monto : -m.monto,
  }))
}

export function CajaExport({
  movimientos,
  fecha,
  totalDelDia,
}: {
  movimientos: Movimiento[]
  fecha: string
  totalDelDia: number
}) {
  const [working, setWorking] = useState(false)

  async function exportarExcel() {
    setWorking(true)
    try {
      const xlsx = await import('xlsx')
      const rows = buildRows(movimientos)
      rows.push({
        Fecha: '',
        Hora: '',
        Alumno: '',
        'Grado y div.': '',
        Concepto: 'Total del día',
        'Forma de pago': '',
        Monto: totalDelDia,
      })
      const ws = xlsx.utils.json_to_sheet(rows)
      const wb = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(wb, ws, `Caja ${fecha}`)
      xlsx.writeFile(wb, `caja_${fecha}.xlsx`)
    } finally {
      setWorking(false)
    }
  }

  async function exportarCsv() {
    setWorking(true)
    try {
      const xlsx = await import('xlsx')
      const rows = buildRows(movimientos)
      const ws = xlsx.utils.json_to_sheet(rows)
      const csv = xlsx.utils.sheet_to_csv(ws)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `caja_${fecha}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setWorking(false)
    }
  }

  const deshabilitar = working || movimientos.length === 0

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button onClick={exportarExcel} disabled={deshabilitar} variant="outline" className="h-11">
        <FileSpreadsheet className="size-4" />
        Excel
      </Button>
      <Button onClick={exportarCsv} disabled={deshabilitar} variant="outline" className="h-11">
        <FileText className="size-4" />
        CSV
      </Button>
    </div>
  )
}

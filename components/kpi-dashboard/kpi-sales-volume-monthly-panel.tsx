"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { upsertSalesVolumeMonthCellAction } from "@/app/actions/kpi-dashboard"
import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const

function ytdMonthCap(year: number) {
  const now = new Date()
  return now.getFullYear() === year ? now.getMonth() + 1 : 12
}

type CellKey = `${string}-${number}`

function buildKey(varietyId: string, month: number): CellKey {
  return `${varietyId}-${month}` as CellKey
}

export function KpiSalesVolumeMonthlyPanel({
  segmentId,
  year,
  initialCells,
  canEdit,
  onSaved,
}: {
  segmentId: string
  year: number
  initialCells: Record<string, Record<number, number>>
  canEdit: boolean
  onSaved: () => void
}) {
  const buildValues = (src: Record<string, Record<number, number>>) => {
    const o: Record<CellKey, string> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      for (let m = 1; m <= 12; m++) {
        const val = src[v.id]?.[m]
        const k = buildKey(v.id, m)
        o[k] = val !== undefined && val !== 0 ? String(val) : ""
      }
    }
    return o
  }

  const [values, setValues] = useState<Record<CellKey, string>>(() => buildValues(initialCells))

  useEffect(() => {
    setValues(buildValues(initialCells))
  }, [year, initialCells])
  const [savingKey, setSavingKey] = useState<CellKey | null>(null)
  const [bulkPending, setBulkPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const ytdCapMonth = ytdMonthCap(year)

  const columnTotals = useMemo(() => {
    const totals: Record<number, number> = {}
    for (let m = 1; m <= 12; m++) totals[m] = 0
    for (const v of SALES_PRODUCT_VARIETIES) {
      for (let m = 1; m <= 12; m++) {
        const raw = values[buildKey(v.id, m)]?.trim() ?? ""
        const n = raw === "" ? 0 : parseFloat(raw)
        if (!Number.isNaN(n)) totals[m] += n
      }
    }
    return totals
  }, [values])

  const rowYtdTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      let s = 0
      for (let m = 1; m <= ytdCapMonth; m++) {
        const raw = values[buildKey(v.id, m)]?.trim() ?? ""
        const n = raw === "" ? 0 : parseFloat(raw)
        if (!Number.isNaN(n)) s += n
      }
      totals[v.id] = s
    }
    return totals
  }, [values, ytdCapMonth])

  const grandYtdTotal = useMemo(
    () => Object.values(rowYtdTotals).reduce((a, b) => a + b, 0),
    [rowYtdTotals]
  )

  const saveCell = async (varietyId: string, month: number) => {
    setMessage(null)
    const k = buildKey(varietyId, month)
    const raw = values[k]?.trim() ?? ""
    const n = raw === "" ? 0 : parseFloat(raw)
    if (raw !== "" && Number.isNaN(n)) {
      setMessage("Enter a valid number or leave blank for zero.")
      return
    }
    if (n < 0) {
      setMessage("Volume cannot be negative.")
      return
    }
    setSavingKey(k)
    const res = await upsertSalesVolumeMonthCellAction({
      segmentId,
      year,
      month,
      varietyId,
      volumeTonnes: n,
    })
    setSavingKey(null)
    if (!res.ok) {
      setMessage(res.error)
      return
    }
    onSaved()
  }

  const saveAllChanged = async () => {
    setMessage(null)
    setBulkPending(true)
    try {
      for (const v of SALES_PRODUCT_VARIETIES) {
        for (let m = 1; m <= 12; m++) {
          const k = buildKey(v.id, m)
          const raw = values[k]?.trim() ?? ""
          const n = raw === "" ? 0 : parseFloat(raw)
          if (raw !== "" && Number.isNaN(n)) {
            setMessage("Fix invalid numbers before saving all.")
            setBulkPending(false)
            return
          }
          const initial = initialCells[v.id]?.[m] ?? 0
          const next = Number.isNaN(n) ? 0 : n
          if (next === initial) continue
          const res = await upsertSalesVolumeMonthCellAction({
            segmentId,
            year,
            month: m,
            varietyId: v.id,
            volumeTonnes: next,
          })
          if (!res.ok) {
            setMessage(res.error)
            setBulkPending(false)
            return
          }
        }
      }
      onSaved()
    } finally {
      setBulkPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Month-on-month volume by variety ({year})</CardTitle>
            <CardDescription>
              Tonnes per variety per month. The dashboard headline uses YTD volume (Jan–{MONTH_SHORT[ytdCapMonth - 1]}{" "}
              for {year}): the variety with the largest share of that total.
            </CardDescription>
          </div>
          {canEdit && (
            <Button type="button" variant="secondary" disabled={bulkPending} onClick={saveAllChanged}>
              {bulkPending ? "Saving…" : "Save all changes"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && <p className="text-sm text-destructive">{message}</p>}
        <div className="rounded-md border overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-20 bg-background min-w-[200px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                  Variety
                </TableHead>
                {MONTH_SHORT.map((label, i) => (
                  <TableHead key={label} className="text-center min-w-[88px] whitespace-nowrap">
                    {label}
                  </TableHead>
                ))}
                <TableHead className="text-right min-w-[90px]">YTD tonnes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SALES_PRODUCT_VARIETIES.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="sticky left-0 z-10 bg-background font-medium text-sm shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                    <span className="text-muted-foreground text-xs block">{v.category}</span>
                    {v.label}
                  </TableCell>
                  {MONTH_SHORT.map((_, i) => {
                    const month = i + 1
                    const k = buildKey(v.id, month)
                    return (
                      <TableCell key={month} className="p-1 align-top">
                        {canEdit ? (
                          <div className="flex flex-col gap-1 items-stretch">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="h-8 text-xs px-2"
                              value={values[k] ?? ""}
                              onChange={(e) => setValues((prev) => ({ ...prev, [k]: e.target.value }))}
                              placeholder="0"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] px-1"
                              disabled={savingKey === k}
                              onClick={() => saveCell(v.id, month)}
                            >
                              {savingKey === k ? "…" : "Save"}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm tabular-nums block text-center py-1">
                            {(initialCells[v.id]?.[month] ?? 0) || "—"}
                          </span>
                        )}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right text-sm tabular-nums font-medium">
                    {rowYtdTotals[v.id]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "0"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-medium">
                <TableCell className="sticky left-0 z-10 bg-muted/50">Month total</TableCell>
                {MONTH_SHORT.map((_, i) => {
                  const month = i + 1
                  return (
                    <TableCell key={month} className="text-center text-sm tabular-nums">
                      {columnTotals[month]?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "0"}
                    </TableCell>
                  )
                })}
                <TableCell className="text-right text-sm tabular-nums">
                  {grandYtdTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

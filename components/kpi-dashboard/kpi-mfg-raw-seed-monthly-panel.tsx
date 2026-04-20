"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { upsertMfgRawSeedMonthCellAction } from "@/app/actions/kpi-dashboard"
import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"
import { TableExportMenu } from "@/components/ui/table-export-menu"

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const

function ytdMonthCap(year: number) {
  const now = new Date()
  return now.getFullYear() === year ? now.getMonth() + 1 : 12
}

type CellKey = `${string}-${number}`

function buildKey(varietyId: string, month: number): CellKey {
  return `${varietyId}-${month}` as CellKey
}

export function KpiMfgRawSeedMonthlyPanel({
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
  const [bulkPending, setBulkPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const capMonth = ytdMonthCap(year)
  const [viewThroughMonth, setViewThroughMonth] = useState(() => Math.min(capMonth, 12))

  useEffect(() => {
    setValues(buildValues(initialCells))
  }, [year, initialCells])

  useEffect(() => {
    setViewThroughMonth((m) => Math.min(Math.max(m, 1), capMonth))
  }, [capMonth, year])

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
      for (let m = 1; m <= capMonth; m++) {
        const raw = values[buildKey(v.id, m)]?.trim() ?? ""
        const n = raw === "" ? 0 : parseFloat(raw)
        if (!Number.isNaN(n)) s += n
      }
      totals[v.id] = s
    }
    return totals
  }, [values, capMonth])

  const grandYtdTotal = useMemo(
    () => Object.values(rowYtdTotals).reduce((a, b) => a + b, 0),
    [rowYtdTotals]
  )

  const cumulativeThroughMonth = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      let s = 0
      for (let m = 1; m <= viewThroughMonth; m++) {
        const raw = values[buildKey(v.id, m)]?.trim() ?? ""
        const n = raw === "" ? 0 : parseFloat(raw)
        if (!Number.isNaN(n)) s += n
      }
      totals[v.id] = s
    }
    return totals
  }, [values, viewThroughMonth])

  const cumulativeExport = useMemo(() => {
    const headers = ["Category", "Variety", `Cumulative tonnes (Jan–${MONTH_SHORT[viewThroughMonth - 1]} ${year})`]
    const rows = SALES_PRODUCT_VARIETIES.map((v) => {
      return [v.category, v.label, cumulativeThroughMonth[v.id] ?? 0] as (string | number)[]
    })
    const sum = Object.values(cumulativeThroughMonth).reduce((a, b) => a + b, 0)
    rows.push(["", "Total", sum])
    return { headers, rows }
  }, [cumulativeThroughMonth, viewThroughMonth, year])

  const monthlyGridExport = useMemo(() => {
    const headers = ["Category", "Variety", ...MONTH_SHORT, "YTD tonnes"]
    const varietyRows = SALES_PRODUCT_VARIETIES.map((v) => {
      const monthVals = MONTH_SHORT.map((_, i) => {
        const month = i + 1
        const raw = values[buildKey(v.id, month)]?.trim() ?? ""
        const n = raw === "" ? 0 : parseFloat(raw)
        return Number.isNaN(n) ? 0 : n
      })
      return [v.category, v.label, ...monthVals, rowYtdTotals[v.id] ?? 0] as (string | number)[]
    })
    const totalRow = [
      "",
      "Month total",
      ...MONTH_SHORT.map((_, i) => columnTotals[i + 1] ?? 0),
      grandYtdTotal,
    ] as (string | number)[]
    return { headers, rows: [...varietyRows, totalRow] }
  }, [values, rowYtdTotals, columnTotals, grandYtdTotal])

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
          const res = await upsertMfgRawSeedMonthCellAction({
            segmentId,
            year,
            month: m,
            varietyId: v.id,
            tonnesReceived: next,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Raw seed received by variety ({year})</CardTitle>
              <CardDescription>
                Tonnes received in each month. The department headline uses year-to-date totals (Jan–
                {MONTH_SHORT[capMonth - 1]}): the variety with the most recently saved row shows its cumulative tonnes.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <TableExportMenu
                fileBaseName={`mfg-raw-seed-monthly-${year}`}
                sheetName={`Raw seed ${year}`}
                title={`Raw seed received by month (${year})`}
                headers={monthlyGridExport.headers}
                rows={monthlyGridExport.rows}
              />
              {canEdit && (
                <Button type="button" variant="secondary" disabled={bulkPending} onClick={saveAllChanged}>
                  {bulkPending ? "Saving…" : "Save all changes"}
                </Button>
              )}
            </div>
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
                  {MONTH_SHORT.map((label) => (
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
                        <TableCell key={month} className="p-1 align-middle">
                          {canEdit ? (
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="h-8 text-xs px-2"
                              value={values[k] ?? ""}
                              onChange={(e) => setValues((prev) => ({ ...prev, [k]: e.target.value }))}
                              placeholder="0"
                            />
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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle>Cumulative by end of month</CardTitle>
              <CardDescription>
                Total tonnes received from January through the selected month (per variety and overall).
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Show totals through</span>
                <Select
                  value={String(viewThroughMonth)}
                  onValueChange={(v) => setViewThroughMonth(Number(v))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_SHORT.slice(0, capMonth).map((label, i) => {
                      const m = i + 1
                      return (
                        <SelectItem key={m} value={String(m)}>
                          End of {label} {year}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <TableExportMenu
              fileBaseName={`mfg-raw-seed-cumulative-${year}-through-${viewThroughMonth}`}
              sheetName={`Cumulative ${year}`}
              title={`Raw seed cumulative through ${MONTH_SHORT[viewThroughMonth - 1]} ${year}`}
              headers={cumulativeExport.headers}
              rows={cumulativeExport.rows}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Variety</TableHead>
                  <TableHead className="text-right min-w-[120px]">Cumulative tonnes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SALES_PRODUCT_VARIETIES.map((v) => {
                  const t = cumulativeThroughMonth[v.id] ?? 0
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        <span className="text-muted-foreground text-xs block">{v.category}</span>
                        {v.label}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {t === 0 ? "—" : t.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Object.values(cumulativeThroughMonth)
                      .reduce((a, b) => a + b, 0)
                      .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

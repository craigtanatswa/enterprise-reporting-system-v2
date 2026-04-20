"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TableExportMenu } from "@/components/ui/table-export-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { upsertMfgProcessingEfficiencyVarietyAction } from "@/app/actions/kpi-dashboard"
import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"

export type MfgProcessingEfficiencyVarietyInitial = { actual: number; target: number }

function numToInput(n: number): string {
  if (!Number.isFinite(n) || n === 0) return ""
  return String(n)
}

export function KpiMfgProcessingEfficiencyVarietyPanel({
  segmentId,
  initialByVariety,
  canEdit,
  onSaved,
}: {
  segmentId: string
  initialByVariety: Record<string, MfgProcessingEfficiencyVarietyInitial>
  canEdit: boolean
  onSaved: () => void
}) {
  const emptyRow = (): MfgProcessingEfficiencyVarietyInitial => ({ actual: 0, target: 0 })

  const buildActual = (src: Record<string, MfgProcessingEfficiencyVarietyInitial>) => {
    const o: Record<string, string> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      o[v.id] = numToInput((src[v.id] ?? emptyRow()).actual)
    }
    return o
  }

  const buildTarget = (src: Record<string, MfgProcessingEfficiencyVarietyInitial>) => {
    const o: Record<string, string> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      o[v.id] = numToInput((src[v.id] ?? emptyRow()).target)
    }
    return o
  }

  const [actualValues, setActualValues] = useState<Record<string, string>>(() =>
    buildActual(initialByVariety)
  )
  const [targetValues, setTargetValues] = useState<Record<string, string>>(() =>
    buildTarget(initialByVariety)
  )
  const [bulkPending, setBulkPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setActualValues(buildActual(initialByVariety))
    setTargetValues(buildTarget(initialByVariety))
  }, [initialByVariety])

  const exportRows = useMemo(() => {
    const headers = ["Category", "Variety", "Actual %", "Target %"]
    const rows = SALES_PRODUCT_VARIETIES.map((v) => {
      let a: number
      let t: number
      if (canEdit) {
        const ra = actualValues[v.id]?.trim() ?? ""
        const rt = targetValues[v.id]?.trim() ?? ""
        const pa = ra === "" ? 0 : parseFloat(ra)
        const pt = rt === "" ? 0 : parseFloat(rt)
        a = Number.isNaN(pa) ? 0 : pa
        t = Number.isNaN(pt) ? 0 : pt
      } else {
        const row = initialByVariety[v.id] ?? emptyRow()
        a = row.actual
        t = row.target
      }
      return [v.category, v.label, a, t]
    })
    return { headers, rows }
  }, [actualValues, targetValues, initialByVariety, canEdit])

  const parseCell = (raw: string): number => {
    const t = raw.trim()
    if (t === "") return 0
    const n = parseFloat(t)
    return Number.isNaN(n) ? NaN : n
  }

  const saveAllChanged = async () => {
    setMessage(null)
    setBulkPending(true)
    try {
      for (const v of SALES_PRODUCT_VARIETIES) {
        const nextActual = parseCell(actualValues[v.id]?.trim() || "0")
        const nextTarget = parseCell(targetValues[v.id]?.trim() || "0")
        if (Number.isNaN(nextActual)) {
          setMessage("Fix invalid actual % before saving.")
          setBulkPending(false)
          return
        }
        if (Number.isNaN(nextTarget)) {
          setMessage("Fix invalid target % before saving.")
          setBulkPending(false)
          return
        }
        const init = initialByVariety[v.id] ?? emptyRow()
        if (nextActual === init.actual && nextTarget === init.target) continue
        const res = await upsertMfgProcessingEfficiencyVarietyAction({
          segmentId,
          varietyId: v.id,
          efficiencyPercent: nextActual,
          targetPercent: nextTarget,
        })
        if (!res.ok) {
          setMessage(res.error)
          setBulkPending(false)
          return
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
            <CardTitle>Processing efficiency by variety</CardTitle>
            <CardDescription>
              Enter actual processing efficiency (%) and the target (%) for each variety. The department headline
              highlights the variety with the lowest actual efficiency (largest improvement opportunity).
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <TableExportMenu
              fileBaseName="mfg-processing-efficiency-by-variety"
              sheetName="Efficiency"
              title="Processing efficiency by variety (%)"
              headers={exportRows.headers}
              rows={exportRows.rows}
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
                <TableHead className="min-w-[180px]">Variety</TableHead>
                <TableHead className="text-right min-w-[110px]">Actual %</TableHead>
                <TableHead className="text-right min-w-[110px]">Target %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SALES_PRODUCT_VARIETIES.map((v) => {
                const init = initialByVariety[v.id] ?? emptyRow()
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <span className="text-muted-foreground text-xs block">{v.category}</span>
                      <span className="font-medium text-sm">{v.label}</span>
                    </TableCell>
                    <TableCell className="text-right p-1 align-middle">
                      {canEdit ? (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          className="h-8 text-sm tabular-nums ml-auto max-w-[110px]"
                          value={actualValues[v.id] ?? ""}
                          onChange={(e) => setActualValues((prev) => ({ ...prev, [v.id]: e.target.value }))}
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm tabular-nums inline-block py-2 pr-2">
                          {init.actual.toLocaleString(undefined, { maximumFractionDigits: 1 }) || "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right p-1 align-middle">
                      {canEdit ? (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          className="h-8 text-sm tabular-nums ml-auto max-w-[110px]"
                          value={targetValues[v.id] ?? ""}
                          onChange={(e) => setTargetValues((prev) => ({ ...prev, [v.id]: e.target.value }))}
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm tabular-nums inline-block py-2 pr-2">
                          {init.target.toLocaleString(undefined, { maximumFractionDigits: 1 }) || "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

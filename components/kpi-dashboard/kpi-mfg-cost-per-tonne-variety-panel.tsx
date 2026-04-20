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
import { upsertMfgCostPerTonneVarietyAction } from "@/app/actions/kpi-dashboard"
import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"

export type MfgCostPerTonneVarietyInitial = { cost: number; target: number }

function numToInput(n: number): string {
  if (!Number.isFinite(n) || n === 0) return ""
  return String(n)
}

export function KpiMfgCostPerTonneVarietyPanel({
  segmentId,
  initialByVariety,
  canEdit,
  onSaved,
}: {
  segmentId: string
  initialByVariety: Record<string, MfgCostPerTonneVarietyInitial>
  canEdit: boolean
  onSaved: () => void
}) {
  const emptyRow = (): MfgCostPerTonneVarietyInitial => ({ cost: 0, target: 0 })

  const buildCostValues = (src: Record<string, MfgCostPerTonneVarietyInitial>) => {
    const o: Record<string, string> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      const row = src[v.id] ?? emptyRow()
      o[v.id] = numToInput(row.cost)
    }
    return o
  }

  const buildTargetValues = (src: Record<string, MfgCostPerTonneVarietyInitial>) => {
    const o: Record<string, string> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      const row = src[v.id] ?? emptyRow()
      o[v.id] = numToInput(row.target)
    }
    return o
  }

  const [costValues, setCostValues] = useState<Record<string, string>>(() => buildCostValues(initialByVariety))
  const [targetValues, setTargetValues] = useState<Record<string, string>>(() => buildTargetValues(initialByVariety))
  const [bulkPending, setBulkPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setCostValues(buildCostValues(initialByVariety))
    setTargetValues(buildTargetValues(initialByVariety))
  }, [initialByVariety])

  const exportRows = useMemo(() => {
    const headers = ["Category", "Variety", "Actual USD/tonne", "Target USD/tonne"]
    const rows = SALES_PRODUCT_VARIETIES.map((v) => {
      let costN: number
      let targetN: number
      if (canEdit) {
        const rc = costValues[v.id]?.trim() ?? ""
        const rt = targetValues[v.id]?.trim() ?? ""
        const c = rc === "" ? 0 : parseFloat(rc)
        const t = rt === "" ? 0 : parseFloat(rt)
        costN = Number.isNaN(c) ? 0 : c
        targetN = Number.isNaN(t) ? 0 : t
      } else {
        const row = initialByVariety[v.id] ?? emptyRow()
        costN = row.cost
        targetN = row.target
      }
      return [v.category, v.label, costN, targetN]
    })
    return { headers, rows }
  }, [costValues, targetValues, initialByVariety, canEdit])

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
        const cRaw = costValues[v.id]?.trim() ?? ""
        const tRaw = targetValues[v.id]?.trim() ?? ""
        const nextCost = parseCell(cRaw || "0")
        const nextTarget = parseCell(tRaw || "0")
        if (Number.isNaN(nextCost)) {
          setMessage("Fix invalid actual cost numbers before saving.")
          setBulkPending(false)
          return
        }
        if (Number.isNaN(nextTarget)) {
          setMessage("Fix invalid target numbers before saving.")
          setBulkPending(false)
          return
        }
        const init = initialByVariety[v.id] ?? emptyRow()
        if (nextCost === init.cost && nextTarget === init.target) continue
        const res = await upsertMfgCostPerTonneVarietyAction({
          segmentId,
          varietyId: v.id,
          costUsdPerTonne: nextCost,
          targetUsdPerTonne: nextTarget,
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
            <CardTitle>Cost per tonne processed by variety</CardTitle>
            <CardDescription>
              Enter actual USD per tonne and target USD per tonne for each variety. The department headline shows the
              variety with the highest actual cost per tonne.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <TableExportMenu
              fileBaseName="mfg-cost-per-tonne-by-variety"
              sheetName="Cost per tonne"
              title="Cost per tonne processed by variety (USD)"
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
                <TableHead className="text-right min-w-[120px]">Actual USD/t</TableHead>
                <TableHead className="text-right min-w-[120px]">Target USD/t</TableHead>
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
                          step="0.01"
                          className="h-8 text-sm tabular-nums ml-auto max-w-[120px]"
                          value={costValues[v.id] ?? ""}
                          onChange={(e) => setCostValues((prev) => ({ ...prev, [v.id]: e.target.value }))}
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm tabular-nums inline-block py-2 pr-2">
                          {init.cost.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right p-1 align-middle">
                      {canEdit ? (
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="h-8 text-sm tabular-nums ml-auto max-w-[120px]"
                          value={targetValues[v.id] ?? ""}
                          onChange={(e) => setTargetValues((prev) => ({ ...prev, [v.id]: e.target.value }))}
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm tabular-nums inline-block py-2 pr-2">
                          {init.target.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "—"}
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

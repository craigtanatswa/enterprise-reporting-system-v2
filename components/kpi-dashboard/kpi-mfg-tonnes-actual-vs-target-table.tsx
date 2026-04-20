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
import { upsertMfgTonnesTargetByVarietyAction } from "@/app/actions/kpi-dashboard"
import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"
import {
  flowYtdTonnesByVariety,
  inventoryClosingTonnesByVariety,
  ytdCapMonth,
} from "@/lib/kpi-dashboard/mfg-tonnes-actual-vs-target"

export type MfgTonnesTargetMetricId =
  | "mfg-processed-output"
  | "mfg-packaged"
  | "mfg-finished-warehouse"

function formatProgressPct(actual: number, annualPlan: number): string {
  if (annualPlan <= 0) return "—"
  const pct = (actual / annualPlan) * 100
  return `${pct.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

export function KpiMfgTonnesActualVsTargetTable({
  segmentId,
  metricId,
  year,
  cells,
  initialTargetsByVariety,
  canEdit,
  onSaved,
}: {
  segmentId: string
  metricId: MfgTonnesTargetMetricId
  year: number
  cells: Record<string, Record<number, number>>
  initialTargetsByVariety: Record<string, number>
  canEdit: boolean
  onSaved: () => void
}) {
  const capMonth = useMemo(() => ytdCapMonth(year, new Date()), [year])
  const isInventory = metricId === "mfg-finished-warehouse"

  const actualByVariety = useMemo(() => {
    if (isInventory) return inventoryClosingTonnesByVariety(cells, capMonth)
    return flowYtdTonnesByVariety(cells, capMonth)
  }, [cells, capMonth, isInventory])

  const [targets, setTargets] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      const t = initialTargetsByVariety[v.id] ?? 0
      o[v.id] = t > 0 ? String(t) : ""
    }
    return o
  })

  useEffect(() => {
    const o: Record<string, string> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      const t = initialTargetsByVariety[v.id] ?? 0
      o[v.id] = t > 0 ? String(t) : ""
    }
    setTargets(o)
  }, [initialTargetsByVariety, year, metricId])

  const rows = useMemo(() => {
    return SALES_PRODUCT_VARIETIES.map((v) => {
      const actual = actualByVariety[v.id] ?? 0
      const raw = targets[v.id]?.trim() ?? ""
      const parsed = raw === "" ? 0 : parseFloat(raw)
      const annualPlan = Number.isNaN(parsed) ? 0 : parsed
      return { ...v, actual, annualPlan }
    })
  }, [actualByVariety, targets])

  const totals = useMemo(() => {
    let actual = 0
    let annual = 0
    for (const r of rows) {
      actual += r.actual
      annual += r.annualPlan
    }
    return { actual, annualPlan: annual }
  }, [rows])

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const saveTargets = async () => {
    setMessage(null)
    const batch: { varietyId: string; targetTonnes: number }[] = []
    for (const v of SALES_PRODUCT_VARIETIES) {
      const raw = targets[v.id]?.trim() ?? ""
      if (raw !== "" && Number.isNaN(parseFloat(raw))) {
        setMessage("Fix invalid numbers before saving.")
        return
      }
      const n = raw === "" ? 0 : parseFloat(raw)
      batch.push({ varietyId: v.id, targetTonnes: Number.isNaN(n) ? 0 : n })
    }
    setSaving(true)
    try {
      const res = await upsertMfgTonnesTargetByVarietyAction({
        segmentId,
        year,
        metricId,
        rows: batch,
      })
      if (!res.ok) {
        setMessage(res.error ?? "Save failed")
        return
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const monthLabel = new Date(year, capMonth - 1, 1).toLocaleString("en-US", { month: "short" })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annual plan & progress</CardTitle>
        <CardDescription>
          {isInventory ? (
            <>
              <strong>Actual</strong> is closing tonnes at end of {monthLabel} {year}. <strong>Annual plan</strong> is the
              full-year tonnes target per variety. <strong>Progress</strong> is actual ÷ annual plan.
            </>
          ) : (
            <>
              <strong>Actual</strong> is year-to-date tonnes through {monthLabel} {year}. <strong>Annual plan</strong> is
              the full-year tonnes target per variety. <strong>Progress</strong> is actual ÷ annual plan.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && <p className="text-sm text-destructive">{message}</p>}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Variety</TableHead>
                <TableHead className="text-right min-w-[100px]">Actual (t)</TableHead>
                <TableHead className="text-right min-w-[120px]">Annual plan (t)</TableHead>
                <TableHead className="text-right min-w-[100px]">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="text-muted-foreground text-xs block">{r.category}</span>
                    {r.label}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.actual === 0 ? "—" : r.actual.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right p-1">
                    {canEdit ? (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="h-8 text-xs text-right"
                        value={targets[r.id] ?? ""}
                        onChange={(e) => setTargets((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="0"
                      />
                    ) : (
                      <span className="tabular-nums block py-2 pr-2">
                        {r.annualPlan === 0 ? "—" : r.annualPlan.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatProgressPct(r.actual, r.annualPlan)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-medium">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {totals.actual.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {totals.annualPlan.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatProgressPct(totals.actual, totals.annualPlan)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {canEdit && (
          <Button type="button" variant="secondary" disabled={saving} onClick={saveTargets}>
            {saving ? "Saving…" : "Save annual plan"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

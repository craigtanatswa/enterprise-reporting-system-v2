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
import { upsertFinanceInventoryVarietyAction } from "@/app/actions/kpi-dashboard"
import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"

export function KpiFinanceInventoryVarietyPanel({
  segmentId,
  initialByVariety,
  canEdit,
  onSaved,
}: {
  segmentId: string
  initialByVariety: Record<string, number>
  canEdit: boolean
  onSaved: () => void
}) {
  const buildValues = (src: Record<string, number>) => {
    const o: Record<string, string> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      const val = src[v.id]
      o[v.id] = val !== undefined && val !== 0 ? String(val) : ""
    }
    return o
  }

  const [values, setValues] = useState<Record<string, string>>(() => buildValues(initialByVariety))
  const [bulkPending, setBulkPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setValues(buildValues(initialByVariety))
  }, [initialByVariety])

  const inventoryExport = useMemo(() => {
    const headers = ["Category", "Variety", "Inventory (tonnes)"]
    const rows = SALES_PRODUCT_VARIETIES.map((v) => {
      let tonnes: number
      if (canEdit) {
        const raw = values[v.id]?.trim() ?? ""
        const n = raw === "" ? 0 : parseFloat(raw)
        tonnes = Number.isNaN(n) ? 0 : n
      } else {
        tonnes = initialByVariety[v.id] ?? 0
      }
      return [v.category, v.label, tonnes]
    })
    return { headers, rows }
  }, [values, initialByVariety, canEdit])

  const saveAllChanged = async () => {
    setMessage(null)
    setBulkPending(true)
    try {
      for (const v of SALES_PRODUCT_VARIETIES) {
        const raw = values[v.id]?.trim() ?? ""
        const n = raw === "" ? 0 : parseFloat(raw)
        if (raw !== "" && Number.isNaN(n)) {
          setMessage("Fix invalid numbers before saving.")
          setBulkPending(false)
          return
        }
        const initial = initialByVariety[v.id] ?? 0
        const next = Number.isNaN(n) ? 0 : n
        if (next === initial) continue
        const res = await upsertFinanceInventoryVarietyAction({
          segmentId,
          varietyId: v.id,
          inventoryTonnes: next,
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
            <CardTitle>Inventory by variety</CardTitle>
            <CardDescription>
              Tonnes in stock per product variety. The headline above shows the largest holding; 2nd–4th appear below
              it. Save to update the dashboard.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <TableExportMenu
              fileBaseName="finance-inventory-by-variety"
              sheetName="Finance inventory"
              title="Inventory by variety (Finance)"
              headers={inventoryExport.headers}
              rows={inventoryExport.rows}
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
                <TableHead className="min-w-[200px]">Variety</TableHead>
                <TableHead className="text-right min-w-[140px]">Inventory (tonnes)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SALES_PRODUCT_VARIETIES.map((v) => (
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
                        className="h-8 text-sm tabular-nums ml-auto max-w-[140px]"
                        value={values[v.id] ?? ""}
                        onChange={(e) => setValues((prev) => ({ ...prev, [v.id]: e.target.value }))}
                        placeholder="0"
                      />
                    ) : (
                      <span className="text-sm tabular-nums inline-block py-2 pr-2">
                        {(initialByVariety[v.id] ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 }) || "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

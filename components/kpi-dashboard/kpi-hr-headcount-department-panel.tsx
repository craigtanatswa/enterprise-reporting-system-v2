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
import { upsertHrHeadcountDepartmentAction } from "@/app/actions/kpi-dashboard"
import {
  HR_HEADCOUNT_DEPARTMENTS,
  type HrHeadcountDepartmentKey,
} from "@/lib/kpi-dashboard/hr-headcount-departments"

export function KpiHrHeadcountDepartmentPanel({
  segmentId,
  initialByDepartment,
  canEdit,
  onSaved,
}: {
  segmentId: string
  initialByDepartment: Record<HrHeadcountDepartmentKey, number>
  canEdit: boolean
  onSaved: () => void
}) {
  const buildValues = (src: Record<HrHeadcountDepartmentKey, number>) => {
    const o: Record<HrHeadcountDepartmentKey, string> = {} as Record<HrHeadcountDepartmentKey, string>
    for (const d of HR_HEADCOUNT_DEPARTMENTS) {
      const val = src[d.key]
      o[d.key] = val !== undefined && val !== 0 ? String(val) : ""
    }
    return o
  }

  const [values, setValues] = useState<Record<HrHeadcountDepartmentKey, string>>(() =>
    buildValues(initialByDepartment)
  )
  const [bulkPending, setBulkPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setValues(buildValues(initialByDepartment))
  }, [initialByDepartment])

  const tableTotal = useMemo(() => {
    let s = 0
    for (const d of HR_HEADCOUNT_DEPARTMENTS) {
      const raw = (canEdit ? values[d.key] : String(initialByDepartment[d.key] ?? 0))?.trim() ?? ""
      const n = raw === "" ? 0 : parseInt(raw, 10)
      s += Number.isNaN(n) ? 0 : Math.max(0, n)
    }
    return s
  }, [values, initialByDepartment, canEdit])

  const exportRows = useMemo(() => {
    return HR_HEADCOUNT_DEPARTMENTS.map((d) => {
      let n: number
      if (canEdit) {
        const raw = values[d.key]?.trim() ?? ""
        const parsed = raw === "" ? 0 : parseInt(raw, 10)
        n = Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
      } else {
        n = initialByDepartment[d.key] ?? 0
      }
      return [d.label, n] as [string, number]
    })
  }, [values, initialByDepartment, canEdit])

  const saveAllChanged = async () => {
    setMessage(null)
    setBulkPending(true)
    try {
      for (const d of HR_HEADCOUNT_DEPARTMENTS) {
        const raw = values[d.key]?.trim() ?? ""
        const n = raw === "" ? 0 : parseInt(raw, 10)
        if (raw !== "" && Number.isNaN(n)) {
          setMessage("Fix invalid whole numbers before saving.")
          setBulkPending(false)
          return
        }
        const next = Number.isNaN(n) ? 0 : Math.max(0, n)
        const initial = initialByDepartment[d.key] ?? 0
        if (next === initial) continue
        const res = await upsertHrHeadcountDepartmentAction({
          segmentId,
          departmentKey: d.key,
          headcount: next,
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
            <CardTitle>Headcount by department</CardTitle>
            <CardDescription>
              Enter employee counts per department. The headline total is the sum of this table. Save to update the
              dashboard.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <TableExportMenu
              fileBaseName="hr-headcount-by-department"
              sheetName="HR headcount"
              title="Headcount by department"
              headers={["Department", "Headcount"]}
              rows={exportRows.map(([label, n]) => [label, n])}
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
        <p className="text-sm text-muted-foreground">
          Table total: <span className="font-semibold text-foreground tabular-nums">{tableTotal}</span> employees
        </p>
        <div className="rounded-md border overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Department</TableHead>
                <TableHead className="text-right min-w-[140px]">Headcount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {HR_HEADCOUNT_DEPARTMENTS.map((d) => (
                <TableRow key={d.key}>
                  <TableCell className="font-medium text-sm">{d.label}</TableCell>
                  <TableCell className="text-right p-1 align-middle">
                    {canEdit ? (
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        className="h-8 text-sm tabular-nums ml-auto max-w-[140px]"
                        value={values[d.key] ?? ""}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [d.key]: e.target.value }))
                        }
                        placeholder="0"
                      />
                    ) : (
                      <span className="text-sm tabular-nums inline-block py-2 pr-2">
                        {(initialByDepartment[d.key] ?? 0).toLocaleString()}
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

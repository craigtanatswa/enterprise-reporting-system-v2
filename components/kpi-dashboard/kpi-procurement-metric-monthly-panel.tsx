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
import { upsertProcurementMetricMonthAction } from "@/app/actions/kpi-dashboard"
import { TableExportMenu } from "@/components/ui/table-export-menu"
import type { ProcurementMonthlyMetricId } from "@/lib/kpi-dashboard/procurement-monthly-metrics"

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n
  )
}

function formatCount(n: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)
}

function ytdMonthCap(year: number) {
  const now = new Date()
  return now.getFullYear() === year ? now.getMonth() + 1 : 12
}

export function KpiProcurementMetricMonthlyPanel({
  segmentId,
  metricId,
  metricTitle,
  year,
  initialByMonth,
  valueFormat,
  canEdit,
  onSaved,
}: {
  segmentId: string
  metricId: ProcurementMonthlyMetricId
  metricTitle: string
  year: number
  initialByMonth: Record<number, number>
  valueFormat: "usd" | "count"
  canEdit: boolean
  onSaved: () => void
}) {
  const buildValues = (src: Record<number, number>) => {
    const o: Record<number, string> = {}
    for (let m = 1; m <= 12; m++) {
      const v = src[m]
      o[m] = v !== undefined && v !== 0 ? String(v) : ""
    }
    return o
  }

  const [values, setValues] = useState<Record<number, string>>(() => buildValues(initialByMonth))

  useEffect(() => {
    setValues(buildValues(initialByMonth))
  }, [year, initialByMonth, metricId])

  const [savingMonth, setSavingMonth] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const ytdCapMonth = ytdMonthCap(year)
  const ytd = Object.entries(values).reduce((sum, [mStr, s]) => {
    const m = Number(mStr)
    if (m > ytdCapMonth) return sum
    const n = parseFloat(s)
    if (s.trim() === "" || Number.isNaN(n)) return sum
    return sum + n
  }, 0)

  const fmt = valueFormat === "usd" ? formatUsd : formatCount
  const valueColumnLabel = valueFormat === "usd" ? "Amount (USD)" : "Count (items)"

  const saveMonth = async (month: number) => {
    setMessage(null)
    const raw = values[month]?.trim() ?? ""
    const n = raw === "" ? 0 : parseFloat(raw)
    if (raw !== "" && Number.isNaN(n)) {
      setMessage("Enter a valid number or leave blank for zero.")
      return
    }
    if (n < 0) {
      setMessage("Value cannot be negative.")
      return
    }
    if (valueFormat === "count" && raw !== "" && !Number.isInteger(n)) {
      setMessage("Use a whole number for item counts.")
      return
    }
    setSavingMonth(month)
    const res = await upsertProcurementMetricMonthAction({
      segmentId,
      year,
      month,
      metricId,
      valueAmount: valueFormat === "count" ? Math.round(n) : n,
    })
    setSavingMonth(null)
    if (!res.ok) {
      setMessage(res.error)
      return
    }
    onSaved()
  }

  const exportData = useMemo(() => {
    const headers = ["Month", valueColumnLabel]
    const rows = MONTH_NAMES.map((name, i) => {
      const month = i + 1
      const raw = values[month]?.trim() ?? ""
      const n = raw === "" ? 0 : parseFloat(raw)
      const amount = canEdit ? (Number.isNaN(n) ? 0 : n) : (initialByMonth[month] ?? 0)
      return [name, amount] as (string | number)[]
    })
    return { headers, rows }
  }, [values, initialByMonth, canEdit, valueColumnLabel])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1.5">
          <CardTitle>
            {metricTitle} — by month ({year})
          </CardTitle>
          <CardDescription>
            Enter figures per calendar month. The headline on the Procurement dashboard is the sum from January
            through {ytdCapMonth === 12 ? "December" : MONTH_NAMES[ytdCapMonth - 1]} for {year}.
          </CardDescription>
        </div>
        <TableExportMenu
          fileBaseName={`procurement-${metricId}-monthly-${year}`}
          sheetName={`${metricTitle} ${year}`}
          title={`${metricTitle} (${year})`}
          headers={exportData.headers}
          rows={exportData.rows}
          className="shrink-0"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {message && <p className="text-sm text-destructive">{message}</p>}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Month</TableHead>
                <TableHead>{valueColumnLabel}</TableHead>
                {canEdit && <TableHead className="w-[120px] text-right"> </TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {MONTH_NAMES.map((name, i) => {
                const month = i + 1
                return (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Input
                          type="number"
                          min={0}
                          step={valueFormat === "usd" ? "0.01" : "1"}
                          className="max-w-[200px]"
                          value={values[month] ?? ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [month]: e.target.value }))}
                          placeholder="0"
                        />
                      ) : (
                        <span>{fmt(initialByMonth[month] ?? 0)}</span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={savingMonth === month}
                          onClick={() => saveMonth(month)}
                        >
                          {savingMonth === month ? "Saving…" : "Save"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground">
          YTD preview (Jan–{MONTH_NAMES[ytdCapMonth - 1]}):{" "}
          <span className="font-medium text-foreground">{fmt(ytd)}</span>
        </p>
      </CardContent>
    </Card>
  )
}

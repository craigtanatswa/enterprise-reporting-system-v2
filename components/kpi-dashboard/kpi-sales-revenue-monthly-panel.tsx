"use client"

import { useEffect, useState } from "react"
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
import { upsertSalesRevenueMonthAction } from "@/app/actions/kpi-dashboard"

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

function ytdMonthCap(year: number) {
  const now = new Date()
  return now.getFullYear() === year ? now.getMonth() + 1 : 12
}

export function KpiSalesRevenueMonthlyPanel({
  segmentId,
  year,
  initialByMonth,
  canEdit,
  onSaved,
}: {
  segmentId: string
  year: number
  initialByMonth: Record<number, number>
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
  }, [year, initialByMonth])
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

  const saveMonth = async (month: number) => {
    setMessage(null)
    const raw = values[month]?.trim() ?? ""
    const n = raw === "" ? 0 : parseFloat(raw)
    if (raw !== "" && Number.isNaN(n)) {
      setMessage("Enter a valid number or leave blank for zero.")
      return
    }
    if (n < 0) {
      setMessage("Amount cannot be negative.")
      return
    }
    setSavingMonth(month)
    const res = await upsertSalesRevenueMonthAction({
      segmentId,
      year,
      month,
      amountUsd: n,
    })
    setSavingMonth(null)
    if (!res.ok) {
      setMessage(res.error)
      return
    }
    onSaved()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by month ({year})</CardTitle>
        <CardDescription>
          Enter revenue per calendar month. Total Sales Revenue (YTD) on the dashboard is the sum of months from
          January through {ytdCapMonth === 12 ? "December" : MONTH_NAMES[ytdCapMonth - 1]} for {year}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && <p className="text-sm text-destructive">{message}</p>}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Month</TableHead>
                <TableHead>Amount (USD)</TableHead>
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
                          step="0.01"
                          className="max-w-[200px]"
                          value={values[month] ?? ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [month]: e.target.value }))}
                          placeholder="0"
                        />
                      ) : (
                        <span>{formatUsd(initialByMonth[month] ?? 0)}</span>
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
          <span className="font-medium text-foreground">{formatUsd(ytd)}</span>
        </p>
      </CardContent>
    </Card>
  )
}

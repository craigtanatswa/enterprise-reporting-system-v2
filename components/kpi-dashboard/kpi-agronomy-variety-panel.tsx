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
import { TableExportMenu } from "@/components/ui/table-export-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { upsertAgronomyVarietyFieldsAction } from "@/app/actions/kpi-dashboard"
import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"
import {
  CROP_PROGRESS_OPTIONS,
  WEATHER_RISK_LEVELS,
  normalizeWeatherRiskLevel,
  type AgronomyVarietyData,
  type AgronomyVarietyTableMetricId,
} from "@/lib/kpi-dashboard/agronomy-metrics"

function numToInput(n: number): string {
  if (!Number.isFinite(n) || n === 0) return ""
  return String(n)
}

function parseNum(s: string): number {
  const t = s.trim()
  if (t === "") return 0
  const n = parseFloat(t)
  return Number.isNaN(n) ? NaN : n
}

/** Planted ÷ planned × 100; `null` when planned is zero or inputs are invalid. */
function plantingProgressPercent(planned: number, planted: number): number | null {
  if (!Number.isFinite(planned) || !Number.isFinite(planted) || planned <= 0) return null
  const pct = (planted / planned) * 100
  return Number.isFinite(pct) ? pct : null
}

function formatPlantingProgressDisplay(planned: number, planted: number): string {
  const pct = plantingProgressPercent(planned, planted)
  if (pct === null) return "—"
  return `${pct.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

/** Actual ÷ expected × 100; `null` when expected is zero or inputs are invalid. */
function yieldActualVsExpectedPercent(expectedTonnes: number, actualTonnes: number): number | null {
  if (!Number.isFinite(expectedTonnes) || !Number.isFinite(actualTonnes) || expectedTonnes <= 0) {
    return null
  }
  const pct = (actualTonnes / expectedTonnes) * 100
  return Number.isFinite(pct) ? pct : null
}

function formatYieldVsExpectedDisplay(expectedTonnes: number, actualTonnes: number): string {
  const pct = yieldActualVsExpectedPercent(expectedTonnes, actualTonnes)
  if (pct === null) return "—"
  return `${pct.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`
}

const WEATHER_RISK_SELECT_UNSET = "__unset__"

type LocalRow = {
  hectares_planned: string
  hectares_planted: string
  expected_yield_tonnes: string
  actual_yield_tonnes: string
  yield_per_hectare: string
  crop_progress_status: string
  variety_performance: string
  input_cost_per_hectare: string
  weather_risk_level: string
}

function rowFromData(d: AgronomyVarietyData): LocalRow {
  return {
    hectares_planned: numToInput(d.hectares_planned),
    hectares_planted: numToInput(d.hectares_planted),
    expected_yield_tonnes: numToInput(d.expected_yield_tonnes),
    actual_yield_tonnes: numToInput(d.actual_yield_tonnes),
    yield_per_hectare: numToInput(d.yield_per_hectare),
    crop_progress_status: d.crop_progress_status,
    variety_performance: d.variety_performance,
    input_cost_per_hectare: numToInput(d.input_cost_per_hectare),
    weather_risk_level: normalizeWeatherRiskLevel(d.weather_risk_level),
  }
}

const METRIC_COPY: Record<
  AgronomyVarietyTableMetricId,
  { title: string; description: string; fileBase: string; sheet: string }
> = {
  "agro-hectares": {
    title: "Hectares by variety",
    description:
      "Planned vs planted area per seed variety. Planting progress % is planted ÷ planned for each row. Dashboard totals are summed across varieties.",
    fileBase: "agronomy-hectares-by-variety",
    sheet: "Hectares",
  },
  "agro-yield": {
    title: "Yield by variety",
    description:
      "Expected vs actual production (tonnes) per variety. Progress % is actual ÷ expected for each row.",
    fileBase: "agronomy-yield-by-variety",
    sheet: "Yield",
  },
  "agro-yield-per-ha": {
    title: "Yield per hectare",
    description:
      "Tonnes per hectare per variety. The department headline is the highest yield/ha among varieties (stored value, or implied from actual ÷ planted if none stored).",
    fileBase: "agronomy-yield-per-ha",
    sheet: "Yield per ha",
  },
  "agro-crop-progress": {
    title: "Crop progress",
    description: "Current crop stage per variety. Use the suggestions or type your own status.",
    fileBase: "agronomy-crop-progress",
    sheet: "Progress",
  },
  "agro-input-cost": {
    title: "Input cost per hectare",
    description: "USD per planted hectare (input costs). Headline is weighted by planted area.",
    fileBase: "agronomy-input-cost-per-ha",
    sheet: "Input cost",
  },
  "agro-weather-risk": {
    title: "Weather impact risk by variety",
    description:
      "Assign Low, Moderate, High, or Extreme per variety. The department headline shows the worst (highest) risk among varieties that are rated.",
    fileBase: "agronomy-weather-risk-by-variety",
    sheet: "Weather risk",
  },
}

export function KpiAgronomyVarietyPanel({
  segmentId,
  metricId,
  initialByVariety,
  canEdit,
  onSaved,
}: {
  segmentId: string
  metricId: AgronomyVarietyTableMetricId
  initialByVariety: Record<string, AgronomyVarietyData>
  canEdit: boolean
  onSaved: () => void
}) {
  const copy = METRIC_COPY[metricId]

  const buildLocal = () => {
    const o: Record<string, LocalRow> = {}
    for (const v of SALES_PRODUCT_VARIETIES) {
      const d = initialByVariety[v.id]
      o[v.id] = rowFromData(
        d ?? {
          variety_id: v.id,
          hectares_planned: 0,
          hectares_planted: 0,
          expected_yield_tonnes: 0,
          actual_yield_tonnes: 0,
          yield_per_hectare: 0,
          crop_progress_status: "",
          variety_performance: "",
          input_cost_per_hectare: 0,
          weather_risk_level: "",
          updated_at: new Date(0).toISOString(),
        }
      )
    }
    return o
  }

  const [values, setValues] = useState<Record<string, LocalRow>>(buildLocal)
  const [bulkPending, setBulkPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setValues(buildLocal())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when server data changes
  }, [initialByVariety])

  const resolvedRow = (vid: string, local: LocalRow): AgronomyVarietyData => {
    const init = initialByVariety[vid] ?? {
      variety_id: vid,
      hectares_planned: 0,
      hectares_planted: 0,
      expected_yield_tonnes: 0,
      actual_yield_tonnes: 0,
      yield_per_hectare: 0,
      crop_progress_status: "",
      variety_performance: "",
      input_cost_per_hectare: 0,
      weather_risk_level: "",
      updated_at: new Date(0).toISOString(),
    }
    if (!canEdit) return init
    return {
      variety_id: vid,
      hectares_planned: parseNum(local.hectares_planned),
      hectares_planted: parseNum(local.hectares_planted),
      expected_yield_tonnes: parseNum(local.expected_yield_tonnes),
      actual_yield_tonnes: parseNum(local.actual_yield_tonnes),
      yield_per_hectare: parseNum(local.yield_per_hectare),
      crop_progress_status: local.crop_progress_status.trim(),
      variety_performance: local.variety_performance,
      input_cost_per_hectare: parseNum(local.input_cost_per_hectare),
      weather_risk_level: normalizeWeatherRiskLevel(local.weather_risk_level),
      updated_at: init.updated_at,
    }
  }

  const exportData = useMemo(() => {
    const headers: string[] = ["Category", "Variety"]
    if (metricId === "agro-hectares") {
      headers.push("Planned (ha)", "Planted (ha)", "Planting progress (%)")
    } else if (metricId === "agro-yield") {
      headers.push("Expected (t)", "Actual (t)", "Actual vs expected (%)")
    } else if (metricId === "agro-yield-per-ha") {
      headers.push("Yield (t/ha)", "Planted (ha)", "Implied t/ha")
    } else if (metricId === "agro-crop-progress") {
      headers.push("Progress status")
    } else if (metricId === "agro-input-cost") {
      headers.push("Input cost (USD/ha)", "Planted (ha)")
    } else {
      headers.push("Weather risk")
    }

    const rows = SALES_PRODUCT_VARIETIES.map((v) => {
      const loc = values[v.id]!
      const r = resolvedRow(v.id, loc)
      const implied =
        r.hectares_planted > 0 && r.actual_yield_tonnes > 0
          ? r.actual_yield_tonnes / r.hectares_planted
          : 0
      const base = [v.category, v.label]
      if (metricId === "agro-hectares") {
        const pct = plantingProgressPercent(r.hectares_planned, r.hectares_planted)
        return [...base, r.hectares_planned, r.hectares_planted, pct !== null ? Math.round(pct * 10) / 10 : ""]
      }
      if (metricId === "agro-yield") {
        const yPct = yieldActualVsExpectedPercent(r.expected_yield_tonnes, r.actual_yield_tonnes)
        return [
          ...base,
          r.expected_yield_tonnes,
          r.actual_yield_tonnes,
          yPct !== null ? Math.round(yPct * 10) / 10 : "",
        ]
      }
      if (metricId === "agro-yield-per-ha") {
        return [...base, r.yield_per_hectare, r.hectares_planted, implied ? implied : ""]
      }
      if (metricId === "agro-crop-progress") {
        return [...base, r.crop_progress_status]
      }
      if (metricId === "agro-input-cost") {
        return [...base, r.input_cost_per_hectare, r.hectares_planted]
      }
      return [...base, r.weather_risk_level || ""]
    })

    return { headers, rows }
  }, [values, metricId, canEdit, initialByVariety])

  const patchForMetric = (
    vid: string,
    local: LocalRow
  ): Parameters<typeof upsertAgronomyVarietyFieldsAction>[0]["patch"] | null => {
    const init = initialByVariety[vid] ?? {
      variety_id: vid,
      hectares_planned: 0,
      hectares_planted: 0,
      expected_yield_tonnes: 0,
      actual_yield_tonnes: 0,
      yield_per_hectare: 0,
      crop_progress_status: "",
      variety_performance: "",
      input_cost_per_hectare: 0,
      weather_risk_level: "",
      updated_at: new Date(0).toISOString(),
    }

    const p = (field: keyof LocalRow): number => parseNum(local[field] as string)

    if (metricId === "agro-hectares") {
      const planned = p("hectares_planned")
      const planted = p("hectares_planted")
      if (Number.isNaN(planned) || Number.isNaN(planted)) return null
      if (planned === init.hectares_planned && planted === init.hectares_planted) return {}
      return { hectares_planned: planned, hectares_planted: planted }
    }

    if (metricId === "agro-yield") {
      const e = p("expected_yield_tonnes")
      const a = p("actual_yield_tonnes")
      if (Number.isNaN(e) || Number.isNaN(a)) return null
      if (e === init.expected_yield_tonnes && a === init.actual_yield_tonnes) return {}
      return { expected_yield_tonnes: e, actual_yield_tonnes: a }
    }

    if (metricId === "agro-yield-per-ha") {
      const y = p("yield_per_hectare")
      if (Number.isNaN(y)) return null
      if (y === init.yield_per_hectare) return {}
      return { yield_per_hectare: y }
    }

    if (metricId === "agro-crop-progress") {
      const s = local.crop_progress_status.trim()
      if (s === init.crop_progress_status) return {}
      return { crop_progress_status: s }
    }

    if (metricId === "agro-weather-risk") {
      const w = normalizeWeatherRiskLevel(local.weather_risk_level)
      const prev = normalizeWeatherRiskLevel(init.weather_risk_level)
      if (w === prev) return {}
      return { weather_risk_level: w }
    }

    if (metricId === "agro-input-cost") {
      const c = p("input_cost_per_hectare")
      if (Number.isNaN(c)) return null
      if (c === init.input_cost_per_hectare) return {}
      return { input_cost_per_hectare: c }
    }

    return {}
  }

  const saveAllChanged = async () => {
    setMessage(null)
    setBulkPending(true)
    try {
      for (const v of SALES_PRODUCT_VARIETIES) {
        const local = values[v.id]!
        const patch = patchForMetric(v.id, local)
        if (patch === null) {
          setMessage("Fix invalid numbers before saving.")
          setBulkPending(false)
          return
        }
        if (Object.keys(patch).length === 0) continue
        const res = await upsertAgronomyVarietyFieldsAction({
          segmentId,
          varietyId: v.id,
          patch,
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

  const setCell = (vid: string, partial: Partial<LocalRow>) => {
    setValues((prev) => ({
      ...prev,
      [vid]: { ...prev[vid]!, ...partial },
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <TableExportMenu
              fileBaseName={copy.fileBase}
              sheetName={copy.sheet}
              title={`${copy.title} (Agronomy)`}
              headers={exportData.headers}
              rows={exportData.rows}
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
        {metricId === "agro-crop-progress" && canEdit && (
          <datalist id="agro-crop-progress-suggestions">
            {CROP_PROGRESS_OPTIONS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        )}
        <div className="rounded-md border overflow-x-auto max-h-[min(70vh,720px)] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Variety</TableHead>
                {metricId === "agro-hectares" && (
                  <>
                    <TableHead className="text-right min-w-[120px]">Planned (ha)</TableHead>
                    <TableHead className="text-right min-w-[120px]">Planted (ha)</TableHead>
                    <TableHead className="text-right min-w-[100px]">Progress</TableHead>
                  </>
                )}
                {metricId === "agro-yield" && (
                  <>
                    <TableHead className="text-right min-w-[120px]">Expected (t)</TableHead>
                    <TableHead className="text-right min-w-[120px]">Actual (t)</TableHead>
                    <TableHead className="text-right min-w-[100px]">Progress</TableHead>
                  </>
                )}
                {metricId === "agro-yield-per-ha" && (
                  <TableHead className="text-right min-w-[120px]">Yield (t/ha)</TableHead>
                )}
                {metricId === "agro-crop-progress" && (
                  <TableHead className="min-w-[220px]">Status</TableHead>
                )}
                {metricId === "agro-weather-risk" && (
                  <TableHead className="min-w-[180px]">Weather risk</TableHead>
                )}
                {metricId === "agro-input-cost" && (
                  <TableHead className="text-right min-w-[140px]">USD / ha</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {SALES_PRODUCT_VARIETIES.map((v) => {
                const loc = values[v.id]!
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <span className="text-muted-foreground text-xs block">{v.category}</span>
                      <span className="font-medium text-sm">{v.label}</span>
                    </TableCell>
                    {metricId === "agro-hectares" && (
                      <>
                        <TableCell className="text-right p-1 align-middle">
                          {canEdit ? (
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="h-8 text-sm tabular-nums ml-auto max-w-[120px]"
                              value={loc.hectares_planned}
                              onChange={(e) => setCell(v.id, { hectares_planned: e.target.value })}
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm tabular-nums inline-block py-2 pr-2">
                              {(initialByVariety[v.id]?.hectares_planned ?? 0).toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              }) || "—"}
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
                              value={loc.hectares_planted}
                              onChange={(e) => setCell(v.id, { hectares_planted: e.target.value })}
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm tabular-nums inline-block py-2 pr-2">
                              {(initialByVariety[v.id]?.hectares_planted ?? 0).toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              }) || "—"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right p-1 align-middle">
                          <span className="text-sm tabular-nums inline-block py-2 pr-2 text-muted-foreground">
                            {(() => {
                              if (canEdit) {
                                const r = resolvedRow(v.id, loc)
                                return formatPlantingProgressDisplay(r.hectares_planned, r.hectares_planted)
                              }
                              return formatPlantingProgressDisplay(
                                initialByVariety[v.id]?.hectares_planned ?? 0,
                                initialByVariety[v.id]?.hectares_planted ?? 0
                              )
                            })()}
                          </span>
                        </TableCell>
                      </>
                    )}
                    {metricId === "agro-yield" && (
                      <>
                        <TableCell className="text-right p-1 align-middle">
                          {canEdit ? (
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="h-8 text-sm tabular-nums ml-auto max-w-[120px]"
                              value={loc.expected_yield_tonnes}
                              onChange={(e) => setCell(v.id, { expected_yield_tonnes: e.target.value })}
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm tabular-nums inline-block py-2 pr-2">
                              {(initialByVariety[v.id]?.expected_yield_tonnes ?? 0).toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              }) || "—"}
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
                              value={loc.actual_yield_tonnes}
                              onChange={(e) => setCell(v.id, { actual_yield_tonnes: e.target.value })}
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-sm tabular-nums inline-block py-2 pr-2">
                              {(initialByVariety[v.id]?.actual_yield_tonnes ?? 0).toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              }) || "—"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right p-1 align-middle">
                          <span className="text-sm tabular-nums inline-block py-2 pr-2 text-muted-foreground">
                            {(() => {
                              if (canEdit) {
                                const r = resolvedRow(v.id, loc)
                                return formatYieldVsExpectedDisplay(
                                  r.expected_yield_tonnes,
                                  r.actual_yield_tonnes
                                )
                              }
                              return formatYieldVsExpectedDisplay(
                                initialByVariety[v.id]?.expected_yield_tonnes ?? 0,
                                initialByVariety[v.id]?.actual_yield_tonnes ?? 0
                              )
                            })()}
                          </span>
                        </TableCell>
                      </>
                    )}
                    {metricId === "agro-yield-per-ha" && (
                      <TableCell className="text-right p-1 align-middle">
                        {canEdit ? (
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            className="h-8 text-sm tabular-nums ml-auto max-w-[120px]"
                            value={loc.yield_per_hectare}
                            onChange={(e) => setCell(v.id, { yield_per_hectare: e.target.value })}
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-sm tabular-nums inline-block py-2 pr-2">
                            {(initialByVariety[v.id]?.yield_per_hectare ?? 0).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            }) || "—"}
                          </span>
                        )}
                      </TableCell>
                    )}
                    {metricId === "agro-crop-progress" && (
                      <TableCell className="p-1 align-middle">
                        {canEdit ? (
                          <Input
                            list="agro-crop-progress-suggestions"
                            className="h-8 text-sm"
                            value={loc.crop_progress_status}
                            onChange={(e) => setCell(v.id, { crop_progress_status: e.target.value })}
                            placeholder="e.g. Vegetative"
                          />
                        ) : (
                          <span className="text-sm py-2 inline-block">
                            {initialByVariety[v.id]?.crop_progress_status?.trim() || "—"}
                          </span>
                        )}
                      </TableCell>
                    )}
                    {metricId === "agro-weather-risk" && (
                      <TableCell className="p-1 align-middle min-w-[180px]">
                        {canEdit ? (
                          <Select
                            value={
                              normalizeWeatherRiskLevel(loc.weather_risk_level) || WEATHER_RISK_SELECT_UNSET
                            }
                            onValueChange={(val) =>
                              setCell(v.id, {
                                weather_risk_level: val === WEATHER_RISK_SELECT_UNSET ? "" : val,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-sm w-full max-w-[200px]">
                              <SelectValue placeholder="Select risk" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={WEATHER_RISK_SELECT_UNSET}>Not set</SelectItem>
                              {WEATHER_RISK_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm py-2 inline-block">
                            {normalizeWeatherRiskLevel(initialByVariety[v.id]?.weather_risk_level) || "—"}
                          </span>
                        )}
                      </TableCell>
                    )}
                    {metricId === "agro-input-cost" && (
                      <TableCell className="text-right p-1 align-middle">
                        {canEdit ? (
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            className="h-8 text-sm tabular-nums ml-auto max-w-[140px]"
                            value={loc.input_cost_per_hectare}
                            onChange={(e) => setCell(v.id, { input_cost_per_hectare: e.target.value })}
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-sm tabular-nums inline-block py-2 pr-2">
                            {(initialByVariety[v.id]?.input_cost_per_hectare ?? 0).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            }) || "—"}
                          </span>
                        )}
                      </TableCell>
                    )}
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

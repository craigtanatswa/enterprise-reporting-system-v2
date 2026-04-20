import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"

/** Current month index (1–12) for YTD when `year` is the current calendar year; else 12. */
export function ytdCapMonth(year: number, reference: Date = new Date()): number {
  const y = reference.getFullYear()
  return y === year ? reference.getMonth() + 1 : 12
}

/** Sum of monthly flows Jan..capMonth per variety (processed / packaged). */
export function flowYtdTonnesByVariety(
  cells: Record<string, Record<number, number>>,
  capMonth: number
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const v of SALES_PRODUCT_VARIETIES) {
    let s = 0
    for (let m = 1; m <= capMonth; m++) {
      s += Number(cells[v.id]?.[m] ?? 0)
    }
    out[v.id] = s
  }
  return out
}

/** Forward-filled closing tonnes at end of capMonth per variety (finished warehouse). */
export function inventoryClosingTonnesByVariety(
  cells: Record<string, Record<number, number>>,
  capMonth: number
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const v of SALES_PRODUCT_VARIETIES) {
    let last = 0
    for (let m = 1; m <= capMonth; m++) {
      const t = cells[v.id]?.[m]
      if (t !== undefined && !Number.isNaN(Number(t))) last = Number(t)
    }
    out[v.id] = last
  }
  return out
}

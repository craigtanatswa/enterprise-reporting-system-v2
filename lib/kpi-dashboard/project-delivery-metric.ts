/** Headline % is “on schedule” (or similar); breakdown lives in JSON `details`. */

export type ProjectDeliveryDetails = {
  scheduleLabel: string
  projectsSummary: string
  portfolio: string
  timeline: string
  budget: string
  issues: string
  contractors: string
}

export const PROJECT_DELIVERY_METRIC_IDS = ["prop-project-delivery", "ict-projects"] as const

export type ProjectDeliveryMetricId = (typeof PROJECT_DELIVERY_METRIC_IDS)[number]

export function isProjectDeliveryMetricId(metricId: string): metricId is ProjectDeliveryMetricId {
  return (PROJECT_DELIVERY_METRIC_IDS as readonly string[]).includes(metricId)
}

const defaults: ProjectDeliveryDetails = {
  scheduleLabel: "on schedule",
  projectsSummary: "",
  portfolio: "",
  timeline: "",
  budget: "",
  issues: "",
  contractors: "",
}

function coerceString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function normalizeParsed(o: Record<string, unknown>): ProjectDeliveryDetails {
  return {
    scheduleLabel: coerceString(o.scheduleLabel) || defaults.scheduleLabel,
    projectsSummary: coerceString(o.projectsSummary),
    portfolio: coerceString(o.portfolio),
    timeline: coerceString(o.timeline),
    budget: coerceString(o.budget),
    issues: coerceString(o.issues),
    contractors: coerceString(o.contractors),
  }
}

/**
 * Parses structured project-delivery JSON from `details`.
 * If the payload is not JSON, treats the whole string as legacy `portfolio` text.
 */
export function parseProjectDeliveryDetails(
  raw: string | undefined | null,
  legacyPlainDetails?: string | null
): ProjectDeliveryDetails {
  const trimmed = raw?.trim() ?? ""
  if (!trimmed) {
    return {
      ...defaults,
      portfolio: (legacyPlainDetails ?? "").trim(),
    }
  }
  try {
    const o = JSON.parse(trimmed) as unknown
    if (o && typeof o === "object" && !Array.isArray(o)) {
      return normalizeParsed(o as Record<string, unknown>)
    }
  } catch {
    /* fall through */
  }
  return {
    ...defaults,
    portfolio: trimmed || (legacyPlainDetails ?? "").trim(),
  }
}

export function serializeProjectDeliveryDetails(d: ProjectDeliveryDetails): string {
  return JSON.stringify({
    scheduleLabel: d.scheduleLabel.trim() || defaults.scheduleLabel,
    projectsSummary: d.projectsSummary,
    portfolio: d.portfolio,
    timeline: d.timeline,
    budget: d.budget,
    issues: d.issues,
    contractors: d.contractors,
  })
}

export function defaultProjectDeliverySeed(
  partial: Partial<ProjectDeliveryDetails> = {}
): ProjectDeliveryDetails {
  return { ...defaults, ...partial }
}

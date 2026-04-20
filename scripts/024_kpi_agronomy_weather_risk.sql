-- Per-variety weather impact risk for agronomy KPI (Low / Moderate / High / Extreme).
-- Run after 023_kpi_agronomy_by_variety.sql.

ALTER TABLE public.kpi_agronomy_by_variety
  ADD COLUMN IF NOT EXISTS weather_risk_level text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.kpi_agronomy_by_variety.weather_risk_level IS
  'Weather risk per variety: Low, Moderate, High, or Extreme; empty string if not set.';

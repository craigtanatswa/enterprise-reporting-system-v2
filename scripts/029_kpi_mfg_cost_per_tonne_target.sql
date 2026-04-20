-- Per-variety target cost (USD/tonne) for Manufacturing cost-per-tonne KPI.
-- Run after 028_kpi_mfg_cost_per_tonne_by_variety.sql.

ALTER TABLE public.kpi_mfg_cost_per_tonne_by_variety
  ADD COLUMN IF NOT EXISTS target_usd_per_tonne double precision NOT NULL DEFAULT 0;

-- Annual plan (tonnes) by variety for processed output, packaged seed, and finished warehouse.
-- UI progress = actual ÷ annual plan (YTD or closing actual vs full-year plan per variety).
-- Run after 031_kpi_mfg_finished_product_warehouse_monthly.sql.

CREATE TABLE IF NOT EXISTS public.kpi_mfg_tonnes_target_by_variety (
  segment_id text NOT NULL,
  year int NOT NULL,
  metric_id text NOT NULL,
  variety_id text NOT NULL,
  target_tonnes double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (segment_id, year, metric_id, variety_id),
  CONSTRAINT kpi_mfg_tonnes_target_metric_chk CHECK (
    metric_id IN (
      'mfg-processed-output',
      'mfg-packaged',
      'mfg-finished-warehouse'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_kpi_mfg_tonnes_target_segment_year
  ON public.kpi_mfg_tonnes_target_by_variety (segment_id, year);

ALTER TABLE public.kpi_mfg_tonnes_target_by_variety ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpi_mfg_tonnes_target_by_variety_select ON public.kpi_mfg_tonnes_target_by_variety
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_tonnes_target_by_variety_insert ON public.kpi_mfg_tonnes_target_by_variety
FOR INSERT WITH CHECK (
  updated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_tonnes_target_by_variety_update ON public.kpi_mfg_tonnes_target_by_variety
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
)
WITH CHECK (
  updated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

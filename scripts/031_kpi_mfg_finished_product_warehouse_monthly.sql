-- Finished product in warehouse: closing inventory (tonnes) at end of month, by variety.
-- Same table shape as packaged seed; semantics are snapshot stock, not monthly production flow.
-- Run after 026_kpi_mfg_processed_packaged_monthly.sql.

CREATE TABLE IF NOT EXISTS public.kpi_mfg_finished_product_warehouse_monthly (
  segment_id text NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  variety_id text NOT NULL,
  -- Closing tonnes in warehouse at month-end for this variety (not a period flow total).
  tonnes_in_warehouse double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (segment_id, year, month, variety_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_mfg_finished_warehouse_segment_year
  ON public.kpi_mfg_finished_product_warehouse_monthly (segment_id, year);

ALTER TABLE public.kpi_mfg_finished_product_warehouse_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpi_mfg_finished_product_warehouse_monthly_select ON public.kpi_mfg_finished_product_warehouse_monthly
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_finished_product_warehouse_monthly_insert ON public.kpi_mfg_finished_product_warehouse_monthly
FOR INSERT WITH CHECK (
  updated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_finished_product_warehouse_monthly_update ON public.kpi_mfg_finished_product_warehouse_monthly
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

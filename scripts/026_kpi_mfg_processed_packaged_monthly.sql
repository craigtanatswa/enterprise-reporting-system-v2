-- Processed output and packaged seed (tonnes) by variety and month for Manufacturing KPI.
-- Run after 025_kpi_mfg_raw_seed_monthly.sql.

CREATE TABLE IF NOT EXISTS public.kpi_mfg_processed_output_monthly (
  segment_id text NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  variety_id text NOT NULL,
  tonnes_processed double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (segment_id, year, month, variety_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_mfg_processed_segment_year
  ON public.kpi_mfg_processed_output_monthly (segment_id, year);

CREATE TABLE IF NOT EXISTS public.kpi_mfg_packaged_seed_monthly (
  segment_id text NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  variety_id text NOT NULL,
  tonnes_packaged double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (segment_id, year, month, variety_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_mfg_packaged_segment_year
  ON public.kpi_mfg_packaged_seed_monthly (segment_id, year);

ALTER TABLE public.kpi_mfg_processed_output_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_mfg_packaged_seed_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpi_mfg_processed_output_monthly_select ON public.kpi_mfg_processed_output_monthly
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_processed_output_monthly_insert ON public.kpi_mfg_processed_output_monthly
FOR INSERT WITH CHECK (
  updated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_processed_output_monthly_update ON public.kpi_mfg_processed_output_monthly
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

CREATE POLICY kpi_mfg_packaged_seed_monthly_select ON public.kpi_mfg_packaged_seed_monthly
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_packaged_seed_monthly_insert ON public.kpi_mfg_packaged_seed_monthly
FOR INSERT WITH CHECK (
  updated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_packaged_seed_monthly_update ON public.kpi_mfg_packaged_seed_monthly
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

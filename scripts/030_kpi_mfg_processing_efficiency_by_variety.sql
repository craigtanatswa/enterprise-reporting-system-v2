-- Processing efficiency (%) actual vs per-variety target for Manufacturing KPI.
-- Run after 029_kpi_mfg_cost_per_tonne_target.sql (or 028 if 029 not used).

CREATE TABLE IF NOT EXISTS public.kpi_mfg_processing_efficiency_by_variety (
  segment_id text NOT NULL,
  variety_id text NOT NULL,
  efficiency_percent double precision NOT NULL DEFAULT 0,
  target_percent double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (segment_id, variety_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_mfg_efficiency_segment
  ON public.kpi_mfg_processing_efficiency_by_variety (segment_id);

ALTER TABLE public.kpi_mfg_processing_efficiency_by_variety ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpi_mfg_processing_efficiency_by_variety_select ON public.kpi_mfg_processing_efficiency_by_variety
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_processing_efficiency_by_variety_insert ON public.kpi_mfg_processing_efficiency_by_variety
FOR INSERT WITH CHECK (
  updated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_mfg_processing_efficiency_by_variety_update ON public.kpi_mfg_processing_efficiency_by_variety
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

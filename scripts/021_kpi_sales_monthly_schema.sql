-- Monthly sales revenue (YTD driver) and volume by variety for KPI dashboard.
-- Run after 020_kpi_dashboard_schema.sql.

CREATE TABLE IF NOT EXISTS public.kpi_sales_revenue_monthly (
  segment_id text NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  amount_usd double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (segment_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_kpi_sales_revenue_segment_year
  ON public.kpi_sales_revenue_monthly (segment_id, year);

CREATE TABLE IF NOT EXISTS public.kpi_sales_volume_monthly (
  segment_id text NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  variety_id text NOT NULL,
  volume_tonnes double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (segment_id, year, month, variety_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_sales_volume_segment_year
  ON public.kpi_sales_volume_monthly (segment_id, year);

ALTER TABLE public.kpi_sales_revenue_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_sales_volume_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpi_sales_revenue_monthly_select ON public.kpi_sales_revenue_monthly
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_sales_revenue_monthly_insert ON public.kpi_sales_revenue_monthly
FOR INSERT WITH CHECK (
  updated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_sales_revenue_monthly_update ON public.kpi_sales_revenue_monthly
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

CREATE POLICY kpi_sales_volume_monthly_select ON public.kpi_sales_volume_monthly
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_sales_volume_monthly_insert ON public.kpi_sales_volume_monthly
FOR INSERT WITH CHECK (
  updated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_sales_volume_monthly_update ON public.kpi_sales_volume_monthly
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

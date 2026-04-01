-- KPI dashboard: metric overrides, department comments, MD feedback
-- Run after base auth/profiles exist.

CREATE TABLE IF NOT EXISTS public.kpi_metric_overrides (
  segment_id text NOT NULL,
  metric_id text NOT NULL,
  value_numeric double precision,
  value_text text,
  details text,
  status text CHECK (status IS NULL OR status IN ('green', 'amber', 'red')),
  trend text CHECK (trend IS NULL OR trend IN ('up', 'down', 'stable')),
  previous_numeric double precision,
  previous_text text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  PRIMARY KEY (segment_id, metric_id)
);

CREATE TABLE IF NOT EXISTS public.kpi_department_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id text NOT NULL,
  metric_id text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  author_display text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpi_dept_comments_segment_metric
  ON public.kpi_department_comments (segment_id, metric_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.kpi_md_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id text NOT NULL,
  metric_id text,
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpi_md_comments_segment
  ON public.kpi_md_comments (segment_id, created_at DESC);

ALTER TABLE public.kpi_metric_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_department_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_md_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY kpi_metric_overrides_select ON public.kpi_metric_overrides
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_metric_overrides_insert ON public.kpi_metric_overrides
FOR INSERT WITH CHECK (
  updated_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_metric_overrides_update ON public.kpi_metric_overrides
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

CREATE POLICY kpi_department_comments_select ON public.kpi_department_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_department_comments_insert ON public.kpi_department_comments
FOR INSERT WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_md_comments_select ON public.kpi_md_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_md_comments_insert ON public.kpi_md_comments
FOR INSERT WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

CREATE POLICY kpi_md_comments_update ON public.kpi_md_comments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_active = true
  )
);

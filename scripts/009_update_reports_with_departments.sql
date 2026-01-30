-- =========================================
-- Update All Report Tables with Department References
-- =========================================

-- Add department and sub-department to documents
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS department department_type,
ADD COLUMN IF NOT EXISTS sub_department sub_department_type,
ADD COLUMN IF NOT EXISTS report_type TEXT,
ADD COLUMN IF NOT EXISTS reporting_period TEXT;

-- Update existing documents to have department from uploader
UPDATE public.documents d
SET department = p.department,
    sub_department = p.sub_department
FROM public.profiles p
WHERE d.uploaded_by = p.id
AND d.department IS NULL;

-- Make department NOT NULL after migration
ALTER TABLE public.documents
ALTER COLUMN department SET NOT NULL;

-- Add department to production reports  
ALTER TABLE public.production_reports
ADD COLUMN IF NOT EXISTS department department_type DEFAULT 'OPERATIONS',
ADD COLUMN IF NOT EXISTS sub_department sub_department_type DEFAULT 'FACTORY',
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);

ALTER TABLE public.production_reports
ALTER COLUMN department SET NOT NULL;

-- Add department to dispatch reports
ALTER TABLE public.dispatch_reports
ADD COLUMN IF NOT EXISTS department department_type DEFAULT 'OPERATIONS',
ADD COLUMN IF NOT EXISTS sub_department sub_department_type DEFAULT 'FACTORY',
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);

ALTER TABLE public.dispatch_reports
ALTER COLUMN department SET NOT NULL;

-- Add department to processing reports
ALTER TABLE public.processing_reports
ADD COLUMN IF NOT EXISTS department department_type DEFAULT 'OPERATIONS',
ADD COLUMN IF NOT EXISTS sub_department sub_department_type DEFAULT 'FACTORY',
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);

ALTER TABLE public.processing_reports
ALTER COLUMN department SET NOT NULL;

-- =========================================
-- Update RLS Policies for Reports (Department-Scoped)
-- =========================================

-- Documents: Users can only see documents from their department (unless admin)
DROP POLICY IF EXISTS "documents_select_own_department" ON public.documents;
DROP POLICY IF EXISTS "documents_select_admin" ON public.documents;

CREATE POLICY "documents_select_own_department"
  ON public.documents FOR SELECT
  USING (
    department = (SELECT department FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR')
    )
  );

-- Production Reports: Department-scoped access
DROP POLICY IF EXISTS "production_reports_select_department" ON public.production_reports;

CREATE POLICY "production_reports_select_department"
  ON public.production_reports FOR SELECT
  USING (
    department = (SELECT department FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR', 'EXECUTIVE')
    )
  );

-- Dispatch Reports: Department-scoped access
DROP POLICY IF EXISTS "dispatch_reports_select_department" ON public.dispatch_reports;

CREATE POLICY "dispatch_reports_select_department"
  ON public.dispatch_reports FOR SELECT
  USING (
    department = (SELECT department FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR', 'EXECUTIVE')
    )
  );

-- Processing Reports: Department-scoped access
DROP POLICY IF EXISTS "processing_reports_select_department" ON public.processing_reports;

CREATE POLICY "processing_reports_select_department"
  ON public.processing_reports FOR SELECT
  USING (
    department = (SELECT department FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR', 'EXECUTIVE')
    )
  );

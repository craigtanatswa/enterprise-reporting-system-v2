-- =====================================================
-- Update RLS Policies to Support AUDIT Department
-- Runs AFTER all enum values and data are in place
-- =====================================================

-- Drop and recreate the helper functions with AUDIT support
DROP FUNCTION IF EXISTS public.is_auditor(UUID);

CREATE OR REPLACE FUNCTION public.is_auditor(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_dept TEXT;
BEGIN
    SELECT role::TEXT, department::TEXT INTO user_role, user_dept
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN user_role = 'AUDITOR' OR user_dept = 'AUDIT';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update audit_reports RLS policies to use the enum correctly
DROP POLICY IF EXISTS "audit_reports_select" ON public.audit_reports;
DROP POLICY IF EXISTS "audit_reports_insert" ON public.audit_reports;
DROP POLICY IF EXISTS "audit_reports_update" ON public.audit_reports;

-- CRITICAL: Only MD and Audit department can view
-- Admins CANNOT view audit reports
CREATE POLICY "audit_reports_select" ON public.audit_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.role = 'MANAGING_DIRECTOR'
            OR p.department::TEXT = 'AUDIT'
            OR p.role = 'AUDITOR'
        )
    )
);

-- INSERT: Only Audit department
CREATE POLICY "audit_reports_insert" ON public.audit_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (p.department::TEXT = 'AUDIT' OR p.role = 'AUDITOR')
    )
);

-- UPDATE: Only Audit department, cannot edit approved
CREATE POLICY "audit_reports_update" ON public.audit_reports
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (p.department::TEXT = 'AUDIT' OR p.role = 'AUDITOR')
    )
    AND status != 'approved'
);

-- Update profiles RLS to ensure AUDITOR role works
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR', 'EXECUTIVE', 'AUDITOR')
    )
  );

-- =====================================================
-- ARDA Seeds Enterprise Reporting System
-- Row Level Security (RLS) Policies
-- =====================================================

-- Helper function to get user's profile
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE (
    role TEXT,
    department TEXT,
    sub_department TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.role::TEXT, p.department::TEXT, p.sub_department::TEXT, p.is_active
    FROM public.profiles p
    WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role::TEXT INTO user_role
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN user_role IN ('ADMIN', 'BOOTSTRAP_ADMIN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is Managing Director
CREATE OR REPLACE FUNCTION public.is_managing_director(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role::TEXT INTO user_role
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN user_role = 'MANAGING_DIRECTOR';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is in Audit department
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

-- =====================================================
-- 1. AGRONOMY REPORTS POLICIES
-- =====================================================

-- SELECT: Users in OPERATIONS/AGRONOMY, MD, or Executives can view
CREATE POLICY agronomy_reports_select ON public.agronomy_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            -- Same department/sub-department
            (p.department = 'OPERATIONS' AND p.sub_department = 'AGRONOMY')
            -- Managing Director can see all
            OR p.role = 'MANAGING_DIRECTOR'
            -- Executives can see all departments
            OR p.role = 'EXECUTIVE'
        )
    )
);

-- INSERT: Only users in OPERATIONS/AGRONOMY can create
CREATE POLICY agronomy_reports_insert ON public.agronomy_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'OPERATIONS'
        AND p.sub_department = 'AGRONOMY'
    )
);

-- UPDATE: Only creator or Head of Department can update
CREATE POLICY agronomy_reports_update ON public.agronomy_reports
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            created_by = auth.uid()
            OR (p.department = 'OPERATIONS' AND p.role = 'HEAD_OF_DEPARTMENT')
        )
    )
    AND status != 'approved' -- Cannot edit approved reports
);

-- =====================================================
-- 2. FACTORY REPORTS POLICIES (QC & Inventory)
-- =====================================================

CREATE POLICY factory_qc_select ON public.factory_quality_control
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            (p.department = 'OPERATIONS' AND p.sub_department = 'FACTORY')
            OR p.role = 'MANAGING_DIRECTOR'
            OR p.role = 'EXECUTIVE'
        )
    )
);

CREATE POLICY factory_qc_insert ON public.factory_quality_control
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'OPERATIONS'
        AND p.sub_department = 'FACTORY'
    )
);

CREATE POLICY factory_inventory_select ON public.factory_inventory
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            (p.department = 'OPERATIONS' AND p.sub_department = 'FACTORY')
            OR p.role = 'MANAGING_DIRECTOR'
            OR p.role = 'EXECUTIVE'
            OR p.department = 'FINANCE' -- Finance can view inventory
        )
    )
);

CREATE POLICY factory_inventory_insert ON public.factory_inventory
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'OPERATIONS'
        AND p.sub_department = 'FACTORY'
    )
);

-- =====================================================
-- 3. FINANCE REPORTS POLICIES (RESTRICTED)
-- =====================================================

-- SELECT: Only Finance department, MD, and Executives
CREATE POLICY finance_reports_select ON public.finance_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.department = 'FINANCE'
            OR p.role = 'MANAGING_DIRECTOR'
            OR p.role = 'EXECUTIVE'
        )
    )
);

CREATE POLICY finance_reports_insert ON public.finance_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'FINANCE'
    )
);

-- UPDATE: Cannot update if locked
CREATE POLICY finance_reports_update ON public.finance_reports
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'FINANCE'
    )
    AND is_locked = false -- Cannot edit locked reports
);

-- =====================================================
-- 4. MARKETING & SALES REPORTS POLICIES
-- =====================================================

CREATE POLICY marketing_reports_select ON public.marketing_sales_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.department = 'MARKETING_AND_SALES'
            OR p.role = 'MANAGING_DIRECTOR'
            OR p.role = 'EXECUTIVE'
        )
    )
);

CREATE POLICY marketing_reports_insert ON public.marketing_sales_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'MARKETING_AND_SALES'
    )
);

CREATE POLICY marketing_reports_update ON public.marketing_sales_reports
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            created_by = auth.uid()
            OR (p.department = 'MARKETING_AND_SALES' AND p.role IN ('HEAD_OF_DEPARTMENT', 'EXECUTIVE'))
        )
    )
    AND status != 'approved'
);

-- =====================================================
-- 5. LEGAL & COMPLIANCE REPORTS POLICIES
-- =====================================================

CREATE POLICY legal_reports_select ON public.legal_compliance_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.department = 'LEGAL_AND_COMPLIANCE'
            OR p.role = 'MANAGING_DIRECTOR'
            OR p.role = 'EXECUTIVE'
            -- Executives from other departments can view non-confidential
            OR (p.role = 'EXECUTIVE' AND is_policy_document = true)
        )
    )
);

CREATE POLICY legal_reports_insert ON public.legal_compliance_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'LEGAL_AND_COMPLIANCE'
    )
);

-- =====================================================
-- 6. HR & ADMINISTRATION REPORTS POLICIES (SENSITIVE)
-- =====================================================

-- Very restricted: Only HR, MD
CREATE POLICY hr_reports_select ON public.hr_admin_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.department = 'HUMAN_RESOURCES_AND_ADMINISTRATION'
            OR p.role = 'MANAGING_DIRECTOR'
        )
    )
);

CREATE POLICY hr_reports_insert ON public.hr_admin_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'HUMAN_RESOURCES_AND_ADMINISTRATION'
    )
);

-- =====================================================
-- 7. PROPERTIES MANAGEMENT REPORTS POLICIES
-- =====================================================

CREATE POLICY properties_reports_select ON public.properties_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.department = 'PROPERTIES_MANAGEMENT'
            OR p.role = 'MANAGING_DIRECTOR'
            OR p.role = 'EXECUTIVE'
        )
    )
);

CREATE POLICY properties_reports_insert ON public.properties_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'PROPERTIES_MANAGEMENT'
    )
);

-- =====================================================
-- 8. ICT REPORTS POLICIES
-- =====================================================

CREATE POLICY ict_reports_select ON public.ict_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.department = 'ICT_AND_DIGITAL_TRANSFORMATION'
            OR p.role = 'MANAGING_DIRECTOR'
            OR p.role = 'EXECUTIVE'
        )
    )
);

CREATE POLICY ict_reports_insert ON public.ict_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'ICT_AND_DIGITAL_TRANSFORMATION'
    )
);

-- =====================================================
-- 9. PROCUREMENT REPORTS POLICIES
-- =====================================================

CREATE POLICY procurement_reports_select ON public.procurement_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.department = 'PROCUREMENT'
            OR p.role = 'MANAGING_DIRECTOR'
            OR p.role = 'EXECUTIVE'
            OR p.department = 'FINANCE' -- Finance can view procurement
        )
    )
);

CREATE POLICY procurement_reports_insert ON public.procurement_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'PROCUREMENT'
    )
);

-- =====================================================
-- 10. PUBLIC RELATIONS REPORTS POLICIES
-- =====================================================

CREATE POLICY pr_reports_select ON public.public_relations_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.department = 'PUBLIC_RELATIONS'
            OR p.role = 'MANAGING_DIRECTOR'
            OR p.role = 'EXECUTIVE'
        )
    )
);

CREATE POLICY pr_reports_insert ON public.public_relations_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND p.department = 'PUBLIC_RELATIONS'
    )
);

-- =====================================================
-- 11. AUDIT REPORTS POLICIES (HIGHEST SECURITY)
-- =====================================================

-- CRITICAL: Only MD and Audit department can view
-- Admins CANNOT view audit reports
DROP POLICY IF EXISTS audit_reports_select ON public.audit_reports;

CREATE POLICY audit_reports_select ON public.audit_reports
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (
            p.role = 'MANAGING_DIRECTOR'
            OR p.department = 'AUDIT'
            OR p.role = 'AUDITOR'
        )
    )
);

-- INSERT: Only Audit department
DROP POLICY IF EXISTS audit_reports_insert ON public.audit_reports;

CREATE POLICY audit_reports_insert ON public.audit_reports
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (p.department = 'AUDIT' OR p.role = 'AUDITOR')
    )
);

-- UPDATE: Only Audit department, cannot edit approved
DROP POLICY IF EXISTS audit_reports_update ON public.audit_reports;

CREATE POLICY audit_reports_update ON public.audit_reports
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.is_active = true
        AND (p.department = 'AUDIT' OR p.role = 'AUDITOR')
    )
    AND status != 'approved'
);

-- DELETE: No one can delete audit reports (for audit trail)
-- Omitted intentionally - no DELETE policies

-- =====================================================
-- Grant necessary permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

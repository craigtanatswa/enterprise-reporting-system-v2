-- =====================================================
-- ARDA Seeds: GM and CSM - Seed data and RLS policies
-- RUN THIS SECOND, after 018a_add_enum_values.sql has been committed
-- =====================================================

-- Seed Corporate Services office department
INSERT INTO public.departments (name, display_name, description)
VALUES ('OFFICE_OF_CORPORATE_SERVICES', 'Office of Corporate Services', 'Corporate Services Manager oversight')
ON CONFLICT (name) DO NOTHING;

-- RLS: GM can view documents from Operations
DROP POLICY IF EXISTS "GM can view operations documents" ON public.documents;
CREATE POLICY "GM can view operations documents"
  ON public.documents FOR SELECT
  USING (
    department = 'OPERATIONS'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'GENERAL_MANAGER'
    )
  );

-- RLS: CSM can view documents from Corporate Services departments
DROP POLICY IF EXISTS "CSM can view corporate services documents" ON public.documents;
CREATE POLICY "CSM can view corporate services documents"
  ON public.documents FOR SELECT
  USING (
    department IN (
      'MARKETING_AND_SALES',
      'LEGAL_AND_COMPLIANCE',
      'HUMAN_RESOURCES_AND_ADMINISTRATION',
      'PROPERTIES_MANAGEMENT',
      'ICT_AND_DIGITAL_TRANSFORMATION'
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'CORPORATE_SERVICES_MANAGER'
    )
  );

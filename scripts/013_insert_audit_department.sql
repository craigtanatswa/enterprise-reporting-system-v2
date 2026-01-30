-- =====================================================
-- ARDA Seeds: Insert AUDIT Department
-- This runs AFTER enum values are added
-- =====================================================

-- Insert AUDIT department into departments table
INSERT INTO public.departments (name, display_name, description)
VALUES (
  'AUDIT',
  'Audit',
  'Internal audit and oversight with confidential reporting to MD'
)
ON CONFLICT (name) DO NOTHING;

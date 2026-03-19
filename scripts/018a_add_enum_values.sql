-- =====================================================
-- ARDA Seeds: Add enum values for GM and CSM roles
-- RUN THIS FIRST - new enum values must be committed before use.
-- Then run 018b_add_gm_csm_rest.sql
-- =====================================================

-- Add new roles to user_role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'GENERAL_MANAGER' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'GENERAL_MANAGER';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CORPORATE_SERVICES_MANAGER' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'CORPORATE_SERVICES_MANAGER';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Add department type for CSM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OFFICE_OF_CORPORATE_SERVICES' AND enumtypid = 'department_type'::regtype) THEN
    ALTER TYPE department_type ADD VALUE 'OFFICE_OF_CORPORATE_SERVICES';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

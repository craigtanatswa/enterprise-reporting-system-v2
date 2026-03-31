-- =====================================================
-- Add OFFICE_OF_THE_MANAGING_DIRECTOR to department_type
-- Required for handle_new_user() trigger: it casts
-- raw_user_meta_data->>'department' to department_type.
-- Without this value, admin createUser(MD) fails with
-- "Database error creating new user" (HTTP 500).
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'department_type'
      AND e.enumlabel = 'OFFICE_OF_THE_MANAGING_DIRECTOR'
  ) THEN
    ALTER TYPE department_type ADD VALUE 'OFFICE_OF_THE_MANAGING_DIRECTOR';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

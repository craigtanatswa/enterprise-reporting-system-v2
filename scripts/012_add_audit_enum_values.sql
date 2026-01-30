-- =====================================================
-- ARDA Seeds: Add AUDIT Enum Values
-- CRITICAL: This migration ONLY adds enum values
-- No INSERTs, UPDATEs, or RLS policies in this file
-- =====================================================

-- Add AUDITOR role to user_role enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'AUDITOR' 
        AND enumtypid = 'user_role'::regtype
    ) THEN
        ALTER TYPE user_role ADD VALUE 'AUDITOR';
    END IF;
END $$;

-- Add AUDIT to department_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'AUDIT' 
        AND enumtypid = 'department_type'::regtype
    ) THEN
        ALTER TYPE department_type ADD VALUE 'AUDIT';
    END IF;
END $$;

-- This is the end of the enum addition migration
-- All usage of these enum values must be in subsequent migrations

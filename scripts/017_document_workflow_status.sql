-- =====================================================
-- ARDA Seeds: Extend document_status and document_category
-- for enterprise reporting workflow
-- =====================================================

-- Extend document_status enum (add new values if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'submitted' AND enumtypid = 'document_status'::regtype) THEN
    ALTER TYPE document_status ADD VALUE 'submitted';
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- document_status might be text in some setups
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'returned_with_comments' AND enumtypid = 'document_status'::regtype) THEN
    ALTER TYPE document_status ADD VALUE 'returned_with_comments';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reviewed_no_comments' AND enumtypid = 'document_status'::regtype) THEN
    ALTER TYPE document_status ADD VALUE 'reviewed_no_comments';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Extend document_category enum for report types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'weekly_report' AND enumtypid = 'document_category'::regtype) THEN
    ALTER TYPE document_category ADD VALUE 'weekly_report';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'quarterly_report' AND enumtypid = 'document_category'::regtype) THEN
    ALTER TYPE document_category ADD VALUE 'quarterly_report';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'balance_scorecard' AND enumtypid = 'document_category'::regtype) THEN
    ALTER TYPE document_category ADD VALUE 'balance_scorecard';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Add reviewed_by column if not exists (for HOD/MD tracking)
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

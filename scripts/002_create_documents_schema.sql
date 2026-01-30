-- =========================================
-- ARDA Seeds Enterprise Reporting Platform
-- Document Repository Schema
-- =========================================

CREATE TYPE document_category AS ENUM (
  'production',
  'quality',
  'dispatch',
  'hr',
  'accounts',
  'compliance',
  'other'
);

CREATE TYPE document_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'archived'
);

-- =========================================
-- DOCUMENTS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category document_category NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  status document_status DEFAULT 'draft',
  department department_type NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Documents policies: Users can view documents from their department, admins/MD can view all
CREATE POLICY "documents_select_policy"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('md', 'admin') 
        OR department = documents.department
      )
    )
  );

CREATE POLICY "documents_insert_policy"
  ON public.documents FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('md', 'admin', 'factory_manager', 'data_entry')
    )
  );

CREATE POLICY "documents_update_policy"
  ON public.documents FOR UPDATE
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('md', 'admin', 'factory_manager')
    )
  );

CREATE POLICY "documents_delete_policy"
  ON public.documents FOR DELETE
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('md', 'admin')
    )
  );

-- =========================================
-- DOCUMENT VERSIONS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  changes_description TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, version)
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_versions_select_policy"
  ON public.document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE d.id = document_versions.document_id
      AND (p.role IN ('md', 'admin') OR p.department = d.department)
    )
  );

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

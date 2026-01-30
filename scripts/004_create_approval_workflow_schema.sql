-- =========================================
-- ARDA Seeds Enterprise Reporting Platform
-- Approval Workflow Schema
-- =========================================

CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'revision_requested'
);

CREATE TYPE entity_type AS ENUM (
  'document',
  'production_report',
  'dispatch_report',
  'processing_report'
);

-- =========================================
-- APPROVAL WORKFLOWS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  status approval_status DEFAULT 'pending',
  current_level INTEGER DEFAULT 1,
  total_levels INTEGER NOT NULL DEFAULT 2,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_workflows_select_policy"
  ON public.approval_workflows FOR SELECT
  USING (
    auth.uid() = submitted_by
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('md', 'admin', 'factory_manager')
    )
  );

CREATE POLICY "approval_workflows_insert_policy"
  ON public.approval_workflows FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- =========================================
-- APPROVAL STEPS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.approval_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  approver_role user_role NOT NULL,
  approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status approval_status DEFAULT 'pending',
  comments TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.approval_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_steps_select_policy"
  ON public.approval_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.approval_workflows aw
      WHERE aw.id = approval_steps.workflow_id
      AND (
        auth.uid() = aw.submitted_by
        OR auth.uid() = approval_steps.approver_id
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('md', 'admin')
        )
      )
    )
  );

CREATE POLICY "approval_steps_update_policy"
  ON public.approval_steps FOR UPDATE
  USING (
    auth.uid() = approver_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = approver_role
    )
  );

-- =========================================
-- NOTIFICATIONS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  entity_type entity_type,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- FUNCTION: CREATE APPROVAL WORKFLOW
-- =========================================

CREATE OR REPLACE FUNCTION public.create_approval_workflow(
  p_entity_type entity_type,
  p_entity_id UUID,
  p_submitted_by UUID,
  p_approver_roles user_role[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workflow_id UUID;
  v_role user_role;
  v_level INTEGER := 1;
BEGIN
  -- Create workflow
  INSERT INTO public.approval_workflows (
    entity_type,
    entity_id,
    submitted_by,
    total_levels
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_submitted_by,
    ARRAY_LENGTH(p_approver_roles, 1)
  )
  RETURNING id INTO v_workflow_id;
  
  -- Create approval steps
  FOREACH v_role IN ARRAY p_approver_roles
  LOOP
    INSERT INTO public.approval_steps (
      workflow_id,
      level,
      approver_role,
      status
    )
    VALUES (
      v_workflow_id,
      v_level,
      v_role,
      'pending'
    );
    
    v_level := v_level + 1;
  END LOOP;
  
  RETURN v_workflow_id;
END;
$$;

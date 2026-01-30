-- =====================================================
-- ARDA Seeds: Account Approval & Audit Enhancements
-- Runs AFTER enum values and department inserts
-- =====================================================

-- Add approval fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_notes TEXT,
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_required BOOLEAN DEFAULT false;

-- Function to check if role requires approval
CREATE OR REPLACE FUNCTION public.role_requires_approval(p_role user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN p_role IN ('AUDITOR', 'MANAGING_DIRECTOR', 'ADMIN');
END;
$$;

-- Update handle_new_user to set approval requirements
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
  assigned_role user_role;
  needs_approval BOOLEAN;
  needs_mfa BOOLEAN;
BEGIN
  -- Check if this is the first user (bootstrap admin)
  is_first_user := public.is_first_user();
  
  IF is_first_user THEN
    assigned_role := 'BOOTSTRAP_ADMIN';
    needs_approval := false;
    needs_mfa := true;
  ELSE
    -- For all subsequent users, default to STAFF
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'STAFF');
    
    -- SECURITY: Prevent self-assignment of privileged roles
    IF assigned_role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR', 'AUDITOR') THEN
      assigned_role := 'STAFF';
    END IF;
    
    -- Check if role requires approval
    needs_approval := public.role_requires_approval(assigned_role);
    needs_mfa := assigned_role IN ('AUDITOR', 'MANAGING_DIRECTOR', 'ADMIN', 'BOOTSTRAP_ADMIN');
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    department,
    sub_department,
    phone,
    requires_approval,
    is_active,
    mfa_required
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    assigned_role,
    COALESCE((NEW.raw_user_meta_data->>'department')::department_type, 'OPERATIONS'),
    (NEW.raw_user_meta_data->>'sub_department')::sub_department_type,
    NEW.raw_user_meta_data->>'phone',
    needs_approval,
    NOT needs_approval, -- Inactive if approval required
    needs_mfa
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Log audit entry
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    new_values
  ) VALUES (
    NEW.id,
    CASE WHEN is_first_user THEN 'BOOTSTRAP_ADMIN_CREATED' ELSE 'USER_REGISTERED' END,
    'user',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'role', assigned_role,
      'requires_approval', needs_approval
    )
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to Approve User Account
CREATE OR REPLACE FUNCTION public.approve_user_account(
  p_user_id UUID,
  p_approved_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approver_role user_role;
  v_user_role user_role;
BEGIN
  -- Check approver has permission
  SELECT role INTO v_approver_role
  FROM public.profiles
  WHERE id = p_approved_by;
  
  IF v_approver_role NOT IN ('ADMIN', 'BOOTSTRAP_ADMIN') THEN
    RAISE EXCEPTION 'Only admins can approve user accounts';
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Update profile
  UPDATE public.profiles
  SET
    is_active = true,
    requires_approval = false,
    approved_at = NOW(),
    promotion_approved_by = p_approved_by,
    approval_notes = p_notes
  WHERE id = p_user_id;
  
  -- Log approval
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    new_values,
    justification
  ) VALUES (
    p_approved_by,
    'USER_ACCOUNT_APPROVED',
    'user',
    p_user_id,
    jsonb_build_object('role', v_user_role, 'approved_at', NOW()),
    p_notes
  );
  
  RETURN true;
END;
$$;

-- Enhanced Audit Logs RLS
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_privileged" ON public.audit_logs;

-- AUDITOR and MD can read audit logs
CREATE POLICY "audit_logs_select_privileged"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR', 'AUDITOR')
    )
  );

-- Audit logs are immutable (no UPDATE or DELETE)
CREATE POLICY "audit_logs_no_update"
  ON public.audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "audit_logs_no_delete"
  ON public.audit_logs FOR DELETE
  USING (false);

-- =========================================
-- ARDA Seeds Enterprise Security System
-- Canonical Departments, Roles, and Bootstrap Admin
-- =========================================

-- Drop existing types and recreate with new structure
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS department_type CASCADE;

-- New strict role hierarchy
CREATE TYPE user_role AS ENUM (
  'BOOTSTRAP_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'EXECUTIVE',
  'HEAD_OF_DEPARTMENT',
  'STAFF'
);

-- Canonical departments (system-defined)
CREATE TYPE department_type AS ENUM (
  'OPERATIONS',
  'FINANCE',
  'MARKETING_AND_SALES',
  'LEGAL_AND_COMPLIANCE',
  'HUMAN_RESOURCES_AND_ADMINISTRATION',
  'PROPERTIES_MANAGEMENT',
  'ICT_AND_DIGITAL_TRANSFORMATION',
  'PROCUREMENT',
  'PUBLIC_RELATIONS'
);

-- Sub-departments for Operations
CREATE TYPE sub_department_type AS ENUM (
  'AGRONOMY',
  'FACTORY'
);

-- =========================================
-- Drop and recreate profiles table with new structure
-- =========================================

DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'STAFF',
  department department_type NOT NULL,
  sub_department sub_department_type,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Admin creation tracking
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  promoted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  promotion_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for bootstrap admin check
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_department ON public.profiles(department);

-- =========================================
-- Audit Log Table
-- =========================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  justification TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- =========================================
-- Admin Invitations Table
-- =========================================

CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  department department_type NOT NULL,
  sub_department sub_department_type,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON public.admin_invitations(token);
CREATE INDEX idx_invitations_email ON public.admin_invitations(email);

-- =========================================
-- Updated Departments Table
-- =========================================

DROP TABLE IF EXISTS public.departments CASCADE;

CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name department_type UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  head_of_department_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed canonical departments
INSERT INTO public.departments (name, display_name, description) VALUES
  ('OPERATIONS', 'Operations', 'Agricultural operations including agronomy and factory management'),
  ('FINANCE', 'Finance', 'Financial management and accounting'),
  ('MARKETING_AND_SALES', 'Marketing and Sales', 'Marketing campaigns and sales operations'),
  ('LEGAL_AND_COMPLIANCE', 'Legal & Compliance', 'Legal affairs and regulatory compliance'),
  ('HUMAN_RESOURCES_AND_ADMINISTRATION', 'Human Resources & Administration', 'HR and administrative functions'),
  ('PROPERTIES_MANAGEMENT', 'Properties Management', 'Real estate and property management'),
  ('ICT_AND_DIGITAL_TRANSFORMATION', 'ICT & Digital Transformation', 'Information technology and digital initiatives'),
  ('PROCUREMENT', 'Procurement', 'Purchasing and supply chain management'),
  ('PUBLIC_RELATIONS', 'Public Relations', 'External communications and public affairs')
ON CONFLICT (name) DO NOTHING;

-- =========================================
-- Bootstrap Admin Detection Function
-- =========================================

CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.profiles
  WHERE role IN ('ADMIN', 'BOOTSTRAP_ADMIN');
  
  RETURN admin_count = 0;
END;
$$;

-- =========================================
-- Enhanced User Creation Trigger with Bootstrap Logic
-- =========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
  assigned_role user_role;
BEGIN
  -- Check if this is the first user (bootstrap admin)
  is_first_user := public.is_first_user();
  
  IF is_first_user THEN
    assigned_role := 'BOOTSTRAP_ADMIN';
  ELSE
    -- For all subsequent users, default to STAFF (admin cannot be self-assigned)
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'STAFF');
    
    -- SECURITY: Prevent self-assignment of admin roles
    IF assigned_role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR') THEN
      assigned_role := 'STAFF';
    END IF;
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    department,
    sub_department,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    assigned_role,
    COALESCE((NEW.raw_user_meta_data->>'department')::department_type, 'OPERATIONS'),
    (NEW.raw_user_meta_data->>'sub_department')::sub_department_type,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Log audit entry for bootstrap admin
  IF is_first_user THEN
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      new_values
    ) VALUES (
      NEW.id,
      'BOOTSTRAP_ADMIN_CREATED',
      'user',
      NEW.id,
      jsonb_build_object('email', NEW.email, 'role', 'BOOTSTRAP_ADMIN')
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Audit Logging Function
-- =========================================

CREATE OR REPLACE FUNCTION public.log_audit_entry(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_justification TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    justification
  )
  VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_justification
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- =========================================
-- Updated RLS Policies for Profiles
-- =========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins and executives can read all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR', 'EXECUTIVE')
    )
  );

-- Users can insert their own profile during signup
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own non-role fields
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Only admins can update any profile including role changes
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'BOOTSTRAP_ADMIN')
    )
  );

-- =========================================
-- RLS for Audit Logs
-- =========================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'BOOTSTRAP_ADMIN', 'MANAGING_DIRECTOR')
    )
  );

-- System can insert audit logs
CREATE POLICY "audit_logs_insert_system"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- =========================================
-- RLS for Departments
-- =========================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read departments
CREATE POLICY "departments_select_all"
  ON public.departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can modify departments
CREATE POLICY "departments_modify_admin"
  ON public.departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'BOOTSTRAP_ADMIN')
    )
  );

-- =========================================
-- RLS for Admin Invitations
-- =========================================

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
CREATE POLICY "invitations_admin_only"
  ON public.admin_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'BOOTSTRAP_ADMIN')
    )
  );

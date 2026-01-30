-- =========================================
-- ARDA Seeds Enterprise Reporting Platform
-- Base Schema: Users, Roles, Departments
-- =========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- ENUMS
-- =========================================

CREATE TYPE user_role AS ENUM (
  'md',
  'factory_manager',
  'admin',
  'accountant',
  'data_entry'
);

CREATE TYPE department_type AS ENUM (
  'head_office',
  'factory_hubli',
  'factory_bagalkot',
  'factory_kalaburgi'
);

-- =========================================
-- PROFILES TABLE (User Management)
-- =========================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  department department_type NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies: Users can view their own profile, admins can view all
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('md', 'admin')
  ));

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- =========================================
-- DEPARTMENTS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name department_type UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  location TEXT,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed departments
INSERT INTO public.departments (name, display_name, location) VALUES
  ('head_office', 'Head Office', 'Hubli'),
  ('factory_hubli', 'Factory - Hubli', 'Hubli'),
  ('factory_bagalkot', 'Factory - Bagalkot', 'Bagalkot'),
  ('factory_kalaburgi', 'Factory - Kalaburgi', 'Kalaburgi')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS for departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select_all"
  ON public.departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =========================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- =========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    department,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'data_entry'),
    COALESCE((NEW.raw_user_meta_data->>'department')::department_type, 'head_office'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

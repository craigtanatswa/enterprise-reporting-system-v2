-- =========================================
-- Fix RLS Policies - Remove ALL recursive queries
-- =========================================
-- The issue: RLS policies cannot query the profiles table itself
-- or auth.users table - this causes infinite recursion and permission errors.
-- Solution: Use ONLY auth.uid() and auth.jwt() for RLS checks.
-- Store role in JWT claims for role-based access.

-- Drop ALL existing problematic policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- =========================================
-- Simple, non-recursive RLS policies
-- =========================================

-- Allow users to read their own profile (no table queries)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to insert their own profile during signup
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =========================================
-- Admin access via JWT claims
-- =========================================
-- For admin access, we'll check JWT claims which are set in user metadata
-- This avoids querying the profiles table

-- Allow admins to read all profiles (checking JWT metadata)
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    (auth.jwt()->>'role')::text IN ('admin', 'md')
  );

-- Allow admins to update any profile
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    (auth.jwt()->>'role')::text = 'admin'
  )
  WITH CHECK (
    (auth.jwt()->>'role')::text = 'admin'
  );

-- =========================================
-- Update the trigger to set JWT claims
-- =========================================
-- We need to ensure role is in user metadata so JWT claims work

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
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

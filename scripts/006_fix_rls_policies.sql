-- =========================================
-- Fix RLS Policies - Remove Infinite Recursion
-- =========================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Create new policies without recursive checks
-- Allow users to select their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow admins and MD to select all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'md')
    )
  );

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

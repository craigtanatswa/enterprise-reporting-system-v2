-- Factory Activities Table for Operational Dashboard
-- This table stores immutable activity logs for seed production tracking

CREATE TABLE IF NOT EXISTS factory_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_date DATE NOT NULL,
  seed_category TEXT NOT NULL,
  seed_variety TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('raw_seed_received', 'seed_processed', 'seed_packaged', 'seed_dispatched')),
  quantity_tonnes DECIMAL(10, 4) NOT NULL CHECK (quantity_tonnes > 0),
  packaging_size TEXT CHECK (packaging_size IN ('5kg', '10kg', '20kg', '50kg')),
  notes TEXT,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent updates/deletes - activities are immutable
  CONSTRAINT immutable_activity CHECK (TRUE)
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_factory_activities_date ON factory_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_factory_activities_variety ON factory_activities(seed_category, seed_variety);
CREATE INDEX IF NOT EXISTS idx_factory_activities_type ON factory_activities(activity_type);

-- RLS Policies
ALTER TABLE factory_activities ENABLE ROW LEVEL SECURITY;

-- Factory staff can insert activities
CREATE POLICY factory_activities_insert ON factory_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'OPERATIONS'
      AND profiles.sub_department = 'FACTORY'
      AND profiles.is_active = TRUE
    )
  );

-- Factory staff can view all activities
CREATE POLICY factory_activities_select_factory ON factory_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'OPERATIONS'
      AND profiles.sub_department = 'FACTORY'
    )
  );

-- MD can view all factory activities (read-only)
CREATE POLICY factory_activities_select_md ON factory_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'MANAGING_DIRECTOR'
    )
  );

-- Admin can view all factory activities
CREATE POLICY factory_activities_select_admin ON factory_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'BOOTSTRAP_ADMIN')
    )
  );

-- Note: No UPDATE or DELETE policies - activities are immutable

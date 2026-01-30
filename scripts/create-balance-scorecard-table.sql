-- Create balance_scorecards table
CREATE TABLE IF NOT EXISTS balance_scorecards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, quarter)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_balance_scorecards_user_year ON balance_scorecards(user_id, year);
CREATE INDEX IF NOT EXISTS idx_balance_scorecards_status ON balance_scorecards(status);

-- Enable RLS
ALTER TABLE balance_scorecards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own scorecards
CREATE POLICY "Users can view own scorecards"
  ON balance_scorecards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: MD can view all scorecards
CREATE POLICY "MD can view all scorecards"
  ON balance_scorecards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'MANAGING_DIRECTOR'
    )
  );

-- Policy: Users can insert their own scorecards
CREATE POLICY "Users can insert own scorecards"
  ON balance_scorecards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own unlocked scorecards
CREATE POLICY "Users can update own unlocked scorecards"
  ON balance_scorecards
  FOR UPDATE
  USING (auth.uid() = user_id AND is_locked = FALSE);

-- Policy: MD can update any scorecard (for approval)
CREATE POLICY "MD can update any scorecard"
  ON balance_scorecards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'MANAGING_DIRECTOR'
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_balance_scorecards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_balance_scorecards_updated_at
  BEFORE UPDATE ON balance_scorecards
  FOR EACH ROW
  EXECUTE FUNCTION update_balance_scorecards_updated_at();

-- Create function to check quarterly limit
CREATE OR REPLACE FUNCTION check_quarterly_scorecard_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    -- Check if this would exceed 4 approved scorecards per year
    IF (
      SELECT COUNT(*)
      FROM balance_scorecards
      WHERE user_id = NEW.user_id
      AND year = NEW.year
      AND status = 'approved'
      AND id != NEW.id
    ) >= 4 THEN
      RAISE EXCEPTION 'Maximum 4 approved balance scorecards per year allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_scorecard_limit
  BEFORE INSERT OR UPDATE ON balance_scorecards
  FOR EACH ROW
  EXECUTE FUNCTION check_quarterly_scorecard_limit();

-- Create general_reports table for departmental report uploads
CREATE TABLE IF NOT EXISTS general_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department department_type NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'quarterly', 'annual', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES profiles(id),
  review_notes TEXT,
  is_confidential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for general_reports
CREATE INDEX IF NOT EXISTS idx_general_reports_user ON general_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_general_reports_department ON general_reports(department);
CREATE INDEX IF NOT EXISTS idx_general_reports_status ON general_reports(status);
CREATE INDEX IF NOT EXISTS idx_general_reports_type ON general_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_general_reports_submitted ON general_reports(submitted_at DESC);

-- Enable RLS for general_reports
ALTER TABLE general_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reports from their department
CREATE POLICY "Users can view department reports"
  ON general_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = general_reports.department
    )
    OR is_confidential = FALSE
  );

-- Policy: MD can view all reports
CREATE POLICY "MD can view all reports"
  ON general_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'MANAGING_DIRECTOR'
    )
  );

-- Policy: Users can insert reports
CREATE POLICY "Users can insert reports"
  ON general_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reports
CREATE POLICY "Users can update own reports"
  ON general_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: HODs and MD can update reports in their department
CREATE POLICY "HODs can update department reports"
  ON general_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'HEAD_OF_DEPARTMENT' OR profiles.role = 'MANAGING_DIRECTOR')
      AND profiles.department = general_reports.department
    )
  );

-- Create trigger for general_reports updated_at
CREATE TRIGGER update_general_reports_updated_at
  BEFORE UPDATE ON general_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_balance_scorecards_updated_at();

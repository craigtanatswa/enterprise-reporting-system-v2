-- Create storage buckets for reports and balance scorecards

-- Create balance-scorecards bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'balance-scorecards',
  'balance-scorecards',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO NOTHING;

-- Create reports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  true,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for balance-scorecards bucket

-- Users can upload their own scorecards
CREATE POLICY "Users can upload own scorecards"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'balance-scorecards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own scorecards
CREATE POLICY "Users can view own scorecards"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'balance-scorecards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- MD can view all scorecards
CREATE POLICY "MD can view all scorecards"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'balance-scorecards' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'MANAGING_DIRECTOR'
  )
);

-- RLS Policies for reports bucket

-- Users can upload reports
CREATE POLICY "Users can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports'
);

-- Users can view reports from their department
CREATE POLICY "Users can view department reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports' AND
  (
    -- Check if user's department matches the folder name
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (storage.foldername(name))[1] = profiles.department::text
    )
    OR
    -- MD can view all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'MANAGING_DIRECTOR'
    )
  )
);

-- Users can update their own uploads
CREATE POLICY "Users can update own reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reports' AND
  owner = auth.uid()
);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports' AND
  owner = auth.uid()
);

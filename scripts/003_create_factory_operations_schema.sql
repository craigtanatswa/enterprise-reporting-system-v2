-- =========================================
-- ARDA Seeds Enterprise Reporting Platform
-- Factory Operations Schema
-- =========================================

CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night');
CREATE TYPE production_status AS ENUM ('planned', 'in_progress', 'completed', 'delayed');

-- =========================================
-- PRODUCTION REPORTS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.production_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  department department_type NOT NULL,
  shift shift_type NOT NULL,
  product_name TEXT NOT NULL,
  target_quantity DECIMAL(10, 2) NOT NULL,
  actual_quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  quality_grade TEXT,
  status production_status DEFAULT 'planned',
  remarks TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.production_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "production_reports_select_policy"
  ON public.production_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('md', 'admin', 'factory_manager') 
        OR department = production_reports.department
      )
    )
  );

CREATE POLICY "production_reports_insert_policy"
  ON public.production_reports FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('factory_manager', 'data_entry', 'admin')
    )
  );

CREATE POLICY "production_reports_update_policy"
  ON public.production_reports FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('md', 'admin', 'factory_manager')
    )
  );

-- =========================================
-- DISPATCH REPORTS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.dispatch_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_date DATE NOT NULL,
  department department_type NOT NULL,
  vehicle_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  invoice_number TEXT,
  customer_name TEXT NOT NULL,
  dispatch_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  remarks TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dispatch_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispatch_reports_select_policy"
  ON public.dispatch_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('md', 'admin', 'factory_manager', 'accountant') 
        OR department = dispatch_reports.department
      )
    )
  );

CREATE POLICY "dispatch_reports_insert_policy"
  ON public.dispatch_reports FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('factory_manager', 'data_entry', 'admin')
    )
  );

CREATE POLICY "dispatch_reports_update_policy"
  ON public.dispatch_reports FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('md', 'admin', 'factory_manager')
    )
  );

-- =========================================
-- PROCESSING REPORTS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.processing_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  department department_type NOT NULL,
  batch_number TEXT NOT NULL,
  raw_material TEXT NOT NULL,
  raw_quantity DECIMAL(10, 2) NOT NULL,
  processed_quantity DECIMAL(10, 2) NOT NULL,
  waste_quantity DECIMAL(10, 2) DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  processing_time_hours DECIMAL(5, 2),
  efficiency_percentage DECIMAL(5, 2),
  remarks TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.processing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processing_reports_select_policy"
  ON public.processing_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('md', 'admin', 'factory_manager') 
        OR department = processing_reports.department
      )
    )
  );

CREATE POLICY "processing_reports_insert_policy"
  ON public.processing_reports FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('factory_manager', 'data_entry', 'admin')
    )
  );

CREATE POLICY "processing_reports_update_policy"
  ON public.processing_reports FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('md', 'admin', 'factory_manager')
    )
  );

CREATE TRIGGER update_production_reports_updated_at
  BEFORE UPDATE ON public.production_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dispatch_reports_updated_at
  BEFORE UPDATE ON public.dispatch_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_reports_updated_at
  BEFORE UPDATE ON public.processing_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

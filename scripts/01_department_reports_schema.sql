-- =====================================================
-- ARDA Seeds Enterprise Reporting System
-- Department-Specific Report Tables with RLS
-- =====================================================

-- =====================================================
-- 1. AGRONOMY REPORTS (Operations Sub-Department)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.agronomy_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('crop_performance', 'seed_trial', 'field_inspection', 'seasonal_summary', 'yield_forecast')),
    title TEXT NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    season TEXT, -- e.g., "2024-2025 Summer", "2025 Winter"
    crop_variety TEXT,
    field_location TEXT,
    area_hectares NUMERIC(10, 2),
    yield_kg_per_hectare NUMERIC(10, 2),
    quality_metrics JSONB, -- Store flexible quality data
    weather_conditions TEXT,
    soil_analysis JSONB,
    recommendations TEXT,
    attachments JSONB, -- Array of {file_name, file_url, file_type}
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'OPERATIONS',
    sub_department TEXT DEFAULT 'AGRONOMY',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_agronomy_reports_date ON public.agronomy_reports(report_date DESC);
CREATE INDEX idx_agronomy_reports_season ON public.agronomy_reports(season);
CREATE INDEX idx_agronomy_reports_type ON public.agronomy_reports(report_type);
CREATE INDEX idx_agronomy_reports_created_by ON public.agronomy_reports(created_by);

-- =====================================================
-- 2. FACTORY REPORTS (Operations Sub-Department)
-- =====================================================
-- Note: production_reports, processing_reports, and dispatch_reports already exist
-- Adding complementary tables

CREATE TABLE IF NOT EXISTS public.factory_quality_control (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_number TEXT NOT NULL,
    product_name TEXT NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('germination', 'purity', 'moisture', 'physical', 'disease')),
    test_date DATE NOT NULL,
    sample_size NUMERIC,
    test_results JSONB NOT NULL, -- Store test-specific results
    pass_fail TEXT CHECK (pass_fail IN ('pass', 'fail', 'conditional')),
    remarks TEXT,
    tested_by UUID REFERENCES public.profiles(id),
    verified_by UUID REFERENCES public.profiles(id),
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    department TEXT DEFAULT 'OPERATIONS',
    sub_department TEXT DEFAULT 'FACTORY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_factory_qc_batch ON public.factory_quality_control(batch_number);
CREATE INDEX idx_factory_qc_date ON public.factory_quality_control(test_date DESC);

CREATE TABLE IF NOT EXISTS public.factory_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_date DATE NOT NULL,
    product_name TEXT NOT NULL,
    batch_number TEXT,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    storage_location TEXT,
    expiry_date DATE,
    value_inr NUMERIC(15, 2),
    remarks TEXT,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    department TEXT DEFAULT 'OPERATIONS',
    sub_department TEXT DEFAULT 'FACTORY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_factory_inventory_date ON public.factory_inventory(inventory_date DESC);
CREATE INDEX idx_factory_inventory_product ON public.factory_inventory(product_name);

-- =====================================================
-- 3. FINANCE REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.finance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('performance', 'cost_of_production', 'revenue', 'budget_vs_actual', 'cashflow', 'balance_sheet')),
    title TEXT NOT NULL,
    description TEXT,
    reporting_period TEXT NOT NULL, -- e.g., "Q1 2025", "FY 2024-2025", "January 2025"
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Financial Data (stored as JSONB for flexibility)
    revenue_data JSONB,
    expense_data JSONB,
    profit_loss_data JSONB,
    budget_data JSONB,
    variance_analysis JSONB,
    
    -- Document attachments
    attachments JSONB,
    
    -- Period locking (no edits after submission)
    is_locked BOOLEAN DEFAULT false,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID REFERENCES public.profiles(id),
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'FINANCE',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_finance_reports_period ON public.finance_reports(period_start DESC, period_end DESC);
CREATE INDEX idx_finance_reports_type ON public.finance_reports(report_type);

-- =====================================================
-- 4. MARKETING & SALES REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.marketing_sales_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('sales_performance', 'market_coverage', 'distributor_performance', 'customer_demand', 'competitor_analysis')),
    title TEXT NOT NULL,
    description TEXT,
    reporting_period TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Sales Data
    region TEXT,
    product_category TEXT,
    sales_volume NUMERIC,
    sales_value_inr NUMERIC(15, 2),
    market_share_percentage NUMERIC(5, 2),
    customer_count INTEGER,
    distributor_performance JSONB,
    demand_forecast JSONB,
    
    -- Attachments
    attachments JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'MARKETING_AND_SALES',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_marketing_reports_period ON public.marketing_sales_reports(period_start DESC);
CREATE INDEX idx_marketing_reports_region ON public.marketing_sales_reports(region);

-- =====================================================
-- 5. LEGAL & COMPLIANCE REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.legal_compliance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('compliance_status', 'regulatory_submission', 'risk_assessment', 'policy_document', 'legal_issue', 'contract_review')),
    title TEXT NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    
    -- Legal/Compliance specific
    regulation_reference TEXT,
    compliance_status TEXT CHECK (compliance_status IN ('compliant', 'non_compliant', 'in_progress', 'under_review')),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    remediation_plan TEXT,
    deadline DATE,
    
    -- Document management
    document_version INTEGER DEFAULT 1,
    is_policy_document BOOLEAN DEFAULT false,
    requires_board_approval BOOLEAN DEFAULT false,
    attachments JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'LEGAL_AND_COMPLIANCE',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'archived')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_legal_reports_date ON public.legal_compliance_reports(report_date DESC);
CREATE INDEX idx_legal_reports_type ON public.legal_compliance_reports(report_type);
CREATE INDEX idx_legal_reports_risk ON public.legal_compliance_reports(risk_level);

-- =====================================================
-- 6. HR & ADMINISTRATION REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.hr_admin_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('staffing', 'training_development', 'leave_summary', 'disciplinary', 'compliance_metrics', 'recruitment')),
    title TEXT NOT NULL,
    description TEXT,
    reporting_period TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- HR Metrics
    total_staff_count INTEGER,
    new_hires INTEGER,
    departures INTEGER,
    training_sessions_conducted INTEGER,
    training_participants INTEGER,
    leave_data JSONB,
    disciplinary_cases JSONB,
    compliance_metrics JSONB,
    
    -- Sensitive data flag
    contains_personal_data BOOLEAN DEFAULT true,
    restricted_access BOOLEAN DEFAULT true,
    
    -- Attachments
    attachments JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'HUMAN_RESOURCES_AND_ADMINISTRATION',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_hr_reports_period ON public.hr_admin_reports(period_start DESC);
CREATE INDEX idx_hr_reports_type ON public.hr_admin_reports(report_type);

-- =====================================================
-- 7. PROPERTIES MANAGEMENT REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.properties_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('asset_utilization', 'maintenance_schedule', 'property_condition', 'space_allocation', 'facility_inspection')),
    title TEXT NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    
    -- Property Details
    property_location TEXT NOT NULL,
    property_type TEXT, -- e.g., "Farm", "Warehouse", "Office", "Factory"
    asset_id TEXT,
    asset_description TEXT,
    condition_rating TEXT CHECK (condition_rating IN ('excellent', 'good', 'fair', 'poor', 'critical')),
    utilization_percentage NUMERIC(5, 2),
    
    -- Maintenance
    maintenance_required BOOLEAN DEFAULT false,
    maintenance_priority TEXT CHECK (maintenance_priority IN ('low', 'medium', 'high', 'urgent')),
    estimated_cost_inr NUMERIC(12, 2),
    
    -- Image attachments (important for properties)
    images JSONB,
    attachments JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'PROPERTIES_MANAGEMENT',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_properties_reports_date ON public.properties_reports(report_date DESC);
CREATE INDEX idx_properties_reports_location ON public.properties_reports(property_location);
CREATE INDEX idx_properties_reports_condition ON public.properties_reports(condition_rating);

-- =====================================================
-- 8. ICT & DIGITAL TRANSFORMATION REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ict_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('system_uptime', 'cybersecurity_incident', 'digital_transformation', 'infrastructure_status', 'user_support')),
    title TEXT NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    reporting_period TEXT,
    
    -- ICT Metrics
    system_name TEXT,
    uptime_percentage NUMERIC(5, 2),
    downtime_hours NUMERIC(8, 2),
    incident_count INTEGER,
    incident_classification TEXT CHECK (incident_classification IN ('minor', 'major', 'critical', 'security_breach')),
    severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    resolution_time_hours NUMERIC(8, 2),
    
    -- Digital Transformation Tracking
    project_name TEXT,
    completion_percentage NUMERIC(5, 2),
    milestones JSONB,
    
    -- Incidents
    incident_details JSONB,
    root_cause_analysis TEXT,
    preventive_measures TEXT,
    
    -- Attachments
    attachments JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'ICT_AND_DIGITAL_TRANSFORMATION',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'resolved')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ict_reports_date ON public.ict_reports(report_date DESC);
CREATE INDEX idx_ict_reports_type ON public.ict_reports(report_type);
CREATE INDEX idx_ict_reports_severity ON public.ict_reports(severity_level);

-- =====================================================
-- 9. PROCUREMENT REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.procurement_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('procurement_plan', 'supplier_performance', 'contract_tracking', 'delivery_timeline', 'cost_analysis')),
    title TEXT NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    reporting_period TEXT,
    
    -- Procurement Details
    procurement_category TEXT, -- e.g., "Raw Materials", "Equipment", "Services"
    supplier_name TEXT,
    contract_number TEXT,
    contract_value_inr NUMERIC(15, 2),
    contract_start_date DATE,
    contract_end_date DATE,
    
    -- Performance Metrics
    delivery_status TEXT CHECK (delivery_status IN ('on_time', 'delayed', 'pending', 'completed', 'cancelled')),
    quality_rating TEXT CHECK (quality_rating IN ('excellent', 'good', 'satisfactory', 'poor')),
    cost_variance_percentage NUMERIC(8, 2),
    supplier_rating NUMERIC(3, 1), -- e.g., 4.5 out of 5
    
    -- Data
    items JSONB, -- Array of procurement items
    performance_metrics JSONB,
    
    -- Attachments
    attachments JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'PROCUREMENT',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_procurement_reports_date ON public.procurement_reports(report_date DESC);
CREATE INDEX idx_procurement_reports_supplier ON public.procurement_reports(supplier_name);
CREATE INDEX idx_procurement_reports_status ON public.procurement_reports(delivery_status);

-- =====================================================
-- 10. PUBLIC RELATIONS REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.public_relations_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('media_coverage', 'stakeholder_engagement', 'public_perception', 'events', 'crisis_management')),
    title TEXT NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    reporting_period TEXT,
    
    -- PR Metrics
    media_outlet TEXT,
    coverage_type TEXT CHECK (coverage_type IN ('print', 'online', 'tv', 'radio', 'social_media')),
    reach_estimate INTEGER,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    
    -- Event Details
    event_name TEXT,
    event_date DATE,
    attendees_count INTEGER,
    
    -- Stakeholder Engagement
    stakeholder_type TEXT, -- e.g., "Government", "Farmers", "Community", "Investors"
    engagement_method TEXT,
    outcomes JSONB,
    
    -- Attachments
    attachments JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'PUBLIC_RELATIONS',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_pr_reports_date ON public.public_relations_reports(report_date DESC);
CREATE INDEX idx_pr_reports_type ON public.public_relations_reports(report_type);
CREATE INDEX idx_pr_reports_sentiment ON public.public_relations_reports(sentiment);

-- =====================================================
-- 11. AUDIT REPORTS (HIGH SECURITY)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL CHECK (report_type IN ('internal_audit', 'risk_assessment', 'compliance_audit', 'financial_audit', 'operational_audit')),
    title TEXT NOT NULL,
    description TEXT,
    audit_date DATE NOT NULL,
    audit_period_start DATE NOT NULL,
    audit_period_end DATE NOT NULL,
    
    -- Audit Details
    audited_department TEXT,
    audited_entity TEXT,
    audit_scope TEXT,
    audit_findings JSONB NOT NULL,
    risk_exposure TEXT CHECK (risk_exposure IN ('low', 'medium', 'high', 'critical')),
    recommendations JSONB,
    management_response TEXT,
    
    -- Confidentiality
    is_confidential BOOLEAN DEFAULT true,
    confidentiality_level TEXT DEFAULT 'high' CHECK (confidentiality_level IN ('medium', 'high', 'top_secret')),
    
    -- Compliance
    compliance_status TEXT CHECK (compliance_status IN ('compliant', 'non_compliant', 'partially_compliant')),
    remediation_deadline DATE,
    follow_up_required BOOLEAN DEFAULT true,
    
    -- Attachments
    attachments JSONB,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id),
    author_id UUID REFERENCES public.profiles(id),
    department TEXT DEFAULT 'AUDIT',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'archived')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_audit_reports_date ON public.audit_reports(audit_date DESC);
CREATE INDEX idx_audit_reports_department ON public.audit_reports(audited_department);
CREATE INDEX idx_audit_reports_risk ON public.audit_reports(risk_exposure);
CREATE INDEX idx_audit_reports_confidential ON public.audit_reports(is_confidential);

-- =====================================================
-- Enable Row Level Security on all tables
-- =====================================================

ALTER TABLE public.agronomy_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_quality_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_admin_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ict_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_relations_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

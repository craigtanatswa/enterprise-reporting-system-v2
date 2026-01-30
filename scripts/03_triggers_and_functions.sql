-- =====================================================
-- ARDA Seeds Enterprise Reporting System
-- Triggers and Helper Functions
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all report tables
CREATE TRIGGER update_agronomy_reports_updated_at BEFORE UPDATE ON public.agronomy_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_factory_qc_updated_at BEFORE UPDATE ON public.factory_quality_control
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_factory_inventory_updated_at BEFORE UPDATE ON public.factory_inventory
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_reports_updated_at BEFORE UPDATE ON public.finance_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketing_reports_updated_at BEFORE UPDATE ON public.marketing_sales_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_reports_updated_at BEFORE UPDATE ON public.legal_compliance_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_reports_updated_at BEFORE UPDATE ON public.hr_admin_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_reports_updated_at BEFORE UPDATE ON public.properties_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ict_reports_updated_at BEFORE UPDATE ON public.ict_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procurement_reports_updated_at BEFORE UPDATE ON public.procurement_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pr_reports_updated_at BEFORE UPDATE ON public.public_relations_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_reports_updated_at BEFORE UPDATE ON public.audit_reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to prevent editing locked finance reports
CREATE OR REPLACE FUNCTION public.prevent_locked_finance_edit()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_locked = true THEN
        RAISE EXCEPTION 'Cannot modify locked financial report';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_locked_finance_reports BEFORE UPDATE ON public.finance_reports
    FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_finance_edit();

-- Function to auto-set submitted_at when status changes to submitted
CREATE OR REPLACE FUNCTION public.set_submitted_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
        NEW.submitted_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all report tables
CREATE TRIGGER set_agronomy_submitted_at BEFORE UPDATE ON public.agronomy_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

CREATE TRIGGER set_finance_submitted_at BEFORE UPDATE ON public.finance_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

CREATE TRIGGER set_marketing_submitted_at BEFORE UPDATE ON public.marketing_sales_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

CREATE TRIGGER set_legal_submitted_at BEFORE UPDATE ON public.legal_compliance_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

CREATE TRIGGER set_hr_submitted_at BEFORE UPDATE ON public.hr_admin_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

CREATE TRIGGER set_properties_submitted_at BEFORE UPDATE ON public.properties_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

CREATE TRIGGER set_ict_submitted_at BEFORE UPDATE ON public.ict_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

CREATE TRIGGER set_procurement_submitted_at BEFORE UPDATE ON public.procurement_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

CREATE TRIGGER set_pr_submitted_at BEFORE UPDATE ON public.public_relations_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

CREATE TRIGGER set_audit_submitted_at BEFORE UPDATE ON public.audit_reports
    FOR EACH ROW EXECUTE FUNCTION public.set_submitted_at();

-- Function to log approval actions
CREATE OR REPLACE FUNCTION public.log_report_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.approved_at = now();
        NEW.approved_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all report tables
CREATE TRIGGER log_agronomy_approval BEFORE UPDATE ON public.agronomy_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

CREATE TRIGGER log_finance_approval BEFORE UPDATE ON public.finance_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

CREATE TRIGGER log_marketing_approval BEFORE UPDATE ON public.marketing_sales_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

CREATE TRIGGER log_legal_approval BEFORE UPDATE ON public.legal_compliance_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

CREATE TRIGGER log_hr_approval BEFORE UPDATE ON public.hr_admin_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

CREATE TRIGGER log_properties_approval BEFORE UPDATE ON public.properties_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

CREATE TRIGGER log_ict_approval BEFORE UPDATE ON public.ict_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

CREATE TRIGGER log_procurement_approval BEFORE UPDATE ON public.procurement_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

CREATE TRIGGER log_pr_approval BEFORE UPDATE ON public.public_relations_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

CREATE TRIGGER log_audit_approval BEFORE UPDATE ON public.audit_reports
    FOR EACH ROW EXECUTE FUNCTION public.log_report_approval();

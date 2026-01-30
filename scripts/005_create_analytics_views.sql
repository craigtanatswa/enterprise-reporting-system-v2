-- =========================================
-- ARDA Seeds Enterprise Reporting Platform
-- Analytics Views & Functions
-- =========================================

-- =========================================
-- VIEW: DAILY PRODUCTION SUMMARY
-- =========================================

CREATE OR REPLACE VIEW public.daily_production_summary AS
SELECT 
  report_date,
  department,
  COUNT(*) as total_reports,
  SUM(target_quantity) as total_target,
  SUM(actual_quantity) as total_actual,
  ROUND((SUM(actual_quantity) / NULLIF(SUM(target_quantity), 0) * 100)::numeric, 2) as achievement_percentage,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'delayed' THEN 1 END) as delayed_count
FROM public.production_reports
GROUP BY report_date, department
ORDER BY report_date DESC, department;

-- =========================================
-- VIEW: MONTHLY DISPATCH SUMMARY
-- =========================================

CREATE OR REPLACE VIEW public.monthly_dispatch_summary AS
SELECT 
  DATE_TRUNC('month', dispatch_date) as month,
  department,
  COUNT(*) as total_dispatches,
  SUM(quantity) as total_quantity,
  COUNT(DISTINCT customer_name) as unique_customers,
  COUNT(DISTINCT vehicle_number) as vehicles_used
FROM public.dispatch_reports
GROUP BY DATE_TRUNC('month', dispatch_date), department
ORDER BY month DESC, department;

-- =========================================
-- VIEW: DEPARTMENT PERFORMANCE
-- =========================================

CREATE OR REPLACE VIEW public.department_performance AS
SELECT 
  d.display_name as department,
  COUNT(DISTINCT pr.id) as production_reports_count,
  COUNT(DISTINCT dr.id) as dispatch_reports_count,
  COUNT(DISTINCT proc.id) as processing_reports_count,
  COALESCE(AVG(proc.efficiency_percentage), 0) as avg_efficiency,
  COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true) as active_users
FROM public.departments d
LEFT JOIN public.production_reports pr ON pr.department = d.name
LEFT JOIN public.dispatch_reports dr ON dr.department = d.name
LEFT JOIN public.processing_reports proc ON proc.department = d.name
LEFT JOIN public.profiles p ON p.department = d.name
GROUP BY d.display_name, d.name
ORDER BY d.name;

-- =========================================
-- VIEW: PENDING APPROVALS
-- =========================================

CREATE OR REPLACE VIEW public.pending_approvals AS
SELECT 
  aw.id as workflow_id,
  aw.entity_type,
  aw.entity_id,
  aw.current_level,
  aw.total_levels,
  aw.submitted_at,
  p.full_name as submitted_by_name,
  p.department as submitter_department,
  ast.id as step_id,
  ast.approver_role,
  ast.status as step_status
FROM public.approval_workflows aw
INNER JOIN public.approval_steps ast ON ast.workflow_id = aw.id
INNER JOIN public.profiles p ON p.id = aw.submitted_by
WHERE aw.status = 'pending'
AND ast.level = aw.current_level
AND ast.status = 'pending'
ORDER BY aw.submitted_at ASC;

-- =========================================
-- FUNCTION: GET USER DASHBOARD STATS
-- =========================================

CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role user_role;
  v_user_dept department_type;
  v_stats JSON;
BEGIN
  -- Get user role and department
  SELECT role, department INTO v_user_role, v_user_dept
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Build stats based on role
  IF v_user_role IN ('md', 'admin') THEN
    -- Global stats for MD/Admin
    SELECT json_build_object(
      'total_production', (SELECT COUNT(*) FROM public.production_reports),
      'total_dispatches', (SELECT COUNT(*) FROM public.dispatch_reports),
      'pending_approvals', (SELECT COUNT(*) FROM public.approval_workflows WHERE status = 'pending'),
      'active_users', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
      'total_documents', (SELECT COUNT(*) FROM public.documents),
      'departments', (SELECT COUNT(*) FROM public.departments)
    ) INTO v_stats;
  ELSE
    -- Department-specific stats
    SELECT json_build_object(
      'total_production', (SELECT COUNT(*) FROM public.production_reports WHERE department = v_user_dept),
      'total_dispatches', (SELECT COUNT(*) FROM public.dispatch_reports WHERE department = v_user_dept),
      'pending_approvals', (
        SELECT COUNT(*) FROM public.approval_workflows aw
        WHERE aw.submitted_by = p_user_id AND aw.status = 'pending'
      ),
      'my_documents', (SELECT COUNT(*) FROM public.documents WHERE uploaded_by = p_user_id),
      'notifications', (SELECT COUNT(*) FROM public.notifications WHERE user_id = p_user_id AND is_read = false)
    ) INTO v_stats;
  END IF;
  
  RETURN v_stats;
END;
$$;

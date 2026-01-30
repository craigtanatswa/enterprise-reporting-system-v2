-- =====================================================
-- ARDA Seeds Authentication & Account Activation System
-- =====================================================

-- Function to handle new user registration
-- First user becomes BOOTSTRAP_ADMIN and is auto-activated
-- All other users require admin approval
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
    is_first_user BOOLEAN;
BEGIN
    -- Check if this is the first user
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    is_first_user := (user_count = 0);

    -- Insert profile for new user
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        department,
        sub_department,
        phone,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        CASE 
            WHEN is_first_user THEN 'BOOTSTRAP_ADMIN'
            ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'STAFF')
        END,
        COALESCE(NEW.raw_user_meta_data->>'department', NULL),
        COALESCE(NEW.raw_user_meta_data->>'sub_department', NULL),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        is_first_user, -- First user is auto-activated
        now(),
        now()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_justification TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        id,
        action,
        entity_type,
        entity_id,
        actor_id,
        old_values,
        new_values,
        justification,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_action,
        p_entity_type,
        p_entity_id,
        auth.uid(),
        p_old_values,
        p_new_values,
        p_justification,
        now()
    )
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate user account (admin only)
CREATE OR REPLACE FUNCTION public.activate_user_account(
    p_user_id UUID,
    p_assigned_role TEXT DEFAULT NULL,
    p_justification TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_current_user_role TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    -- Check if current user is admin
    SELECT role::TEXT INTO v_current_user_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_current_user_role NOT IN ('ADMIN', 'BOOTSTRAP_ADMIN') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only administrators can activate accounts'
        );
    END IF;

    -- Get current profile
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User profile not found'
        );
    END IF;

    IF v_profile.is_active THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Account is already active'
        );
    END IF;

    -- Store old values for audit
    v_old_values := jsonb_build_object(
        'is_active', v_profile.is_active,
        'role', v_profile.role
    );

    -- Update profile
    UPDATE public.profiles
    SET 
        is_active = true,
        role = COALESCE(p_assigned_role, role),
        updated_at = now()
    WHERE id = p_user_id;

    -- Store new values for audit
    v_new_values := jsonb_build_object(
        'is_active', true,
        'role', COALESCE(p_assigned_role, v_profile.role)
    );

    -- Create audit log
    PERFORM public.create_audit_log(
        'ACTIVATE_ACCOUNT',
        'profile',
        p_user_id,
        v_old_values,
        v_new_values,
        p_justification
    );

    -- Create notification for user
    INSERT INTO public.notifications (
        id,
        user_id,
        title,
        message,
        type,
        entity_type,
        entity_id,
        is_read,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        'Account Activated',
        'Your account has been approved and activated. You can now access the system.',
        'system',
        'profile',
        p_user_id,
        false,
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account activated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate user account
CREATE OR REPLACE FUNCTION public.deactivate_user_account(
    p_user_id UUID,
    p_justification TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_current_user_role TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    -- Check if current user is admin
    SELECT role::TEXT INTO v_current_user_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_current_user_role NOT IN ('ADMIN', 'BOOTSTRAP_ADMIN') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only administrators can deactivate accounts'
        );
    END IF;

    -- Get current profile
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User profile not found'
        );
    END IF;

    -- Cannot deactivate yourself
    IF p_user_id = auth.uid() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'You cannot deactivate your own account'
        );
    END IF;

    -- Store old values
    v_old_values := jsonb_build_object('is_active', v_profile.is_active);

    -- Update profile
    UPDATE public.profiles
    SET 
        is_active = false,
        updated_at = now()
    WHERE id = p_user_id;

    -- Store new values
    v_new_values := jsonb_build_object('is_active', false);

    -- Create audit log
    PERFORM public.create_audit_log(
        'DEACTIVATE_ACCOUNT',
        'profile',
        p_user_id,
        v_old_values,
        v_new_values,
        p_justification
    );

    -- Create notification for user
    INSERT INTO public.notifications (
        id,
        user_id,
        title,
        message,
        type,
        entity_type,
        entity_id,
        is_read,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        'Account Deactivated',
        'Your account has been deactivated. Please contact your administrator for more information.',
        'system',
        'profile',
        p_user_id,
        false,
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account deactivated successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin (only BOOTSTRAP_ADMIN can do this)
CREATE OR REPLACE FUNCTION public.promote_to_admin(
    p_user_id UUID,
    p_justification TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_current_user_role TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
BEGIN
    -- Check if current user is BOOTSTRAP_ADMIN
    SELECT role::TEXT INTO v_current_user_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_current_user_role != 'BOOTSTRAP_ADMIN' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only Bootstrap Admin can promote users to Admin'
        );
    END IF;

    -- Get current profile
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User profile not found'
        );
    END IF;

    -- Cannot promote yourself
    IF p_user_id = auth.uid() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'You cannot change your own role'
        );
    END IF;

    -- Store old values
    v_old_values := jsonb_build_object('role', v_profile.role);

    -- Update profile to ADMIN
    UPDATE public.profiles
    SET 
        role = 'ADMIN',
        is_active = true, -- Ensure admin is active
        updated_at = now()
    WHERE id = p_user_id;

    -- Store new values
    v_new_values := jsonb_build_object('role', 'ADMIN');

    -- Create audit log
    PERFORM public.create_audit_log(
        'PROMOTE_TO_ADMIN',
        'profile',
        p_user_id,
        v_old_values,
        v_new_values,
        p_justification
    );

    -- Create notification for user
    INSERT INTO public.notifications (
        id,
        user_id,
        title,
        message,
        type,
        entity_type,
        entity_id,
        is_read,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        'Role Updated',
        'You have been promoted to Administrator. You now have full system access.',
        'system',
        'profile',
        p_user_id,
        false,
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'User promoted to Admin successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.activate_user_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_user_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_audit_log TO authenticated;

-- Create secure role management functions with proper authorization
CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id UUID, target_role app_role)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_authorized BOOLEAN := FALSE;
  result JSON;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is admin or sysadmin
  SELECT public.has_role(current_user_id, 'admin') OR public.has_role(current_user_id, 'sysadmin')
  INTO is_authorized;
  
  -- If not authorized, return error
  IF NOT is_authorized THEN
    result := json_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins and sysadmins can assign roles'
    );
    RETURN result;
  END IF;
  
  -- Prevent non-sysadmins from assigning sysadmin role
  IF target_role = 'sysadmin' AND NOT public.has_role(current_user_id, 'sysadmin') THEN
    result := json_build_object(
      'success', false,
      'error', 'Unauthorized: Only sysadmins can assign sysadmin role'
    );
    RETURN result;
  END IF;
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.admin_activity_logs (
    admin_user_id, target_user_id, action, details, timestamp
  ) VALUES (
    current_user_id, target_user_id, 'role_assigned', 
    json_build_object('role', target_role), now()
  );
  
  result := json_build_object(
    'success', true,
    'message', 'Role assigned successfully'
  );
  
  RETURN result;
END;
$$;

-- Create secure role removal function
CREATE OR REPLACE FUNCTION public.remove_user_role(target_user_id UUID, target_role app_role)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_authorized BOOLEAN := FALSE;
  result JSON;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is admin or sysadmin
  SELECT public.has_role(current_user_id, 'admin') OR public.has_role(current_user_id, 'sysadmin')
  INTO is_authorized;
  
  -- If not authorized, return error
  IF NOT is_authorized THEN
    result := json_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins and sysadmins can remove roles'
    );
    RETURN result;
  END IF;
  
  -- Prevent non-sysadmins from removing sysadmin role
  IF target_role = 'sysadmin' AND NOT public.has_role(current_user_id, 'sysadmin') THEN
    result := json_build_object(
      'success', false,
      'error', 'Unauthorized: Only sysadmins can remove sysadmin role'
    );
    RETURN result;
  END IF;
  
  -- Prevent users from removing their own admin/sysadmin role (safety check)
  IF current_user_id = target_user_id AND target_role IN ('admin', 'sysadmin') THEN
    result := json_build_object(
      'success', false,
      'error', 'Cannot remove your own admin privileges'
    );
    RETURN result;
  END IF;
  
  -- Remove the role
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = target_role;
  
  -- Log the action
  INSERT INTO public.admin_activity_logs (
    admin_user_id, target_user_id, action, details, timestamp
  ) VALUES (
    current_user_id, target_user_id, 'role_removed', 
    json_build_object('role', target_role), now()
  );
  
  result := json_build_object(
    'success', true,
    'message', 'Role removed successfully'
  );
  
  RETURN result;
END;
$$;

-- Create admin activity logging table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on admin activity logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and sysadmins can view activity logs
CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sysadmin'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_user_id ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_target_user_id ON public.admin_activity_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_timestamp ON public.admin_activity_logs(timestamp DESC);
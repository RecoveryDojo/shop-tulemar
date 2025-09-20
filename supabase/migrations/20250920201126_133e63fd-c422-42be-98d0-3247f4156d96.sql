-- Fix security warnings by setting search_path for all functions

-- Enhanced workflow validation function with security fix
CREATE OR REPLACE FUNCTION validate_workflow_transition(
  p_order_id UUID,
  p_current_status TEXT,
  p_new_status TEXT,
  p_user_id UUID,
  p_action TEXT
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_valid_transitions JSONB;
  v_user_role TEXT;
  v_result JSONB;
BEGIN
  -- Get current order state
  SELECT * INTO v_order 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Order not found');
  END IF;
  
  -- Check if current status matches expected
  IF v_order.status != p_current_status THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', 'Status mismatch: expected ' || p_current_status || ', got ' || v_order.status,
      'current_status', v_order.status
    );
  END IF;
  
  -- Define valid transitions
  v_valid_transitions := '{
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["assigned", "cancelled"], 
    "assigned": ["shopping", "cancelled"],
    "shopping": ["packed", "cancelled"],
    "packed": ["in_transit", "cancelled"],
    "in_transit": ["delivered", "cancelled"],
    "delivered": [],
    "cancelled": []
  }'::jsonb;
  
  -- Check if transition is valid
  IF NOT (v_valid_transitions->p_current_status ? p_new_status) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid transition from ' || p_current_status || ' to ' || p_new_status,
      'allowed_transitions', v_valid_transitions->p_current_status
    );
  END IF;
  
  -- Get user role for authorization checks
  SELECT string_agg(role::text, ',') INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id;
  
  -- Validate user permissions for specific actions
  IF p_action = 'accept_order' AND v_order.assigned_shopper_id IS NOT NULL AND v_order.assigned_shopper_id != p_user_id THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Order already assigned to another shopper');
  END IF;
  
  IF p_action IN ('start_shopping', 'complete_shopping', 'start_delivery', 'complete_delivery') 
     AND v_order.assigned_shopper_id != p_user_id THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Action not allowed - not assigned shopper');
  END IF;
  
  -- Additional business rule validations
  IF p_action = 'start_delivery' AND p_current_status = 'packed' THEN
    -- Check if all items are processed
    IF EXISTS (
      SELECT 1 FROM order_items 
      WHERE order_id = p_order_id 
      AND shopping_status = 'pending'
    ) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Cannot start delivery - pending items remain');
    END IF;
  END IF;
  
  RETURN jsonb_build_object('valid', true, 'message', 'Transition validated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Workflow transition audit trigger function with security fix
CREATE OR REPLACE FUNCTION audit_workflow_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all order status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO order_workflow_log (
      order_id,
      actor_id,
      action,
      phase,
      previous_status,
      new_status,
      actor_role,
      metadata
    ) VALUES (
      NEW.id,
      auth.uid(),
      'status_change',
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'order_confirmation'
        WHEN NEW.status = 'assigned' THEN 'order_assignment'
        WHEN NEW.status = 'shopping' THEN 'shopping'
        WHEN NEW.status = 'packed' THEN 'shopping'
        WHEN NEW.status = 'in_transit' THEN 'delivery'
        WHEN NEW.status = 'delivered' THEN 'delivery'
        ELSE 'general'
      END,
      OLD.status,
      NEW.status,
      'system',
      jsonb_build_object(
        'timestamp', now(),
        'trigger', 'audit_workflow_transition',
        'old_updated_at', OLD.updated_at,
        'new_updated_at', NEW.updated_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Order assignment validation function with security fix
CREATE OR REPLACE FUNCTION validate_order_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent multiple shoppers from being assigned to the same order
  IF NEW.assigned_shopper_id IS NOT NULL AND OLD.assigned_shopper_id IS NOT NULL 
     AND NEW.assigned_shopper_id != OLD.assigned_shopper_id THEN
    RAISE EXCEPTION 'Cannot reassign order to different shopper without explicit reassignment process';
  END IF;
  
  -- Ensure status is updated when shopper is assigned
  IF NEW.assigned_shopper_id IS NOT NULL AND OLD.assigned_shopper_id IS NULL THEN
    IF NEW.status NOT IN ('assigned', 'shopping', 'packed', 'in_transit', 'delivered') THEN
      NEW.status := 'assigned';
    END IF;
  END IF;
  
  -- Clear assignment if status goes back to pending/confirmed
  IF NEW.status IN ('pending', 'confirmed') AND OLD.assigned_shopper_id IS NOT NULL THEN
    NEW.assigned_shopper_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Rollback workflow status function with security fix
CREATE OR REPLACE FUNCTION rollback_workflow_status(
  p_order_id UUID,
  p_target_status TEXT,
  p_reason TEXT DEFAULT 'Manual rollback'
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_valid_rollbacks JSONB;
  v_result JSONB;
BEGIN
  -- Get current order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;
  
  -- Define valid rollback paths
  v_valid_rollbacks := '{
    "assigned": ["confirmed"],
    "shopping": ["assigned"],
    "packed": ["shopping"],
    "in_transit": ["packed"]
  }'::jsonb;
  
  -- Validate rollback
  IF NOT (v_valid_rollbacks->v_order.status ? p_target_status) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot rollback from ' || v_order.status || ' to ' || p_target_status
    );
  END IF;
  
  -- Perform rollback
  UPDATE orders 
  SET 
    status = p_target_status,
    updated_at = now()
  WHERE id = p_order_id;
  
  -- Log rollback action
  INSERT INTO order_workflow_log (
    order_id,
    actor_id,
    action,
    phase,
    previous_status,
    new_status,
    actor_role,
    notes,
    metadata
  ) VALUES (
    p_order_id,
    auth.uid(),
    'rollback_status',
    'rollback',
    v_order.status,
    p_target_status,
    'admin',
    p_reason,
    jsonb_build_object(
      'rollback_timestamp', now(),
      'original_status', v_order.status,
      'rollback_reason', p_reason
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Status rolled back successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Workflow integrity check function with security fix
CREATE OR REPLACE FUNCTION check_workflow_integrity()
RETURNS TABLE(
  order_id UUID,
  issue_type TEXT,
  issue_description TEXT,
  severity TEXT,
  suggested_fix TEXT
) AS $$
BEGIN
  -- Check for orders with inconsistent status/timestamp combinations
  RETURN QUERY
  SELECT 
    o.id,
    'timestamp_inconsistency'::TEXT,
    'Order has shopping_started_at but status is not shopping or later'::TEXT,
    'high'::TEXT,
    'Update status to shopping or clear timestamp'::TEXT
  FROM orders o
  WHERE o.shopping_started_at IS NOT NULL 
    AND o.status IN ('pending', 'confirmed', 'assigned');
  
  RETURN QUERY
  SELECT 
    o.id,
    'assignment_inconsistency'::TEXT,
    'Order has assigned_shopper_id but status is pending/confirmed'::TEXT,
    'high'::TEXT,
    'Update status to assigned or clear shopper assignment'::TEXT
  FROM orders o
  WHERE o.assigned_shopper_id IS NOT NULL 
    AND o.status IN ('pending', 'confirmed');
  
  RETURN QUERY
  SELECT 
    o.id,
    'delivery_inconsistency'::TEXT,
    'Order has delivery_started_at but status is not in_transit or delivered'::TEXT,
    'critical'::TEXT,
    'Update status to in_transit or clear delivery timestamp'::TEXT
  FROM orders o
  WHERE o.delivery_started_at IS NOT NULL 
    AND o.status NOT IN ('in_transit', 'delivered');
  
  -- Check for orders stuck in intermediate states
  RETURN QUERY
  SELECT 
    o.id,
    'stuck_order'::TEXT,
    'Order has been in ' || o.status || ' state for over 24 hours'::TEXT,
    'medium'::TEXT,
    'Review order status and take appropriate action'::TEXT
  FROM orders o
  WHERE o.status IN ('assigned', 'shopping', 'packed', 'in_transit')
    AND o.updated_at < now() - INTERVAL '24 hours';
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
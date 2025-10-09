-- Migration: Add concierge notification on order ready status + Update RLS policy
-- This updates rpc_advance_status to automatically notify concierges when orders reach 'ready'
-- and updates the RLS policy to allow concierges to view both ready and delivered orders

-- Update rpc_advance_status to notify concierge when order reaches 'ready'
CREATE OR REPLACE FUNCTION public.rpc_advance_status(
  p_order_id uuid, 
  p_to text, 
  p_expected_status text, 
  p_actor_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_status TEXT;
  v_safe_role TEXT;
  v_expected_lower TEXT;
  v_current_lower TEXT;
  v_to_lower TEXT;
  v_concierge_id UUID;
  v_customer_name TEXT;
  v_property_address TEXT;
BEGIN
  -- Normalize to lowercase
  v_expected_lower := LOWER(p_expected_status);
  v_to_lower := LOWER(p_to);
  
  -- Read current order status and info
  SELECT 
    LOWER(status),
    assigned_concierge_id,
    customer_name,
    property_address
  INTO 
    v_current_lower, 
    v_concierge_id, 
    v_customer_name,
    v_property_address
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Check stale write
  IF v_current_lower != v_expected_lower THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STALE_WRITE';
  END IF;
  
  -- Check legal transition
  IF NOT is_legal_transition(v_expected_lower, v_to_lower) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ILLEGAL_TRANSITION';
  END IF;
  
  -- Determine safe actor role
  SELECT CASE 
    WHEN auth.uid() = assigned_shopper_id THEN 'shopper'
    WHEN auth.uid() = assigned_concierge_id THEN 'concierge'
    ELSE COALESCE(current_setting('app.current_user_role', true), 'system')
  END INTO v_safe_role
  FROM orders WHERE id = p_order_id;
  
  -- Update order status
  UPDATE orders 
  SET status = v_to_lower,
      updated_at = now()
  WHERE id = p_order_id;
  
  -- Insert status change event
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (
    p_order_id, 
    'STATUS_CHANGED', 
    v_safe_role, 
    jsonb_build_object('from', v_expected_lower, 'to', v_to_lower)
  );
  
  -- If status changed to 'ready', notify concierge
  IF v_to_lower = 'ready' THEN
    -- Auto-assign concierge if not already assigned
    IF v_concierge_id IS NULL THEN
      SELECT user_id INTO v_concierge_id
      FROM user_roles
      WHERE role = 'concierge'
      ORDER BY created_at ASC
      LIMIT 1;
      
      IF v_concierge_id IS NOT NULL THEN
        UPDATE orders 
        SET assigned_concierge_id = v_concierge_id 
        WHERE id = p_order_id;
      END IF;
    END IF;
    
    -- Insert notification for concierge
    IF v_concierge_id IS NOT NULL THEN
      INSERT INTO order_notifications (
        order_id,
        notification_type,
        recipient_type,
        recipient_identifier,
        channel,
        status,
        message_content,
        metadata
      ) VALUES (
        p_order_id,
        'order_ready_for_delivery',
        'concierge',
        v_concierge_id::text,
        'push',
        'pending',
        'Order for ' || COALESCE(v_customer_name, 'customer') || ' is ready for delivery to ' || COALESCE(v_property_address, 'property'),
        jsonb_build_object(
          'order_id', p_order_id,
          'customer_name', v_customer_name,
          'property_address', v_property_address
        )
      );
      
      -- Insert concierge notification event
      INSERT INTO new_order_events (
        order_id,
        event_type,
        actor_role,
        data
      ) VALUES (
        p_order_id,
        'CONCIERGE_NOTIFIED',
        'system',
        jsonb_build_object(
          'concierge_id', v_concierge_id,
          'notification_type', 'ready_for_delivery'
        )
      );
    END IF;
  END IF;
  
  RETURN json_build_object('ok', true, 'order_id', p_order_id, 'to', v_to_lower);
END;
$function$;

-- Update RLS policy to allow concierges to view both ready and delivered orders
DROP POLICY IF EXISTS "Concierges can view delivered orders" ON orders;

CREATE POLICY "Concierges can view ready and delivered orders" ON orders
FOR SELECT
USING (
  status IN ('ready','delivered')
  AND has_role(auth.uid(), 'concierge'::app_role)
);
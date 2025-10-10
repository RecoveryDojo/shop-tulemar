-- Update rpc_advance_status to handle concierge auto-assignment and checklist creation
CREATE OR REPLACE FUNCTION public.rpc_advance_status(p_order_id uuid, p_to text, p_expected_status text, p_actor_role text)
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
  v_assigned_concierge_id UUID;
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
    v_assigned_concierge_id,
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
    WHEN auth.uid() = v_assigned_concierge_id THEN 'concierge'
    ELSE COALESCE(current_setting('app.current_user_role', true), 'system')
  END INTO v_safe_role
  FROM orders WHERE id = p_order_id;
  
  -- Special handling for ready → delivered by concierge
  IF v_expected_lower = 'ready' AND v_to_lower = 'delivered' AND v_safe_role = 'concierge' THEN
    -- Auto-assign concierge if not already assigned
    IF v_assigned_concierge_id IS NULL THEN
      v_assigned_concierge_id := auth.uid();
      UPDATE orders 
      SET assigned_concierge_id = v_assigned_concierge_id 
      WHERE id = p_order_id;
    END IF;
    
    -- Create concierge_checklist row (ON CONFLICT DO NOTHING)
    INSERT INTO concierge_checklist (order_id)
    VALUES (p_order_id)
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  
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
    IF v_assigned_concierge_id IS NULL THEN
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
    ELSE
      v_concierge_id := v_assigned_concierge_id;
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
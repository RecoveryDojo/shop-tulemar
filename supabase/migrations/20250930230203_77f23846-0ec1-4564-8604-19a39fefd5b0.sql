-- Step 1 & 2: Update database functions and RLS to use lowercase

-- Update is_legal_transition to use lowercase
CREATE OR REPLACE FUNCTION public.is_legal_transition(from_status text, to_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE 
    WHEN from_status = 'placed' AND to_status = 'claimed' THEN TRUE
    WHEN from_status = 'claimed' AND to_status = 'shopping' THEN TRUE
    WHEN from_status = 'shopping' AND to_status = 'ready' THEN TRUE
    WHEN from_status = 'ready' AND to_status = 'delivered' THEN TRUE
    WHEN from_status = 'delivered' AND to_status = 'closed' THEN TRUE
    WHEN to_status = 'canceled' THEN TRUE -- Any status can go to canceled
    ELSE FALSE
  END;
$function$;

-- Update rpc_assign_shopper to normalize case
CREATE OR REPLACE FUNCTION public.rpc_assign_shopper(p_order_id uuid, p_shopper_id uuid, p_expected_status text, p_actor_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_status TEXT;
  v_new_status TEXT;
  v_safe_role TEXT;
  v_expected_lower TEXT;
  v_current_lower TEXT;
BEGIN
  -- Normalize to lowercase
  v_expected_lower := LOWER(p_expected_status);
  
  -- Read current status
  SELECT LOWER(status) INTO v_current_lower 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Check stale write
  IF v_current_lower != v_expected_lower THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STALE_WRITE';
  END IF;
  
  -- Allow only placed or claimed
  IF v_expected_lower NOT IN ('placed', 'claimed') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ILLEGAL_TRANSITION';
  END IF;
  
  -- Determine new status
  v_new_status := CASE 
    WHEN v_expected_lower = 'placed' THEN 'claimed'
    ELSE v_expected_lower
  END;
  
  -- Determine safe actor role
  SELECT CASE 
    WHEN auth.uid() = assigned_shopper_id THEN 'shopper'
    WHEN auth.uid() = assigned_concierge_id THEN 'concierge'
    ELSE COALESCE(current_setting('app.current_user_role', true), 'system')
  END INTO v_safe_role
  FROM orders WHERE id = p_order_id;
  
  -- Update order
  UPDATE orders 
  SET assigned_shopper_id = p_shopper_id,
      status = v_new_status,
      updated_at = now()
  WHERE id = p_order_id;
  
  -- Insert event
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'ASSIGNED', v_safe_role, jsonb_build_object('shopper_id', p_shopper_id));
  
  RETURN json_build_object('ok', true, 'order_id', p_order_id, 'new_status', v_new_status);
END;
$function$;

-- Update rpc_pick_item to normalize case
CREATE OR REPLACE FUNCTION public.rpc_pick_item(p_order_id uuid, p_item_id uuid, p_qty_picked integer, p_expected_status text, p_actor_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_status TEXT;
  v_max_qty INTEGER;
  v_clamped_qty INTEGER;
  v_safe_role TEXT;
  v_expected_lower TEXT;
  v_current_lower TEXT;
BEGIN
  -- Normalize to lowercase
  v_expected_lower := LOWER(p_expected_status);
  
  -- Check order status
  SELECT LOWER(status) INTO v_current_lower 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Require shopping status
  IF v_expected_lower != 'shopping' OR v_current_lower != 'shopping' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ILLEGAL_TRANSITION';
  END IF;
  
  -- Get item max quantity
  SELECT qty INTO v_max_qty 
  FROM new_order_items 
  WHERE id = p_item_id AND order_id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ITEM_NOT_FOUND';
  END IF;
  
  -- Determine safe actor role
  SELECT CASE 
    WHEN auth.uid() = assigned_shopper_id THEN 'shopper'
    WHEN auth.uid() = assigned_concierge_id THEN 'concierge'
    ELSE COALESCE(current_setting('app.current_user_role', true), 'system')
  END INTO v_safe_role
  FROM orders WHERE id = p_order_id;
  
  -- Clamp quantity
  v_clamped_qty := GREATEST(0, LEAST(p_qty_picked, v_max_qty));
  
  -- Update item
  UPDATE new_order_items 
  SET qty_picked = v_clamped_qty
  WHERE id = p_item_id;
  
  -- Insert event
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'ITEM_PICKED', v_safe_role, jsonb_build_object('item_id', p_item_id, 'qty_picked', v_clamped_qty));
  
  RETURN json_build_object('ok', true, 'order_id', p_order_id, 'item_id', p_item_id, 'qty_picked', v_clamped_qty);
END;
$function$;

-- Update rpc_suggest_sub to normalize case
CREATE OR REPLACE FUNCTION public.rpc_suggest_sub(p_order_id uuid, p_item_id uuid, p_suggested_sku text, p_expected_status text, p_actor_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_status TEXT;
  v_safe_role TEXT;
  v_current_lower TEXT;
BEGIN
  -- Normalize to lowercase
  v_current_lower := LOWER(p_expected_status);
  
  -- Check order status
  SELECT LOWER(status) INTO v_current_lower 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Require shopping status
  IF v_current_lower != 'shopping' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ILLEGAL_TRANSITION';
  END IF;
  
  -- Verify item
  IF NOT EXISTS (SELECT 1 FROM new_order_items WHERE id = p_item_id AND order_id = p_order_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ITEM_NOT_FOUND';
  END IF;
  
  -- Determine safe actor role
  SELECT CASE 
    WHEN auth.uid() = assigned_shopper_id THEN 'shopper'
    WHEN auth.uid() = assigned_concierge_id THEN 'concierge'
    ELSE COALESCE(current_setting('app.current_user_role', true), 'system')
  END INTO v_safe_role
  FROM orders WHERE id = p_order_id;
  
  -- Insert event
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'SUBSTITUTION_SUGGESTED', v_safe_role, jsonb_build_object('item_id', p_item_id, 'suggested_sku', p_suggested_sku));
  
  RETURN json_build_object('ok', true);
END;
$function$;

-- Update rpc_decide_sub to normalize case
CREATE OR REPLACE FUNCTION public.rpc_decide_sub(p_order_id uuid, p_item_id uuid, p_decision text, p_expected_status text, p_actor_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_status TEXT;
  v_safe_role TEXT;
  v_current_lower TEXT;
BEGIN
  -- Normalize to lowercase
  v_current_lower := LOWER(p_expected_status);
  
  -- Check order status
  SELECT LOWER(status) INTO v_current_lower 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Require shopping or ready status
  IF v_current_lower NOT IN ('shopping', 'ready') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ILLEGAL_TRANSITION';
  END IF;
  
  -- Validate decision
  IF p_decision NOT IN ('accept', 'reject') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_DECISION';
  END IF;
  
  -- Verify item
  IF NOT EXISTS (SELECT 1 FROM new_order_items WHERE id = p_item_id AND order_id = p_order_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ITEM_NOT_FOUND';
  END IF;
  
  -- Determine safe actor role
  v_safe_role := COALESCE(current_setting('app.current_user_role', true), 'customer');
  
  -- Insert event
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'SUBSTITUTION_DECIDED', v_safe_role, jsonb_build_object('item_id', p_item_id, 'decision', p_decision));
  
  RETURN json_build_object('ok', true, 'decision', p_decision);
END;
$function$;

-- Update rpc_advance_status to normalize case
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
BEGIN
  -- Normalize to lowercase
  v_expected_lower := LOWER(p_expected_status);
  v_to_lower := LOWER(p_to);
  
  -- Read current status
  SELECT LOWER(status) INTO v_current_lower 
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
  
  -- Insert event
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'STATUS_CHANGED', v_safe_role, jsonb_build_object('from', v_expected_lower, 'to', v_to_lower));
  
  RETURN json_build_object('ok', true, 'order_id', p_order_id, 'to', v_to_lower);
END;
$function$;
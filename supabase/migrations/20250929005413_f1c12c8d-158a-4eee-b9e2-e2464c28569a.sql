-- Canonical Workflow RPCs Migration
-- Created: 2025-01-09
-- Description: Implements canonical statuses, backing table indexes, and guarded RPC functions

-- 1) Canonical statuses + validator
CREATE OR REPLACE FUNCTION public.is_legal_transition(from_status text, to_status text)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN from_status = 'PLACED' AND to_status = 'CLAIMED' THEN TRUE
    WHEN from_status = 'CLAIMED' AND to_status = 'SHOPPING' THEN TRUE
    WHEN from_status = 'SHOPPING' AND to_status = 'READY' THEN TRUE
    WHEN from_status = 'READY' AND to_status = 'DELIVERED' THEN TRUE
    WHEN from_status = 'DELIVERED' AND to_status = 'CLOSED' THEN TRUE
    WHEN to_status = 'CANCELED' THEN TRUE -- Any status can go to CANCELED
    ELSE FALSE
  END;
$$;

-- 2) Index the BACKING TABLES (not views)
CREATE INDEX IF NOT EXISTS idx_new_order_events_order_created ON public.new_order_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_new_order_items_order ON public.new_order_items(order_id);

-- 3) Guarded RPCs using canonical statuses and backing tables

-- A) Assign shopper to order
CREATE OR REPLACE FUNCTION public.rpc_assign_shopper(
  p_order_id UUID,
  p_shopper_id UUID,
  p_expected_status TEXT,
  p_actor_role TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_new_status TEXT;
  v_safe_role TEXT;
BEGIN
  -- Read current status
  SELECT status INTO v_current_status 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Check stale write
  IF v_current_status != p_expected_status THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STALE_WRITE';
  END IF;
  
  -- Allow only PLACED or CLAIMED
  IF p_expected_status NOT IN ('PLACED', 'CLAIMED') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ILLEGAL_TRANSITION';
  END IF;
  
  -- Determine new status
  v_new_status := CASE 
    WHEN p_expected_status = 'PLACED' THEN 'CLAIMED'
    ELSE p_expected_status
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
  
  -- Insert event into backing table
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'ASSIGNED', v_safe_role, jsonb_build_object('shopper_id', p_shopper_id));
  
  RETURN json_build_object('ok', true, 'order_id', p_order_id, 'new_status', v_new_status);
END;
$$;

-- B) Pick item quantity
CREATE OR REPLACE FUNCTION public.rpc_pick_item(
  p_order_id UUID,
  p_item_id UUID,
  p_qty_picked INTEGER,
  p_expected_status TEXT,
  p_actor_role TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_max_qty INTEGER;
  v_clamped_qty INTEGER;
  v_safe_role TEXT;
BEGIN
  -- Check order status
  SELECT status INTO v_current_status 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Require SHOPPING status
  IF p_expected_status != 'SHOPPING' OR v_current_status != 'SHOPPING' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ILLEGAL_TRANSITION';
  END IF;
  
  -- Get item max quantity and verify it belongs to order
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
  
  -- Clamp quantity to [0, item.qty]
  v_clamped_qty := GREATEST(0, LEAST(p_qty_picked, v_max_qty));
  
  -- Update item in backing table
  UPDATE new_order_items 
  SET qty_picked = v_clamped_qty
  WHERE id = p_item_id;
  
  -- Insert event into backing table
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'ITEM_PICKED', v_safe_role, jsonb_build_object('item_id', p_item_id, 'qty_picked', v_clamped_qty));
  
  RETURN json_build_object('ok', true, 'order_id', p_order_id, 'item_id', p_item_id, 'qty_picked', v_clamped_qty);
END;
$$;

-- C) Suggest substitution
CREATE OR REPLACE FUNCTION public.rpc_suggest_sub(
  p_order_id UUID,
  p_item_id UUID,
  p_suggested_sku TEXT,
  p_expected_status TEXT,
  p_actor_role TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_safe_role TEXT;
BEGIN
  -- Check order status
  SELECT status INTO v_current_status 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Require SHOPPING status
  IF v_current_status != 'SHOPPING' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ILLEGAL_TRANSITION';
  END IF;
  
  -- Verify item belongs to order
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
  
  -- Insert event into backing table
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'SUBSTITUTION_SUGGESTED', v_safe_role, jsonb_build_object('item_id', p_item_id, 'suggested_sku', p_suggested_sku));
  
  RETURN json_build_object('ok', true);
END;
$$;

-- D) Decide on substitution
CREATE OR REPLACE FUNCTION public.rpc_decide_sub(
  p_order_id UUID,
  p_item_id UUID,
  p_decision TEXT,
  p_expected_status TEXT,
  p_actor_role TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_safe_role TEXT;
BEGIN
  -- Check order status
  SELECT status INTO v_current_status 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Require SHOPPING or READY status
  IF v_current_status NOT IN ('SHOPPING', 'READY') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ILLEGAL_TRANSITION';
  END IF;
  
  -- Validate decision
  IF p_decision NOT IN ('accept', 'reject') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_DECISION';
  END IF;
  
  -- Verify item belongs to order
  IF NOT EXISTS (SELECT 1 FROM new_order_items WHERE id = p_item_id AND order_id = p_order_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ITEM_NOT_FOUND';
  END IF;
  
  -- Determine safe actor role (customer can decide)
  v_safe_role := COALESCE(current_setting('app.current_user_role', true), 'customer');
  
  -- Insert event into backing table
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'SUBSTITUTION_DECIDED', v_safe_role, jsonb_build_object('item_id', p_item_id, 'decision', p_decision));
  
  RETURN json_build_object('ok', true, 'decision', p_decision);
END;
$$;

-- E) Advance order status
CREATE OR REPLACE FUNCTION public.rpc_advance_status(
  p_order_id UUID,
  p_to TEXT,
  p_expected_status TEXT,
  p_actor_role TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_safe_role TEXT;
BEGIN
  -- Read current status
  SELECT status INTO v_current_status 
  FROM orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Check stale write
  IF v_current_status != p_expected_status THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'STALE_WRITE';
  END IF;
  
  -- Check legal transition
  IF NOT is_legal_transition(p_expected_status, p_to) THEN
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
  SET status = p_to,
      updated_at = now()
  WHERE id = p_order_id;
  
  -- Insert event into backing table
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (p_order_id, 'STATUS_CHANGED', v_safe_role, jsonb_build_object('from', p_expected_status, 'to', p_to));
  
  RETURN json_build_object('ok', true, 'order_id', p_order_id, 'to', p_to);
END;
$$;
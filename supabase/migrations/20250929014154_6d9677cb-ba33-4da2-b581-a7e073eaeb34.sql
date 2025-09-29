-- Create RPC for adding test events
CREATE OR REPLACE FUNCTION public.rpc_add_test_event(p_order_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Verify order exists
  IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ORDER_NOT_FOUND';
  END IF;
  
  -- Insert test event into backing table
  INSERT INTO new_order_events (order_id, event_type, actor_role, data)
  VALUES (
    p_order_id, 
    'TEST_EVENT', 
    'system', 
    jsonb_build_object('note', 'Manual test event', 'ts', now())
  );
  
  RETURN json_build_object('ok', true, 'message', 'Test event added successfully');
END;
$function$;
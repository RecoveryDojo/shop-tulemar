-- Fix validate_order_assignment trigger to use canonical statuses only
CREATE OR REPLACE FUNCTION public.validate_order_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Prevent multiple shoppers from being assigned to the same order
  IF NEW.assigned_shopper_id IS NOT NULL AND OLD.assigned_shopper_id IS NOT NULL 
     AND NEW.assigned_shopper_id != OLD.assigned_shopper_id THEN
    RAISE EXCEPTION 'Cannot reassign order to different shopper without explicit reassignment process';
  END IF;
  
  -- When shopper is first assigned, move from placed -> claimed (canonical)
  IF NEW.assigned_shopper_id IS NOT NULL AND OLD.assigned_shopper_id IS NULL THEN
    IF NEW.status = 'placed' THEN
      NEW.status := 'claimed';
    END IF;
  END IF;
  
  -- Clear assignment if status goes back to placed
  IF NEW.status = 'placed' AND OLD.assigned_shopper_id IS NOT NULL THEN
    NEW.assigned_shopper_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;
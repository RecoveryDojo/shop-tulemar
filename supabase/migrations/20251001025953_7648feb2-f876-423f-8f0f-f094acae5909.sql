-- ============================================
-- CANONICAL STATUS ALIGNMENT - FINAL VERSION
-- ============================================
-- This migration resolves conflicting status definitions and ensures
-- all database functions and policies use canonical lowercase statuses.

-- 1. Drop and recreate is_legal_transition with canonical lowercase statuses
-- This is the DEFINITIVE version - no uppercase variants allowed
DROP FUNCTION IF EXISTS public.is_legal_transition(text, text);

CREATE OR REPLACE FUNCTION public.is_legal_transition(from_status text, to_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE 
    -- Canonical lowercase transitions only
    WHEN from_status = 'placed' AND to_status = 'claimed' THEN TRUE
    WHEN from_status = 'claimed' AND to_status = 'shopping' THEN TRUE
    WHEN from_status = 'shopping' AND to_status = 'ready' THEN TRUE
    WHEN from_status = 'ready' AND to_status = 'delivered' THEN TRUE
    WHEN from_status = 'delivered' AND to_status = 'closed' THEN TRUE
    WHEN to_status = 'canceled' THEN TRUE -- Any status can go to canceled
    ELSE FALSE
  END;
$function$;

COMMENT ON FUNCTION public.is_legal_transition(text, text) IS 
  'Validates order status transitions using canonical lowercase vocabulary: placed → claimed → shopping → ready → delivered → closed (or canceled at any point). This is the definitive version.';

-- 2. Fix RLS policy for shopper visibility
-- Change from 'pending' to 'placed' to match canonical statuses
DROP POLICY IF EXISTS "Shoppers can view available orders for assignment" ON public.orders;

CREATE POLICY "Shoppers can view available orders for assignment" 
ON public.orders 
FOR SELECT 
USING (
  status = 'placed' 
  AND assigned_shopper_id IS NULL 
  AND has_role(auth.uid(), 'shopper'::app_role)
);

COMMENT ON POLICY "Shoppers can view available orders for assignment" ON public.orders IS 
  'Allows shoppers to see unassigned orders with canonical ''placed'' status';

-- 3. Verify all status columns contain only canonical lowercase values
-- This is a data integrity check (no changes made, just warnings if issues found)
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM public.orders
  WHERE status NOT IN ('placed', 'claimed', 'shopping', 'ready', 'delivered', 'closed', 'canceled');
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'Found % orders with non-canonical status values', invalid_count;
  END IF;
END $$;
-- Helper: admin check (safe fallback if user_roles table doesn't exist)
CREATE OR REPLACE FUNCTION public.admin_is_admin(p_user uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  BEGIN
    -- Adjust if your project uses a different roles table/column names
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles r
      WHERE r.user_id = p_user
        AND r.role IN ('admin','sysadmin')
    ) INTO is_admin;
  EXCEPTION WHEN undefined_table THEN
    -- If roles table doesn't exist yet, deny by default (no risk)
    is_admin := false;
  END;

  RETURN is_admin;
END;
$$;

-- Admin-only item counts (bypasses RLS via SECURITY DEFINER, read-only)
CREATE OR REPLACE FUNCTION public.admin_order_item_counts(p_order_id uuid)
RETURNS TABLE(order_items_count int, new_order_items_count int, total int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF NOT public.admin_is_admin(uid) THEN
    RAISE EXCEPTION 'FORBIDDEN: Admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    WITH c1 AS (
      SELECT COUNT(*)::int AS cnt FROM public.order_items WHERE order_id = p_order_id
    ),
    c2 AS (
      SELECT COUNT(*)::int AS cnt FROM public.new_order_items WHERE order_id = p_order_id
    )
    SELECT
      (SELECT cnt FROM c1) AS order_items_count,
      (SELECT cnt FROM c2) AS new_order_items_count,
      (SELECT cnt FROM c1) + (SELECT cnt FROM c2) AS total;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.admin_order_item_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_is_admin(uuid) TO authenticated;
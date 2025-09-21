-- Enable full row images for realtime updates
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.stakeholder_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.order_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.order_workflow_log REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication, ignore if already added
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stakeholder_assignments;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_workflow_log;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
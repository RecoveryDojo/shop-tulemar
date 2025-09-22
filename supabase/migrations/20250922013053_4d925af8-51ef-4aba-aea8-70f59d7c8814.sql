-- Create order_events table for centralized event logging
CREATE TABLE public.order_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  actor_id UUID NULL,
  actor_role TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin/Sysadmin can view all order events" 
ON public.order_events 
FOR SELECT 
USING (is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Users can view events for their orders" 
ON public.order_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.id = order_events.order_id 
  AND o.customer_email = get_current_user_email()
));

CREATE POLICY "Shoppers can view events for their assigned orders" 
ON public.order_events 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM orders o 
  WHERE o.id = order_events.order_id 
  AND o.assigned_shopper_id = auth.uid()
));

CREATE POLICY "System can insert order events" 
ON public.order_events 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX idx_order_events_created_at ON public.order_events(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_order_events_updated_at
BEFORE UPDATE ON public.order_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_events;
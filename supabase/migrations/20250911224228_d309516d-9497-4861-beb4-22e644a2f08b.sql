-- Add read_at column to order_notifications table for tracking read status
ALTER TABLE public.order_notifications 
ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;

-- Enable replica identity for real-time updates
ALTER TABLE public.order_notifications REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notifications;
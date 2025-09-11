-- Create user_messages table for direct messaging
CREATE TABLE public.user_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  thread_id UUID,
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'broadcast', 'emergency'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  sent_via_email BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_threads table for conversation tracking
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  participant_ids UUID[] NOT NULL,
  thread_type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'group', 'support'
  is_archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_preferences table for notification settings
CREATE TABLE public.email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  message_notifications BOOLEAN NOT NULL DEFAULT true,
  order_notifications BOOLEAN NOT NULL DEFAULT true,
  system_notifications BOOLEAN NOT NULL DEFAULT true,
  emergency_notifications BOOLEAN NOT NULL DEFAULT true,
  email_frequency TEXT NOT NULL DEFAULT 'immediate', -- 'immediate', 'hourly', 'daily', 'weekly'
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add messaging-related fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available'; -- 'available', 'busy', 'offline'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_hours TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Enable Row Level Security
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_messages
CREATE POLICY "Users can view messages they sent or received"
ON public.user_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Users can send messages"
ON public.user_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
ON public.user_messages
FOR UPDATE
USING (auth.uid() = recipient_id OR is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Admins can delete messages"
ON public.user_messages
FOR DELETE
USING (is_admin_or_sysadmin(auth.uid()));

-- Create policies for message_threads
CREATE POLICY "Users can view threads they participate in"
ON public.message_threads
FOR SELECT
USING (auth.uid() = ANY(participant_ids) OR is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Users can create threads"
ON public.message_threads
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Thread participants can update threads"
ON public.message_threads
FOR UPDATE
USING (auth.uid() = ANY(participant_ids) OR is_admin_or_sysadmin(auth.uid()));

-- Create policies for email_preferences
CREATE POLICY "Users can manage their own email preferences"
ON public.email_preferences
FOR ALL
USING (auth.uid() = user_id);

-- Create function to update thread last_message_at
CREATE OR REPLACE FUNCTION public.update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.message_threads
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for updating thread timestamp
CREATE TRIGGER update_thread_on_message
AFTER INSERT ON public.user_messages
FOR EACH ROW
WHEN (NEW.thread_id IS NOT NULL)
EXECUTE FUNCTION public.update_thread_last_message();

-- Create function to automatically create email preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for new user email preferences
CREATE TRIGGER create_email_preferences_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_email_preferences();

-- Add updated_at triggers
CREATE TRIGGER update_user_messages_updated_at
BEFORE UPDATE ON public.user_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at
BEFORE UPDATE ON public.message_threads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at
BEFORE UPDATE ON public.email_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
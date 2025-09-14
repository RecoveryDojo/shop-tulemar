-- Create saved_workflows table to store workflow snapshots
CREATE TABLE public.saved_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  workflow_data JSONB NOT NULL,
  visual_config JSONB DEFAULT '{}',
  order_count INTEGER DEFAULT 0,
  phase_distribution JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_workflows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved workflows"
ON public.saved_workflows
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved workflows"
ON public.saved_workflows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved workflows"
ON public.saved_workflows
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved workflows"
ON public.saved_workflows
FOR DELETE
USING (auth.uid() = user_id);

-- Admin/Sysadmin can view all saved workflows
CREATE POLICY "Admin/Sysadmin can view all saved workflows"
ON public.saved_workflows
FOR SELECT
USING (is_admin_or_sysadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_workflows_updated_at
BEFORE UPDATE ON public.saved_workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
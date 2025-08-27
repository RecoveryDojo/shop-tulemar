-- Create documentation table for tracking work items
CREATE TABLE public.documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('build', 'fix', 'update', 'feature', 'bug', 'improvement')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned', 'in-progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    tags TEXT[] DEFAULT '{}',
    url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all for authenticated users"
ON public.documentation
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Anon all access"
ON public.documentation
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_documentation_updated_at
    BEFORE UPDATE ON public.documentation
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
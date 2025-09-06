-- Create AI learning tables for smart product processing
CREATE TABLE public.ai_learning_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL, -- 'category', 'price', 'unit', 'image', 'brand'
  input_pattern TEXT NOT NULL,
  output_value TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 0.8,
  success_count INTEGER DEFAULT 1,
  failure_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for fast pattern lookup
CREATE INDEX idx_ai_learning_patterns_type_input ON public.ai_learning_patterns(pattern_type, input_pattern);
CREATE INDEX idx_ai_learning_patterns_confidence ON public.ai_learning_patterns(pattern_type, confidence_score DESC);

-- Create AI processing feedback table
CREATE TABLE public.ai_processing_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_job_id UUID REFERENCES public.import_jobs(id),
  product_name TEXT NOT NULL,
  field_name TEXT NOT NULL, -- 'category_id', 'price', 'unit', etc.
  ai_suggestion TEXT,
  user_correction TEXT,
  was_accepted BOOLEAN DEFAULT false,
  confidence_score NUMERIC,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for feedback analysis
CREATE INDEX idx_ai_feedback_job_field ON public.ai_processing_feedback(import_job_id, field_name);
CREATE INDEX idx_ai_feedback_accepted ON public.ai_processing_feedback(was_accepted, field_name);

-- Enable RLS
ALTER TABLE public.ai_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage AI learning patterns" 
ON public.ai_learning_patterns 
FOR ALL 
USING (is_admin_or_sysadmin(auth.uid()))
WITH CHECK (is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Admins can manage AI feedback" 
ON public.ai_processing_feedback 
FOR ALL 
USING (is_admin_or_sysadmin(auth.uid()))
WITH CHECK (is_admin_or_sysadmin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_learning_patterns_updated_at
BEFORE UPDATE ON public.ai_learning_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create functions for AI learning
CREATE OR REPLACE FUNCTION public.get_ai_pattern_suggestion(
  pattern_type_param TEXT,
  input_pattern_param TEXT,
  min_confidence NUMERIC DEFAULT 0.7
)
RETURNS TABLE(output_value TEXT, confidence_score NUMERIC, usage_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    alp.output_value,
    alp.confidence_score,
    alp.success_count
  FROM public.ai_learning_patterns alp
  WHERE alp.pattern_type = pattern_type_param
    AND (alp.input_pattern = input_pattern_param OR alp.input_pattern ILIKE '%' || input_pattern_param || '%')
    AND alp.confidence_score >= min_confidence
  ORDER BY alp.confidence_score DESC, alp.success_count DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.record_ai_pattern_success(
  pattern_type_param TEXT,
  input_pattern_param TEXT,
  output_value_param TEXT,
  confidence_param NUMERIC DEFAULT 0.8
)
RETURNS UUID AS $$
DECLARE
  pattern_id UUID;
BEGIN
  -- Try to update existing pattern
  UPDATE public.ai_learning_patterns
  SET 
    success_count = success_count + 1,
    confidence_score = LEAST(0.95, confidence_score + 0.05),
    last_used_at = now(),
    updated_at = now()
  WHERE pattern_type = pattern_type_param
    AND input_pattern = input_pattern_param
    AND output_value = output_value_param
  RETURNING id INTO pattern_id;
  
  -- Create new pattern if none exists
  IF pattern_id IS NULL THEN
    INSERT INTO public.ai_learning_patterns (
      pattern_type, input_pattern, output_value, confidence_score
    ) VALUES (
      pattern_type_param, input_pattern_param, output_value_param, confidence_param
    ) RETURNING id INTO pattern_id;
  END IF;
  
  RETURN pattern_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
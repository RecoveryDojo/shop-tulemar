-- Fix security linter warnings: add search_path to functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
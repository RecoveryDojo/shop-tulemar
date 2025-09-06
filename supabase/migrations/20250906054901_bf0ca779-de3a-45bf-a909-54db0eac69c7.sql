-- Clear AI learning patterns that might be interfering with image processing
DELETE FROM ai_learning_patterns 
WHERE pattern_type IN ('image_mapping', 'image_extraction', 'anchor_mapping', 'sequential_mapping')
   OR input_pattern ILIKE '%image%'
   OR output_value ILIKE '%image%'
   OR metadata::text ILIKE '%image%';

-- Clear processing audit logs related to image processing
DELETE FROM ai_processing_audit 
WHERE pattern_type IN ('image_mapping', 'image_extraction', 'anchor_mapping', 'sequential_mapping')
   OR processing_stage ILIKE '%image%'
   OR input_data::text ILIKE '%image%'
   OR output_data::text ILIKE '%image%';

-- Clear feedback related to image processing
DELETE FROM ai_processing_feedback 
WHERE field_name ILIKE '%image%'
   OR ai_suggestion ILIKE '%image%'
   OR user_correction ILIKE '%image%'
   OR metadata::text ILIKE '%image%';

-- Reset any learning patterns with low confidence or high failure rates
UPDATE ai_learning_patterns 
SET validation_status = 'invalidated'
WHERE confidence_score < 0.5 
   OR failure_count > success_count;
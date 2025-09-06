-- Expand AI learning patterns to support enhanced learning types
ALTER TABLE public.ai_learning_patterns 
ADD COLUMN pattern_category text DEFAULT 'basic',
ADD COLUMN data_source text DEFAULT 'manual',
ADD COLUMN external_reference text,
ADD COLUMN validation_status text DEFAULT 'unvalidated',
ADD COLUMN quality_score numeric DEFAULT 0.0;

-- Create comprehensive learning pattern types
CREATE TABLE public.ai_pattern_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'basic',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert expanded pattern types
INSERT INTO public.ai_pattern_types (id, name, description, category) VALUES
('category', 'Product Category Classification', 'Learns to categorize products based on names and descriptions', 'classification'),
('unit', 'Unit Extraction & Normalization', 'Extracts and normalizes product units from names', 'extraction'),
('price', 'Price Format Normalization', 'Normalizes different price formats and currencies', 'formatting'),
('brand', 'Brand Detection & Extraction', 'Identifies product brands from various text formats', 'extraction'),
('description', 'Product Description Enhancement', 'Generates or improves product descriptions', 'enrichment'),
('image_prediction', 'Image URL Prediction', 'Predicts appropriate image URLs for products', 'enrichment'),
('nutrition', 'Nutritional Information Extraction', 'Extracts nutritional data from product information', 'enrichment'),
('allergen', 'Allergen Detection', 'Identifies allergens in product names/descriptions', 'safety'),
('size_weight', 'Size/Weight Extraction', 'Extracts product dimensions and weight information', 'extraction'),
('barcode', 'Barcode/UPC Recognition', 'Associates products with their barcode/UPC codes', 'identification'),
('seasonal', 'Seasonal Product Classification', 'Identifies seasonal availability patterns', 'classification'),
('substitute', 'Product Substitution Learning', 'Learns product substitution patterns', 'relationship'),
('quality_validation', 'Data Quality Validation', 'Validates data completeness and accuracy', 'validation');

-- Create external data sources tracking
CREATE TABLE public.external_data_sources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL, -- 'api', 'scraping', 'database', 'manual'
  base_url text,
  api_key_required boolean DEFAULT false,
  rate_limit_per_minute integer DEFAULT 60,
  reliability_score numeric DEFAULT 1.0,
  last_success_at timestamp with time zone,
  last_failure_at timestamp with time zone,
  failure_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  configuration jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert common external data sources
INSERT INTO public.external_data_sources (name, type, base_url, api_key_required, rate_limit_per_minute, configuration) VALUES
('Open Food Facts', 'api', 'https://world.openfoodfacts.org/api/v0', false, 100, '{"search_endpoint": "/product/{barcode}.json", "search_by_name": "/cgi/search.pl"}'),
('UPC Database', 'api', 'https://api.upcitemdb.com/prod/trial/lookup', true, 100, '{"requires_key": true, "response_format": "json"}'),
('Nutrition API', 'api', 'https://api.nal.usda.gov/fdc/v1', true, 1000, '{"search_endpoint": "/foods/search", "details_endpoint": "/food/{id}"}'),
('Amazon Product API', 'scraping', 'https://www.amazon.com', false, 10, '{"search_pattern": "/s?k={query}", "product_pattern": "/dp/{asin}"}'),
('Google Shopping', 'api', 'https://www.googleapis.com/shopping/search/v1', true, 100, '{"requires_custom_search_engine": true}'),
('Manufacturer Websites', 'scraping', '', false, 5, '{"dynamic_urls": true, "requires_domain_detection": true}');

-- Create enhanced import jobs with external data tracking
ALTER TABLE public.import_jobs 
ADD COLUMN external_enrichment_enabled boolean DEFAULT false,
ADD COLUMN external_sources_used jsonb DEFAULT '[]',
ADD COLUMN enrichment_stats jsonb DEFAULT '{}',
ADD COLUMN quality_metrics jsonb DEFAULT '{}';

-- Create AI processing audit log
CREATE TABLE public.ai_processing_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  import_job_id uuid REFERENCES public.import_jobs(id),
  processing_stage text NOT NULL, -- 'cleanup', 'enrichment', 'validation'
  pattern_type text NOT NULL,
  input_data jsonb,
  output_data jsonb,
  confidence_score numeric,
  data_source text,
  processing_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.ai_pattern_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Admins can manage pattern types" ON public.ai_pattern_types
  FOR ALL USING (is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Everyone can view active pattern types" ON public.ai_pattern_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage external data sources" ON public.external_data_sources
  FOR ALL USING (is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "Admins can view processing audit" ON public.ai_processing_audit
  FOR SELECT USING (is_admin_or_sysadmin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.ai_processing_audit
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_ai_patterns_category_type ON public.ai_learning_patterns(pattern_category, pattern_type);
CREATE INDEX idx_ai_patterns_quality ON public.ai_learning_patterns(quality_score DESC, confidence_score DESC);
CREATE INDEX idx_external_sources_active ON public.external_data_sources(is_active, type);
CREATE INDEX idx_audit_job_stage ON public.ai_processing_audit(import_job_id, processing_stage);
CREATE INDEX idx_audit_created_at ON public.ai_processing_audit(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_external_data_sources_updated_at
  BEFORE UPDATE ON public.external_data_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
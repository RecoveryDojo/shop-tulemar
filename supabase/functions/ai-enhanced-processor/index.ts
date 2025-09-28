import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExternalDataSource {
  id: string;
  name: string;
  type: 'api' | 'scraping' | 'database' | 'manual';
  base_url?: string;
  api_key_required: boolean;
  rate_limit_per_minute: number;
  reliability_score: number;
  configuration: any;
  is_active: boolean;
}

interface EnhancedProduct {
  id?: string;
  name: string;
  price: number;
  category_id?: string;
  unit?: string;
  description?: string;
  image_url?: string;
  origin?: string;
  stock_quantity?: number;
  
  // Enhanced fields
  barcode?: string;
  nutrition_info?: any;
  allergens?: string[];
  dimensions?: any;
  brand?: string;
  seasonal_availability?: string;
  quality_score?: number;
  confidence_scores?: any;
  data_sources?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { 
      products, 
      jobId, 
      enableExternalEnrichment = false,
      processingStages = ['cleanup', 'enrichment', 'validation']
    } = await req.json();

    console.log(`Starting enhanced AI processing for ${products.length} products`);
    
    // Get available external data sources
    const { data: dataSources } = await supabase
      .from('external_data_sources')
      .select('*')
      .eq('is_active', true)
      .order('reliability_score', { ascending: false });

    const processedProducts: EnhancedProduct[] = [];
    const processingStats = {
      total_processed: 0,
      enriched_count: 0,
      external_lookups: 0,
      failed_lookups: 0,
      processing_time_ms: 0
    };

    const startTime = Date.now();

    for (const product of products) {
      try {
        let enhancedProduct = { ...product };
        
        // Stage 1: Basic AI Cleanup and Normalization
        if (processingStages.includes('cleanup')) {
          enhancedProduct = await performBasicCleanup(enhancedProduct, supabase, openAIApiKey);
          
          await logProcessingStep({
            supabase,
            jobId,
            stage: 'cleanup',
            patternType: 'basic_normalization',
            inputData: product,
            outputData: enhancedProduct,
            success: true
          });
        }

        // Stage 2: External Data Enrichment
        if (processingStages.includes('enrichment') && enableExternalEnrichment) {
          const enrichedData = await performExternalEnrichment(
            enhancedProduct,
            dataSources || [],
            supabase,
            processingStats
          );
          
          if (enrichedData) {
            enhancedProduct = { ...enhancedProduct, ...enrichedData };
            processingStats.enriched_count++;
          }
        }

        // Stage 3: Quality Validation and Scoring
        if (processingStages.includes('validation')) {
          const validationResults = await performQualityValidation(enhancedProduct, supabase);
          enhancedProduct.quality_score = validationResults.score;
          enhancedProduct.confidence_scores = validationResults.confidence;
        }

        processedProducts.push(enhancedProduct);
        processingStats.total_processed++;

      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error);
        
        await logProcessingStep({
          supabase,
          jobId,
          stage: 'error',
          patternType: 'processing_error',
          inputData: product,
          outputData: null,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Add product with error status
        processedProducts.push({
          ...product,
          quality_score: 0,
          confidence_scores: { error: true }
        });
      }
    }

    processingStats.processing_time_ms = Date.now() - startTime;

    // Update job with processing stats
    if (jobId) {
      await supabase
        .from('import_jobs')
        .update({
          external_enrichment_enabled: enableExternalEnrichment,
          enrichment_stats: processingStats,
          quality_metrics: calculateQualityMetrics(processedProducts)
        })
        .eq('id', jobId);
    }

    console.log('Enhanced AI processing completed:', processingStats);

    return new Response(JSON.stringify({
      success: true,
      products: processedProducts,
      stats: processingStats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhanced AI processor:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performBasicCleanup(product: any, supabase: any, openAIApiKey: string): Promise<EnhancedProduct> {
  // Apply existing learning patterns
  const enhancedProduct = await applyLearningPatterns(product, supabase);
  
  // Use AI for advanced cleanup and normalization
  const prompt = `
You are a product data expert. Clean and normalize this product data:

Product: ${JSON.stringify(product)}

Tasks:
1. Standardize the product name (remove extra spaces, fix capitalization)
2. Extract and normalize the unit (e.g., "500g", "1 liter", "pack of 12")
3. Detect the brand if present in the name
4. Generate a brief, professional description if missing
5. Estimate stock quantity if not provided (reasonable default)
6. Validate and format the price

Return ONLY a JSON object with the cleaned data. Use these exact field names:
{
  "name": "cleaned name",
  "unit": "standardized unit",
  "brand": "detected brand or null",
  "description": "professional description",
  "price": numeric_value,
  "stock_quantity": numeric_value,
  "confidence": {"name": 0.9, "unit": 0.8, "brand": 0.7, "description": 0.6}
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const result = await response.json();
    const cleanedData = JSON.parse(result.choices[0].message.content);
    
    return {
      ...enhancedProduct,
      ...cleanedData,
      confidence_scores: cleanedData.confidence
    };
  } catch (error) {
    console.error('Error in basic cleanup:', error);
    return enhancedProduct;
  }
}

async function performExternalEnrichment(
  product: EnhancedProduct,
  dataSources: ExternalDataSource[],
  supabase: any,
  stats: any
): Promise<Partial<EnhancedProduct> | null> {
  const enrichmentData: Partial<EnhancedProduct> = {};
  const sourcesUsed: string[] = [];

  // Try Open Food Facts first (if it's a food product)
  const openFoodFacts = dataSources.find(ds => ds.name === 'Open Food Facts');
  if (openFoodFacts && product.name) {
    try {
      stats.external_lookups++;
      const nutritionData = await searchOpenFoodFacts(product.name);
      if (nutritionData) {
        enrichmentData.nutrition_info = nutritionData.nutrition;
        enrichmentData.allergens = nutritionData.allergens;
        if (!product.image_url && nutritionData.image_url) {
          enrichmentData.image_url = nutritionData.image_url;
        }
        sourcesUsed.push('Open Food Facts');
      }
    } catch (error) {
      console.error('Open Food Facts lookup failed:', error);
      stats.failed_lookups++;
    }
  }

  // Try to find product images if missing
  if (!product.image_url && !enrichmentData.image_url) {
    try {
      stats.external_lookups++;
      const imageUrl = await searchProductImage(product.name, product.brand);
      if (imageUrl) {
        enrichmentData.image_url = imageUrl;
        sourcesUsed.push('Image Search');
      }
    } catch (error) {
      console.error('Image search failed:', error);
      stats.failed_lookups++;
    }
  }

  // Record successful enrichments for learning
  if (sourcesUsed.length > 0) {
    enrichmentData.data_sources = sourcesUsed;
    
    // Record patterns for future use
    for (const source of sourcesUsed) {
      await supabase.rpc('record_ai_pattern_success', {
        pattern_type_param: 'external_enrichment',
        input_pattern_param: product.name.toLowerCase(),
        output_value_param: source,
        confidence_param: 0.8
      });
    }
  }

  return Object.keys(enrichmentData).length > 0 ? enrichmentData : null;
}

async function searchOpenFoodFacts(productName: string): Promise<any | null> {
  try {
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(productName)}&json=1&page_size=1`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      return {
        nutrition: product.nutriments,
        allergens: product.allergens ? product.allergens.split(',').map((a: string) => a.trim()) : [],
        image_url: product.image_url
      };
    }
  } catch (error) {
    console.error('Open Food Facts search error:', error);
  }
  return null;
}

async function searchProductImage(productName: string, brand?: string): Promise<string | null> {
  // This would integrate with image search APIs
  // For now, return placeholder logic
  try {
    const query = brand ? `${brand} ${productName}` : productName;
    // In a real implementation, this would call Google Images API, Unsplash, etc.
    return null; // Placeholder
  } catch (error) {
    console.error('Image search error:', error);
    return null;
  }
}

async function performQualityValidation(product: EnhancedProduct, supabase: any): Promise<{ score: number; confidence: any }> {
  let score = 0;
  const confidence: any = {};
  
  // Name quality (required, meaningful)
  if (product.name && product.name.length > 3) {
    score += 20;
    confidence.name = product.name.length > 10 ? 0.9 : 0.7;
  }
  
  // Price validity
  if (product.price && product.price > 0) {
    score += 20;
    confidence.price = 0.9;
  }
  
  // Category assignment
  if (product.category_id) {
    score += 15;
    confidence.category = 0.8;
  }
  
  // Unit specification
  if (product.unit) {
    score += 10;
    confidence.unit = 0.8;
  }
  
  // Description completeness
  if (product.description && product.description.length > 20) {
    score += 15;
    confidence.description = 0.7;
  }
  
  // Image availability
  if (product.image_url) {
    score += 10;
    confidence.image = 0.8;
  }
  
  // External data enrichment
  if (product.nutrition_info || product.allergens || product.data_sources) {
    score += 10;
    confidence.enrichment = 0.9;
  }
  
  return { score, confidence };
}

async function applyLearningPatterns(product: any, supabase: any): Promise<EnhancedProduct> {
  // Apply existing learning patterns for basic classification
  const productName = product.name || '';
  const suggestions: any = {};
  
  if (productName) {
    // Category suggestion
    const { data: categoryPattern } = await supabase.rpc('get_ai_pattern_suggestion', {
      pattern_type_param: 'category',
      input_pattern_param: productName.toLowerCase(),
      min_confidence: 0.7
    });
    
    if (categoryPattern?.[0]?.output_value) {
      suggestions.category_id = categoryPattern[0].output_value;
    }
    
    // Unit extraction
    const { data: unitPattern } = await supabase.rpc('get_ai_pattern_suggestion', {
      pattern_type_param: 'unit',
      input_pattern_param: productName.toLowerCase(),
      min_confidence: 0.7
    });
    
    if (unitPattern?.[0]?.output_value) {
      suggestions.unit = unitPattern[0].output_value;
    }
  }
  
  return { ...product, ...suggestions };
}

function calculateQualityMetrics(products: EnhancedProduct[]): any {
  const metrics = {
    average_quality_score: 0,
    completeness_rate: 0,
    enrichment_rate: 0,
    validation_failures: 0
  };
  
  if (products.length === 0) return metrics;
  
  const totalScore = products.reduce((sum, p) => sum + (p.quality_score || 0), 0);
  metrics.average_quality_score = totalScore / products.length;
  
  const completeProducts = products.filter(p => 
    p.name && p.price && p.category_id && p.unit && p.description
  ).length;
  metrics.completeness_rate = completeProducts / products.length;
  
  const enrichedProducts = products.filter(p => p.data_sources && p.data_sources.length > 0).length;
  metrics.enrichment_rate = enrichedProducts / products.length;
  
  metrics.validation_failures = products.filter(p => 
    p.confidence_scores?.error || (p.quality_score || 0) < 30
  ).length;
  
  return metrics;
}

async function logProcessingStep(params: {
  supabase: any;
  jobId: string;
  stage: string;
  patternType: string;
  inputData: any;
  outputData: any;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    await params.supabase
      .from('ai_processing_audit')
      .insert({
        import_job_id: params.jobId,
        processing_stage: params.stage,
        pattern_type: params.patternType,
        input_data: params.inputData,
        output_data: params.outputData,
        success: params.success,
        error_message: params.errorMessage,
        processing_time_ms: Date.now()
      });
  } catch (error) {
    console.error('Failed to log processing step:', error);
  }
}
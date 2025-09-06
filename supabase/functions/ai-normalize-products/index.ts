import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = "https://whxmjebukensinfduber.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeG1qZWJ1a2Vuc2luZmR1YmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzAyOTUsImV4cCI6MjA3MTc0NjI5NX0.YSXTuTpaNvBQxPVNiH8433vHwQ6HSz1xO68XAH-VK38";

interface ExcelRow {
  [key: string]: any;
}

interface NormalizedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  unit: string;
  origin?: string;
  image_url?: string;
  stock_quantity: number;
  status: 'suggested' | 'ready' | 'error';
  errors: string[];
  suggestions: string[];
  original_data: ExcelRow;
  confidence_score?: number;
  learned_patterns_applied?: string[];
  auto_fixes?: string[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface AILearningPattern {
  pattern_type: string;
  input_pattern: string;
  output_value: string;
  confidence_score: number;
}

const MAX_IMAGE_DIMENSION = 1024;

function slugify(input: string): string {
  return (input || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function isExternalUrl(u?: string): boolean {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function processAndUploadImage(
  supabase: any,
  userId: string,
  productName: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn('Failed to fetch image:', imageUrl, res.status);
      return null;
    }
    const arrayBuf = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);

    const img = await Image.decode(bytes);
    let w = img.width;
    let h = img.height;
    if (w > MAX_IMAGE_DIMENSION || h > MAX_IMAGE_DIMENSION) {
      if (w >= h) {
        h = Math.round((h * MAX_IMAGE_DIMENSION) / w);
        w = MAX_IMAGE_DIMENSION;
      } else {
        w = Math.round((w * MAX_IMAGE_DIMENSION) / h);
        h = MAX_IMAGE_DIMENSION;
      }
      img.resize(w, h);
    }

    const webp = await img.encodeWEBP(85);
    const filePath = `${userId}/${Date.now()}-${slugify(productName)}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, webp, { contentType: 'image/webp', upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      return null;
    }

    const { data: pub } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return pub?.publicUrl || null;
  } catch (e) {
    console.error('processAndUploadImage error:', e);
    return null;
  }
}

async function processProductImages(
  products: NormalizedProduct[],
  supabase: any,
  userId: string
): Promise<void> {
  for (const p of products) {
    if (p.image_url) {
      // Skip processing if image is already in our storage bucket
      if (p.image_url.includes('product-images')) {
        console.log(`Skipping already uploaded image for product: ${p.name}`);
        p.suggestions = [...(p.suggestions || []), 'Embedded image uploaded from Excel'];
        continue;
      }
      
      // Only process external URLs
      if (isExternalUrl(p.image_url)) {
        const uploadedUrl = await processAndUploadImage(supabase, userId, p.name, p.image_url);
        if (uploadedUrl) {
          p.image_url = uploadedUrl;
          p.suggestions = [...(p.suggestions || []), 'Image resized and uploaded to CDN'];
          p.auto_fixes = [...(p.auto_fixes || []), 'image_optimization'];
        } else {
          p.errors = [...(p.errors || []), 'Image processing/upload failed'];
          if (p.status !== 'error') p.status = 'suggested';
        }
      }
    }
  }
}

// Apply learning patterns to enhance product data
async function applyLearningPatterns(
  batch: any[],
  categories: any[],
  supabase: any
): Promise<any[]> {
  const enhanced = await Promise.all(batch.map(async (row) => {
    try {
      const productName = row.name || row.col_0 || '';
      if (!productName) return row;

      const learnedPatterns: string[] = [];

      // Get category suggestions
      const { data: categoryPattern } = await supabase.rpc('get_ai_pattern_suggestion', {
        pattern_type_param: 'category',
        input_pattern_param: productName.toLowerCase(),
        min_confidence: 0.7
      });

      // Get unit extraction patterns
      const { data: unitPattern } = await supabase.rpc('get_ai_pattern_suggestion', {
        pattern_type_param: 'unit',
        input_pattern_param: productName.toLowerCase(),
        min_confidence: 0.7
      });

      // Get price normalization patterns
      const priceValue = row.price || row.col_3 || row.col_2 || '';
      const { data: pricePattern } = await supabase.rpc('get_ai_pattern_suggestion', {
        pattern_type_param: 'price',
        input_pattern_param: priceValue.toString(),
        min_confidence: 0.7
      });

      // Get brand suggestions
      const brand = row.brand || row.col_1 || '';
      const { data: brandPattern } = await supabase.rpc('get_ai_pattern_suggestion', {
        pattern_type_param: 'brand',
        input_pattern_param: productName.toLowerCase(),
        min_confidence: 0.7
      });

      const suggestions: any = {};
      
      if (categoryPattern?.[0]?.output_value) {
        suggestions.category = categoryPattern[0].output_value;
        learnedPatterns.push('category_suggestion');
      }
      
      if (unitPattern?.[0]?.output_value) {
        suggestions.unit = unitPattern[0].output_value;
        learnedPatterns.push('unit_extraction');
      }
      
      if (pricePattern?.[0]?.output_value) {
        suggestions.price_format = pricePattern[0].output_value;
        learnedPatterns.push('price_normalization');
      }
      
      if (brandPattern?.[0]?.output_value) {
        suggestions.brand = brandPattern[0].output_value;
        learnedPatterns.push('brand_detection');
      }

      return {
        ...row,
        _ai_suggestions: suggestions,
        _learned_patterns: learnedPatterns,
        _confidence_scores: {
          category: categoryPattern?.[0]?.confidence_score || 0,
          unit: unitPattern?.[0]?.confidence_score || 0,
          price: pricePattern?.[0]?.confidence_score || 0,
          brand: brandPattern?.[0]?.confidence_score || 0
        }
      };
    } catch (error) {
      console.error('Error applying learning patterns:', error);
      return row;
    }
  }));

  return enhanced;
}

// Record successful AI processing patterns for learning
async function recordSuccessfulPatterns(
  product: NormalizedProduct,
  originalRow: any,
  supabase: any
): Promise<void> {
  try {
    const productName = originalRow.name || originalRow.col_0 || '';
    
    if (productName && product.category_id) {
      await supabase.rpc('record_ai_pattern_success', {
        pattern_type_param: 'category',
        input_pattern_param: productName.toLowerCase(),
        output_value_param: product.category_id,
        confidence_param: 0.85
      });
    }

    if (productName && product.unit) {
      await supabase.rpc('record_ai_pattern_success', {
        pattern_type_param: 'unit',
        input_pattern_param: productName.toLowerCase(),
        output_value_param: product.unit,
        confidence_param: 0.85
      });
    }

    if (product.price && (originalRow.price || originalRow.col_3 || originalRow.col_2)) {
      const originalPrice = originalRow.price || originalRow.col_3 || originalRow.col_2;
      await supabase.rpc('record_ai_pattern_success', {
        pattern_type_param: 'price',
        input_pattern_param: originalPrice.toString(),
        output_value_param: product.price.toString(),
        confidence_param: 0.85
      });
    }

    if (productName && product.origin) {
      await supabase.rpc('record_ai_pattern_success', {
        pattern_type_param: 'brand',
        input_pattern_param: productName.toLowerCase(),
        output_value_param: product.origin,
        confidence_param: 0.85
      });
    }

  } catch (error) {
    console.error('Error recording learning patterns:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client with user's auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { data: adminCheck, error: adminError } = await supabase
      .rpc('is_admin_or_sysadmin', { _user_id: user.id });

    if (adminError || !adminCheck) {
      throw new Error('Admin access required');
    }

    const { rows, filename, settings = {} } = await req.json();
    
    if (!rows || !Array.isArray(rows)) {
      throw new Error('Invalid input: rows must be an array');
    }

    console.log(`Processing ${rows.length} rows from file: ${filename || 'unnamed'}`);
    console.log('Settings:', JSON.stringify(settings, null, 2));

    // Fetch categories for mapping
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, icon')
      .eq('is_active', true);

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    // Sample existing products for duplicate detection
    const { data: existingProducts, error: productsError } = await supabase
      .from('products')
      .select('name')
      .eq('is_active', true)
      .limit(1000);

    if (productsError) {
      console.error('Warning: Could not fetch existing products:', productsError.message);
    }

    const existingProductNames = new Set(
      (existingProducts || []).map(p => p.name.toLowerCase().trim())
    );

    // Enhanced AI processing with learning
    let normalizedProducts = await processRowsWithAI(rows, categories, existingProductNames, settings, supabase);

    // Resize and upload images to storage, updating image_url to CDN URL
    await processProductImages(normalizedProducts, supabase, user.id);
    
    // Create import job
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        created_by: user.id,
        source_filename: filename || 'ai-import',
        original_headers: rows.length > 0 ? Object.keys(rows[0]) : [],
        column_mapping: settings, 
        settings: { ai_processing: true, enableLearning: settings.enableLearning },
        stats_total_rows: rows.length,
        stats_valid_rows: normalizedProducts.filter(p => p.status === 'ready').length,
        stats_error_rows: normalizedProducts.filter(p => p.status === 'error').length,
        status: 'processed'
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create import job: ${jobError.message}`);
    }

    // Create import items
    const importItems = normalizedProducts.map(product => ({
      job_id: importJob.id,
      origin: 'ai-processing',
      raw: product.original_data,
      normalized: {
        name: product.name,
        description: product.description,
        price: product.price,
        category_id: product.category_id,
        unit: product.unit,
        origin: product.origin,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity
      },
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.category_id,
      unit: product.unit,
      origin: product.origin,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity,
      errors: product.errors,
      status: product.status
    }));

    const { error: itemsError } = await supabase
      .from('import_items')
      .insert(importItems);

    if (itemsError) {
      throw new Error(`Failed to create import items: ${itemsError.message}`);
    }

    const summary = {
      total: normalizedProducts.length,
      ready: normalizedProducts.filter(p => p.status === 'ready').length,
      suggested: normalizedProducts.filter(p => p.status === 'suggested').length,
      errors: normalizedProducts.filter(p => p.status === 'error').length
    };

    const learningStats = {
      auto_fixes_applied: normalizedProducts.filter(p => p.auto_fixes?.length > 0).length,
      high_confidence_suggestions: normalizedProducts.filter(p => (p.confidence_score || 0) > 0.8).length,
      patterns_learned: normalizedProducts.reduce((acc, p) => acc + (p.learned_patterns_applied?.length || 0), 0)
    };

    console.log('Enhanced AI processing complete:', { summary, learningStats });

    return new Response(JSON.stringify({
      jobId: importJob.id,
      summary,
      learning_stats: learningStats,
      products: normalizedProducts
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-normalize-products:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced AI processing with learning capabilities
async function processRowsWithAI(
  rows: ExcelRow[], 
  categories: Category[], 
  existingProductNames: Set<string>,
  settings: any = {},
  supabase: any
): Promise<NormalizedProduct[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const results: NormalizedProduct[] = [];

  // Process in batches to avoid token limits
  const batchSize = 10;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const batchResults = await processBatchWithAI(batch, categories, existingProductNames, openaiApiKey, settings, supabase);
    results.push(...batchResults);
  }

  return results;
}

async function processBatchWithAI(
  batch: ExcelRow[], 
  categories: Category[], 
  existingProductNames: Set<string>,
  openaiApiKey: string,
  settings: any = {},
  supabase: any
): Promise<NormalizedProduct[]> {
  
  const exchangeRate = settings.exchangeRate || 500;
  const isAEFormat = settings.columnFormat === 'A-E';
  const enableLearning = settings.enableLearning || true;
  
  console.log(`Processing ${batch.length} rows with ${isAEFormat ? 'A-E' : 'auto-detect'} format, learning: ${enableLearning}`);
  
  let cleanedBatch = batch;
  
  if (isAEFormat) {
    // Handle pre-parsed A-E format from frontend
    cleanedBatch = batch.filter(row => {
      const keys = Object.keys(row);
      if (keys.length === 0) return false;
      
      const hasName = row[keys[0]] && String(row[keys[0]]).trim() !== '';
      const hasPrice = (row[keys[2]] && String(row[keys[2]]).match(/[\d.,]+/)) ||
                      (row[keys[3]] && String(row[keys[3]]).match(/[\d.,]+/));
      
      return hasName && hasPrice;
    });
  }
  
  // Apply learning patterns before AI processing
  const learnedProducts = enableLearning ? await applyLearningPatterns(cleanedBatch, categories, supabase) : cleanedBatch;
  
  const prompt = `You are an enhanced AI assistant specializing in product data normalization with learning capabilities.

Available categories:
${categories.map(c => `- ${c.id}: "${c.name}" (${c.icon})`).join('\n')}

DATA FORMAT: ${isAEFormat ? 'Column A-E format' : 'Auto-detected Excel format'}
${isAEFormat ? `
A-E COLUMN MAPPING:
- col_0 (A): Product Name
- col_1 (B): Brand
- col_2 (C): Costa Rica Colones Price (₡)
- col_3 (D): USD Price ($) - PREFERRED
- col_4 (E): Image URL

EXCHANGE RATE: ₡${exchangeRate} = $1.00
` : ''}

ENHANCED PROCESSING INSTRUCTIONS:
1. **Learning Integration**: Apply learned patterns from _ai_suggestions when available
2. **Auto-Fix Detection**: Automatically fix common issues and record in auto_fixes array
3. **Confidence Scoring**: Provide confidence_score (0-1) for each suggestion
4. **Quality Assurance**: Validate all auto-fixes before applying

3. **Price Intelligence**:
   - Prefer USD prices over CRC prices
   - Auto-detect currency patterns
   - Flag suspicious price anomalies
   
4. **Category Intelligence**:
   - Use learned patterns from previous categorizations
   - Apply brand-based category suggestions
   - Implement fuzzy matching for similar products

5. **Smart Fixes**:
   - Auto-extract units from product names (115g, 1L, 500ml, etc.)
   - Generate enhanced descriptions combining brand + name + size
   - Normalize product names for consistency

Return JSON array with enhanced structure:
{
  "id": "temp-id-X",
  "name": "Clean Product Name",
  "description": "Enhanced Brand Product Name (size)",
  "price": 9.99,
  "category_id": "best_matching_category_id",
  "unit": "g|ml|L|each",
  "origin": "Brand Name",
  "image_url": "url_if_available",
  "stock_quantity": 10,
  "status": "ready|suggested|error",
  "errors": ["specific error messages"],
  "suggestions": ["AI assumptions made"],
  "confidence_score": 0.95,
  "learned_patterns_applied": ["category_suggestion", "unit_extraction"],
  "auto_fixes": ["price_normalization", "unit_extraction"],
  "original_data": {}
}

Process these ${cleanedBatch.length} products with learned patterns:
${JSON.stringify(learnedProducts.slice(0, 20), null, 2)}${cleanedBatch.length > 20 ? '\n... (truncated for prompt length)' : ''}`;

  try {
    console.log(`Processing batch of ${cleanedBatch.length} cleaned rows with learning patterns`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are an enhanced product data specialist with learning capabilities. Apply learned patterns, provide confidence scores, and perform intelligent auto-fixes. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const normalizedProducts: NormalizedProduct[] = JSON.parse(jsonMatch[0]);
    
    // Post-process and store learning patterns
    const processedProducts = await Promise.all(normalizedProducts.map(async (product, index) => {
      const originalRow = batch[index] || {};
      
      // Check for duplicates
      if (existingProductNames.has(product.name.toLowerCase().trim())) {
        product.errors.push('Product name already exists');
        product.status = 'error';
      }

      // Validate required fields
      if (!product.name || !product.price || !product.category_id || !product.unit) {
        product.errors.push('Missing required fields');
        product.status = 'error';
      }

      // Validate category exists
      if (product.category_id && !categories.find(c => c.id === product.category_id)) {
        product.errors.push('Invalid category_id');
        product.status = 'error';
      }

      // Record successful learning patterns if enabled
      if (enableLearning && product.status !== 'error') {
        await recordSuccessfulPatterns(product, originalRow, supabase);
      }

      return {
        ...product,
        original_data: originalRow,
        id: `ai-${Date.now()}-${index}`,
        confidence_score: product.confidence_score || 0.8
      };
    }));

    return processedProducts;

  } catch (error) {
    console.error('AI processing error:', error);
    
    // Enhanced fallback with basic learning
    return cleanedBatch.map((row, index) => {
      const originalRow = batch[index] || {};
      let name = 'Unknown Product';
      let price = 0;
      let brand = '';
      let imageUrl = '';
      
      if (isAEFormat) {
        name = String(row.col_0 || '').trim();
        brand = String(row.col_1 || '').trim();
        
        // Try USD first, then CRC
        const usdPrice = String(row.col_3 || '');
        const crcPrice = String(row.col_2 || '');
        
        if (usdPrice && usdPrice.match(/[\d.,]+/)) {
          price = parseFloat(usdPrice.replace(/[^0-9.-]/g, ''));
        } else if (crcPrice && crcPrice.match(/[\d.,]+/)) {
          const crcValue = parseFloat(crcPrice.replace(/[^0-9.-]/g, ''));
          price = Math.round((crcValue / exchangeRate) * 100) / 100;
        }
        
        imageUrl = String(row.col_4 || '').trim();
      }
      
      return {
        id: `fallback-${Date.now()}-${index}`,
        name: name || 'Unknown Product',
        description: brand ? `${brand} ${name}` : name,
        price: price || 0,
        category_id: categories[0]?.id || 'other',
        unit: 'each',
        origin: brand,
        image_url: imageUrl,
        stock_quantity: 10,
        status: 'suggested' as const,
        errors: ['AI processing failed, using fallback'],
        suggestions: ['Manual review recommended'],
        confidence_score: 0.3,
        learned_patterns_applied: [],
        auto_fixes: [],
        original_data: originalRow
      };
    });
  }
}
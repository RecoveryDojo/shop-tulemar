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
}

interface Category {
  id: string;
  name: string;
  icon: string;
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
    if (p.image_url && isExternalUrl(p.image_url)) {
      const uploadedUrl = await processAndUploadImage(supabase, userId, p.name, p.image_url);
      if (uploadedUrl) {
        p.image_url = uploadedUrl;
        p.suggestions = [...(p.suggestions || []), 'Image resized and uploaded to CDN'];
      } else {
        p.errors = [...(p.errors || []), 'Image processing/upload failed'];
        if (p.status !== 'error') p.status = 'suggested';
      }
    }
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

    const { rows, filename } = await req.json();
    
    if (!rows || !Array.isArray(rows)) {
      throw new Error('Invalid input: rows must be an array');
    }

    console.log(`Processing ${rows.length} rows from file: ${filename || 'unnamed'}`);

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

// Process rows with AI assistance
let normalizedProducts = await processRowsWithAI(rows, categories, existingProductNames);

// Resize and upload images to storage, updating image_url to CDN URL
await processProductImages(normalizedProducts, supabase, user.id);
    // Create import job
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        created_by: user.id,
        source_filename: filename || 'ai-import',
        original_headers: rows.length > 0 ? Object.keys(rows[0]) : [],
        column_mapping: {}, // Will be populated by AI processing
        settings: { ai_processing: true },
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

    console.log('AI processing complete:', summary);

    return new Response(JSON.stringify({
      jobId: importJob.id,
      summary,
      items: normalizedProducts
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

async function processRowsWithAI(
  rows: ExcelRow[], 
  categories: Category[], 
  existingProductNames: Set<string>
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
    const batchResults = await processBatchWithAI(batch, categories, existingProductNames, openaiApiKey);
    results.push(...batchResults);
  }

  return results;
}

async function processBatchWithAI(
  batch: ExcelRow[], 
  categories: Category[], 
  existingProductNames: Set<string>,
  openaiApiKey: string
): Promise<NormalizedProduct[]> {
  
  const prompt = `You are an AI assistant helping to normalize and clean product data from messy Excel imports. 

Available categories:
${categories.map(c => `- ${c.id}: "${c.name}" (${c.icon})`).join('\n')}

INSTRUCTIONS:
1. Map messy column headers to standard fields: name, description, price, category_id, unit, origin, image_url, stock_quantity
2. Clean and normalize the data:
   - Standardize units (e.g., "lb", "lbs", "pound" → "lb")
   - Fix price formatting (remove $, commas)
   - Match products to appropriate category_id based on name/description
   - Generate descriptions if missing
   - Set reasonable stock_quantity if missing (default: 10)
3. Mark status as:
   - "ready": Complete, valid data
   - "suggested": Needs review (guessed category, generated description, etc.)
   - "error": Missing critical data or invalid

Common column mappings:
- "cost", "msrp", "$ price", "retail" → price
- "qty", "inventory", "stock" → stock_quantity  
- "type", "dept", "section" → category_id
- "size", "measurement" → unit

Return JSON array with this exact structure for each product:
{
  "id": "temp-id-1",
  "name": "cleaned name",
  "description": "description or generated one",
  "price": 9.99,
  "category_id": "matching category id",
  "unit": "normalized unit",
  "origin": "origin if available",
  "image_url": "url if available", 
  "stock_quantity": 10,
  "status": "ready|suggested|error",
  "errors": ["list of specific errors"],
  "suggestions": ["list of AI suggestions made"],
  "original_data": {}
}

Process these products:
${JSON.stringify(batch, null, 2)}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a data normalization expert. Always return valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0].message.content;
    
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const normalizedProducts: NormalizedProduct[] = JSON.parse(jsonMatch[0]);
    
    // Post-process results
    return normalizedProducts.map((product, index) => {
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

      return {
        ...product,
        original_data: originalRow,
        id: `ai-${Date.now()}-${index}`
      };
    });

  } catch (error) {
    console.error('AI processing error:', error);
    
    // Fallback: basic processing without AI
    return batch.map((row, index) => ({
      id: `fallback-${Date.now()}-${index}`,
      name: row.name || row.product || row.title || 'Unknown Product',
      description: row.description || row.desc || '',
      price: parseFloat(String(row.price || row.cost || row.msrp || '0').replace(/[^0-9.]/g, '')) || 0,
      category_id: categories[0]?.id || '',
      unit: row.unit || row.size || 'each',
      origin: row.origin || '',
      image_url: row.image_url || row.image || '',
      stock_quantity: parseInt(String(row.stock_quantity || row.qty || row.inventory || '10')) || 10,
      status: 'error' as const,
      errors: ['AI processing failed - manual review required'],
      suggestions: [],
      original_data: row
    }));
  }
}
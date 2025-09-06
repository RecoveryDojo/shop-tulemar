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

    const { rows, filename, settings = {} } = await req.json();
    
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
    let normalizedProducts = await processRowsWithAI(rows, categories, existingProductNames, settings);

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
  existingProductNames: Set<string>,
  settings: any = {}
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
    const batchResults = await processBatchWithAI(batch, categories, existingProductNames, openaiApiKey, settings);
    results.push(...batchResults);
  }

  return results;
}

async function processBatchWithAI(
  batch: ExcelRow[], 
  categories: Category[], 
  existingProductNames: Set<string>,
  openaiApiKey: string,
  settings: any = {}
): Promise<NormalizedProduct[]> {
  
  const exchangeRate = settings.exchangeRate || 500;
  const isAEFormat = settings.columnFormat === 'A-E';
  
  console.log(`Processing ${batch.length} rows with ${isAEFormat ? 'A-E' : 'auto-detect'} format, exchange rate: ${exchangeRate}`);
  
  let cleanedBatch = batch;
  
  if (isAEFormat) {
    // Handle pre-parsed A-E format from frontend
    cleanedBatch = batch.filter(row => {
      const values = Object.values(row);
      return values.some(v => v !== undefined && v !== null && String(v).trim() !== '');
    });
  } else {
    // Legacy auto-detection logic
    const firstRow = batch[0] || {};
    const hasExcelColumnNames = Object.keys(firstRow).some(k => k.startsWith('__EMPTY'));
    
    if (hasExcelColumnNames) {
      cleanedBatch = batch.filter(row => {
        const values = Object.values(row).filter(v => v !== undefined && v !== null && v !== '');
        if (values.length <= 1) return false;
        
        const hasPrice = Object.values(row).some(value => 
          value && String(value).match(/[\$₡\d]/));
        
        return hasPrice;
      });
    }
  }
  
  const prompt = `You are an AI assistant specializing in normalizing product data from Excel imports.

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

PROCESSING INSTRUCTIONS:
1. **Price Parsing** (CRITICAL):
   ${isAEFormat ? `
   - Check col_3 (USD) first - if it has a valid $ amount, use it
   - If no USD price, convert col_2 (CRC): ₡${exchangeRate} = $1.00
   - Examples: "₡1,500" = $${(1500/exchangeRate).toFixed(2)}, "$3.00" = $3.00
   ` : `
   - Prefer USD prices over CRC prices
   - Convert CRC to USD using rate ₡${exchangeRate} = $1.00
   `}

2. **Data Extraction**:
   - Extract product name from ${isAEFormat ? 'col_0' : 'name/item columns'}
   - Use brand from ${isAEFormat ? 'col_1' : 'brand columns'} for origin and description enhancement
   - Extract unit from name (115g, 1L, 500ml, etc.) 
   - Use image URL from ${isAEFormat ? 'col_4' : 'image columns'} if provided

3. **Category Matching**:
   - Intelligently match products to categories based on name
   - Common mappings: milk/cheese → dairy, bread/tortilla → bakery, coffee → beverages
   - If uncertain, choose closest match and mark as "suggested"

4. **Status Assignment**:
   - "ready": Valid name, price, category, unit extracted
   - "suggested": AI made assumptions (category guessed, description generated, etc.)
   - "error": Missing name or price, invalid data

5. **Data Quality**:
   - Generate meaningful descriptions combining brand + name + size
   - Set stock_quantity to 10 (default)
   - Include specific suggestions for review

Return JSON array with this structure:
{
  "id": "temp-id-X",
  "name": "Clean Product Name",
  "description": "Brand Product Name (size if available)",
  "price": 9.99,
  "category_id": "best_matching_category_id",
  "unit": "g|ml|L|each",
  "origin": "Brand Name",
  "image_url": "url_if_available",
  "stock_quantity": 10,
  "status": "ready|suggested|error",
  "errors": ["specific error messages"],
  "suggestions": ["AI assumptions made"],
  "original_data": {}
}

Process these ${cleanedBatch.length} products:
${JSON.stringify(cleanedBatch.slice(0, 20), null, 2)}${cleanedBatch.length > 20 ? '\n... (truncated for prompt length)' : ''}`;

  try {
    console.log(`Processing batch of ${cleanedBatch.length} cleaned rows (from ${batch.length} original)`);
    console.log('Header mapping:', headerMapping);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a product data specialist. Parse Excel data into valid JSON format. Prioritize USD prices, accurate categorization, and data quality. Return only valid JSON arrays.' },
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
    
    // Enhanced fallback: deterministic processing for A-E format
    return cleanedBatch.map((row, index) => {
      let name = 'Unknown Product';
      let price = 0;
      let brand = '';
      let imageUrl = '';
      
      if (isAEFormat) {
        // A-E format: col_0=name, col_1=brand, col_2=CRC, col_3=USD, col_4=image
        name = String(row.col_0 || '').trim();
        brand = String(row.col_1 || '').trim();
        
        // Prefer USD (col_3) over CRC (col_2)
        const usdValue = String(row.col_3 || '').trim();
        const crcValue = String(row.col_2 || '').trim();
        
        if (usdValue && usdValue.match(/[\d.,]/)) {
          price = parseFloat(usdValue.replace(/[^0-9.]/g, '')) || 0;
        } else if (crcValue && crcValue.match(/[\d.,]/)) {
          const crcAmount = parseFloat(crcValue.replace(/[^0-9.]/g, '')) || 0;
          price = Math.round((crcAmount / exchangeRate) * 100) / 100;
        }
        
        imageUrl = String(row.col_4 || '').trim();
      } else {
        // Legacy format processing
        Object.entries(row).forEach(([key, value]) => {
          if (key.includes('name') || key.includes('item')) {
            name = String(value || '').trim();
          } else if ((key.includes('price') || key.includes('cost')) && value) {
            const strValue = String(value);
            if (strValue.includes('$')) {
              price = parseFloat(strValue.replace(/[^0-9.]/g, '')) || 0;
            } else {
              const colonesPrice = parseFloat(strValue.replace(/[^0-9.]/g, '')) || 0;
              price = Math.round((colonesPrice / exchangeRate) * 100) / 100;
            }
          } else if (key.includes('brand')) {
            brand = String(value || '').trim();
          }
        });
      }
      
      // Extract unit from name
      let unit = 'each';
      const unitMatch = name.match(/(\d+)\s*(g|kg|ml|l|oz|lb)\b/i);
      if (unitMatch) {
        unit = unitMatch[2].toLowerCase();
      }
      
      // Simple category assignment (fallback)
      let categoryId = categories[0]?.id || '';
      const nameLower = name.toLowerCase();
      for (const category of categories) {
        if (nameLower.includes('milk') || nameLower.includes('cheese')) {
          if (category.name.toLowerCase().includes('dairy')) {
            categoryId = category.id;
            break;
          }
        } else if (nameLower.includes('bread') || nameLower.includes('tortilla')) {
          if (category.name.toLowerCase().includes('bakery') || category.name.toLowerCase().includes('bread')) {
            categoryId = category.id;
            break;
          }
        }
      }
      
      return {
        id: `fallback-${Date.now()}-${index}`,
        name,
        description: brand ? `${brand} ${name}` : name,
        price,
        category_id: categoryId,
        unit,
        origin: brand,
        image_url: imageUrl,
        stock_quantity: 10,
        status: (name === 'Unknown Product' || price === 0) ? 'error' : 'suggested',
        errors: name === 'Unknown Product' || price === 0 ? ['Fallback processing - missing data'] : [],
        suggestions: ['Processed without AI - please review'],
        original_data: row
      };
    });
  }
}
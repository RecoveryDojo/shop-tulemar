import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    const { delete_categories = false, prefix = "bulk-upload/" } = (await req.json().catch(() => ({ delete_categories: false, prefix: "bulk-upload/" }))) as {
      delete_categories?: boolean;
      prefix?: string;
    };

    // Deactivate all active products (safer than hard delete to preserve references)
    const { count: activeProductsCount, error: countProductsError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countProductsError) throw new Error(`Count products error: ${countProductsError.message}`);

    const { error: deactivateProductsError } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('is_active', true);

    if (deactivateProductsError) throw new Error(`Deactivate products error: ${deactivateProductsError.message}`);

    // Optionally deactivate categories
    let categoriesUpdated = 0;
    if (delete_categories) {
      const { count: activeCategoriesCount, error: countCategoriesError } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countCategoriesError) throw new Error(`Count categories error: ${countCategoriesError.message}`);

      categoriesUpdated = activeCategoriesCount ?? 0;

      const { error: deactivateCategoriesError } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('is_active', true);

      if (deactivateCategoriesError) throw new Error(`Deactivate categories error: ${deactivateCategoriesError.message}`);
    }

    // Cleanup bulk-upload images in storage
    const bucket = 'product-images';
    const normalizedPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '');

    const batchSize = 1000;
    let offset = 0;
    let allPaths: string[] = [];

    while (true) {
      const { data: items, error: listError } = await supabase.storage
        .from(bucket)
        .list(normalizedPrefix, { limit: batchSize, offset });

      if (listError) throw new Error(`List error: ${listError.message}`);

      const paths = (items || []).map((it) => `${normalizedPrefix}/${it.name}`);
      allPaths = allPaths.concat(paths);

      if (!items || items.length < batchSize) break;
      offset += batchSize;
    }

    let imagesDeleted = 0;
    if (allPaths.length > 0) {
      const { data: removed, error: removeError } = await supabase.storage
        .from(bucket)
        .remove(allPaths);

      if (removeError) throw new Error(`Remove error: ${removeError.message}`);

      imagesDeleted = (removed || []).filter((r: any) => !r.error).length;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        productsUpdated: activeProductsCount ?? 0,
        categoriesUpdated,
        imagesDeleted,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    console.error('reset-product-catalog error', e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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

    const { prefix = "bulk-upload/" } = (await req.json().catch(() => ({ prefix: "bulk-upload/" }))) as {
      prefix?: string;
    };

    const bucket = "product-images";
    const normalizedPrefix = prefix.replace(/^\/+/, "").replace(/\/+$/, "");

    const batchSize = 1000;
    let offset = 0;
    let allPaths: string[] = [];

    while (true) {
      const { data: items, error: listError } = await supabase.storage
        .from(bucket)
        .list(normalizedPrefix, { limit: batchSize, offset });

      if (listError) {
        throw new Error(`List error: ${listError.message}`);
      }

      const paths = (items || []).map((it) => `${normalizedPrefix}/${it.name}`);
      allPaths = allPaths.concat(paths);

      if (!items || items.length < batchSize) break;
      offset += batchSize;
    }

    let deletedCount = 0;
    let errors: any[] = [];

    if (allPaths.length > 0) {
      const { data: removed, error: removeError } = await supabase.storage
        .from(bucket)
        .remove(allPaths);

      if (removeError) {
        throw new Error(`Remove error: ${removeError.message}`);
      }

      // removed is an array of objects with path and error if any
      deletedCount = (removed || []).filter((r: any) => !r.error).length;
      errors = (removed || []).filter((r: any) => r.error);
    }

    return new Response(
      JSON.stringify({ ok: true, prefix: normalizedPrefix, deletedCount, errorsCount: errors.length }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    console.error("cleanup-bulk-images error", e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
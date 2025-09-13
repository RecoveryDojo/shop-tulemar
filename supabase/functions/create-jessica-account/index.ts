import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating Jessica's account manually...");

    // Create Supabase admin client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if user already exists
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const userExists = existingUsers.users.some(u => u.email === 'babeslovesdaisies@gmail.com');
    
    if (userExists) {
      console.log("User already exists");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "User already exists",
          alreadyExists: true
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create user account
    const { data: newUser, error: userError } = await supabaseClient.auth.admin.createUser({
      email: 'babeslovesdaisies@gmail.com',
      password: 'TempPass123!', // Jessica will need to reset this
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        display_name: 'Jessica Wallsinger',
        created_via: 'admin_recovery'
      }
    });

    if (userError) {
      console.error("Failed to create user:", userError);
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    console.log("User created:", newUser.user?.id);

    // Check if profile was automatically created by triggers
    const { data: existingProfile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", newUser.user!.id)
      .single();

    if (!existingProfile) {
      // Create profile only if it doesn't exist
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .insert({
          id: newUser.user!.id,
          display_name: 'Jessica Wallsinger',
          email: 'babeslovesdaisies@gmail.com',
          phone: '2146749070',
          preferences: { 
            created_via: 'admin_recovery',
            original_order_id: '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7'
          }
        });

      if (profileError) {
        console.error("Failed to create profile:", profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }
    } else {
      console.log("Profile already exists (created by trigger)");
      
      // Update the existing profile with Jessica's details
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({
          display_name: 'Jessica Wallsinger',
          phone: '2146749070',
          preferences: { 
            ...existingProfile.preferences,
            created_via: 'admin_recovery',
            original_order_id: '93eb1bcd-3f0f-46c8-bd1d-25ffcd5eeca7'
          }
        })
        .eq("id", newUser.user!.id);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
        // Don't throw error, this is not critical
      }
    }

    // Check if role was automatically assigned by triggers
    const { data: existingRoles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", newUser.user!.id);

    if (!existingRoles || existingRoles.length === 0) {
      // Assign client role only if no roles exist
      const { error: roleError } = await supabaseClient
        .from("user_roles")
        .insert({
          user_id: newUser.user!.id,
          role: 'client'
        });

      if (roleError) {
        console.error("Failed to assign role:", roleError);
        throw new Error(`Failed to assign role: ${roleError.message}`);
      }
    } else {
      console.log("Role already assigned (created by trigger)");
    }

    console.log("Jessica's account created successfully!");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Jessica's account created successfully",
        userId: newUser.user!.id,
        email: 'babeslovesdaisies@gmail.com',
        tempPassword: 'TempPass123!'
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Account creation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Account creation failed" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
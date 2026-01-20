import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with the user's token for auth verification
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user token to verify the user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role for deletion
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const userId = user.id;

    // 1. Delete user's avatar from storage if exists
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", userId)
      .single();

    if (profile?.avatar_url) {
      const path = profile.avatar_url.split("/").slice(-2).join("/");
      await supabaseAdmin.storage.from("avatars").remove([path]);
    }

    // 2. Get all groups owned by the user
    const { data: groups } = await supabaseAdmin
      .from("groups")
      .select("id")
      .eq("user_id", userId);

    if (groups && groups.length > 0) {
      const groupIds = groups.map(g => g.id);

      // 3. Delete related data for all user's groups
      // Order matters due to foreign key constraints
      
      // Delete payments
      await supabaseAdmin
        .from("payments")
        .delete()
        .in("group_id", groupIds);

      // Delete recurring items
      await supabaseAdmin
        .from("recurring_items")
        .delete()
        .in("group_id", groupIds);

      // Delete expenses
      await supabaseAdmin
        .from("expenses")
        .delete()
        .in("group_id", groupIds);

      // Get all participant IDs for pix_keys deletion
      const { data: participants } = await supabaseAdmin
        .from("participants")
        .select("id")
        .in("group_id", groupIds);

      if (participants && participants.length > 0) {
        const participantIds = participants.map(p => p.id);
        
        // Delete pix keys
        await supabaseAdmin
          .from("pix_keys")
          .delete()
          .in("participant_id", participantIds);
      }

      // Delete participants
      await supabaseAdmin
        .from("participants")
        .delete()
        .in("group_id", groupIds);

      // Delete groups
      await supabaseAdmin
        .from("groups")
        .delete()
        .eq("user_id", userId);
    }

    // 4. Delete profile
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    // 5. Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in delete-account function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

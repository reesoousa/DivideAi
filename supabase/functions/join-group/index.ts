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
    const { invite_code } = await req.json();

    if (!invite_code) {
      return new Response(
        JSON.stringify({ error: "Invite code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find the invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from("group_invites")
      .select("*, groups(id, name)")
      .eq("invite_code", invite_code)
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invite link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invite is active
    if (!invite.is_active) {
      return new Response(
        JSON.stringify({ error: "This invite link has been deactivated" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invite has expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This invite link has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if max uses reached
    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      return new Response(
        JSON.stringify({ error: "This invite link has reached its maximum number of uses" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is already a member or owner
    const { data: existingMember } = await supabaseAdmin
      .from("group_members")
      .select("id")
      .eq("group_id", invite.group_id)
      .eq("user_id", user.id)
      .single();

    const { data: groupOwner } = await supabaseAdmin
      .from("groups")
      .select("user_id")
      .eq("id", invite.group_id)
      .single();

    if (existingMember || (groupOwner && groupOwner.user_id === user.id)) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "You are already a member of this group",
          group_id: invite.group_id,
          group_name: invite.groups?.name,
          already_member: true
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for display name and avatar
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, avatar_url, avatar_color")
      .eq("user_id", user.id)
      .single();

    // Determine participant name - use profile display name, email, or fallback
    const participantName = profile?.display_name || user.email?.split('@')[0] || 'Novo Membro';
    
    // Add user as member in group_members table
    const { error: memberError } = await supabaseAdmin
      .from("group_members")
      .insert({
        group_id: invite.group_id,
        user_id: user.id,
        role: "member",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return new Response(
        JSON.stringify({ error: "Failed to join group" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also add as participant in participants table (unified participant)
    const { error: participantError } = await supabaseAdmin
      .from("participants")
      .insert({
        group_id: invite.group_id,
        user_id: user.id,
        name: participantName,
        avatar_type: profile?.avatar_url ? "image" : "color",
        avatar_image: profile?.avatar_url || null,
        avatar_color: profile?.avatar_color || "#64B5F6",
        participation_percentage: 100,
      });

    if (participantError) {
      console.error("Error adding participant:", participantError);
      // Don't fail the whole operation, member was already added
    }

    // Increment use count
    await supabaseAdmin
      .from("group_invites")
      .update({ use_count: invite.use_count + 1 })
      .eq("id", invite.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Successfully joined the group",
        group_id: invite.group_id,
        group_name: invite.groups?.name,
        already_member: false
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in join-group function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
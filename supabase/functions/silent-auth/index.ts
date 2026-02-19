import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate a random password the user never needs to know
    const password = crypto.randomUUID() + crypto.randomUUID();

    // Try to create user; if they already exist, just return success
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so no verification email is sent
      user_metadata: { display_name: name || "" },
    });

    if (createError) {
      // User already exists — that's fine, sign them in
      if (createError.message?.includes("already been registered") || createError.status === 422) {
        // Generate a magic link token for existing user
        const { data: otpData, error: otpError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
        });

        if (otpError || !otpData) {
          console.error("Magic link generation failed:", otpError);
          return new Response(
            JSON.stringify({ exists: true, message: "Account exists" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Use the OTP token to sign them in
        return new Response(
          JSON.stringify({
            exists: true,
            token_hash: otpData.properties?.hashed_token,
            email,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.error("Create user error:", createError);
      throw createError;
    }

    // New user created — sign them in server-side and return session
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      console.error("Server-side sign-in failed:", signInError);
      return new Response(
        JSON.stringify({ exists: false, user_id: newUser.user?.id, email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        exists: false,
        user_id: newUser.user?.id,
        email,
        session: signInData.session,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("silent-auth error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

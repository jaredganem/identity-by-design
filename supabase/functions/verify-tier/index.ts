import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, session_id } = await req.json();

    if (!email && !session_id) {
      return new Response(
        JSON.stringify({ error: "email or session_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up lead by email first, fallback to session_id
    let query = supabase
      .from("leads")
      .select("promo_tier, is_founding_member, created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (email) {
      query = query.eq("email", email);
    } else {
      // No direct session_id on leads, return no tier
      return new Response(
        JSON.stringify({ tier: "free", is_founding_member: false, source: "default" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("DB error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to verify tier" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ tier: "free", is_founding_member: false, source: "not_found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map promo_tier to feature tier
    const PROMO_TIER_MAP: Record<string, string> = {
      vip: "elite",
      founders_vip: "elite",
      vip_all: "elite",
      vip_mid: "pro",
      vip_basic: "free",
      "3mo_free": "free",
      "6mo_free": "free",
    };

    const featureTier = data.promo_tier
      ? PROMO_TIER_MAP[data.promo_tier] || "free"
      : "free";

    return new Response(
      JSON.stringify({
        tier: featureTier,
        is_founding_member: data.is_founding_member,
        promo_tier: data.promo_tier,
        source: "database",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

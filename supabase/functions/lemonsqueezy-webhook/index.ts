import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature",
};

// Variant ID → tier mapping
const VARIANT_TIER_MAP: Record<string, string> = {
  "1319026": "tier1", // Pro $27
  "1319029": "tier2", // Elite $97
};

async function verifySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hex = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-signature");
    const secret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");

    if (!signature || !secret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const valid = await verifySignature(body, signature, secret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    const eventName = event?.meta?.event_name;
    const attrs = event?.data?.attributes;
    const email = attrs?.user_email;
    const orderId = String(event?.data?.id ?? "");
    const productName = attrs?.first_order_item?.product_name ?? null;

    // Extract variant ID from the order
    const variantId = String(
      attrs?.first_order_item?.variant_id ??
      event?.meta?.custom_data?.variant_id ??
      ""
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (eventName === "order_created") {
      if (!email) {
        return new Response(JSON.stringify({ error: "No email in order" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try custom_data user_id first, then look up by email
      let userId = event?.meta?.custom_data?.user_id;

      if (!userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", email)
          .maybeSingle();

        if (!profile) {
          console.error(`No user found for email: ${email}`);
          return new Response(
            JSON.stringify({ error: "User not found", email }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userId = profile.user_id;
      }

      // Determine tier from variant ID
      const newTier = VARIANT_TIER_MAP[variantId] || "tier1";

      // Update user_tiers
      const { error: tierError } = await supabase
        .from("user_tiers")
        .update({
          tier: newTier,
          purchase_date: new Date().toISOString(),
          payment_reference: `ls_${orderId}`,
        })
        .eq("user_id", userId);

      if (tierError) {
        console.error("Tier update error:", tierError);
        // Try upsert if row doesn't exist yet
        const { error: upsertError } = await supabase
          .from("user_tiers")
          .upsert({
            user_id: userId,
            tier: newTier,
            purchase_date: new Date().toISOString(),
            payment_reference: `ls_${orderId}`,
          }, { onConflict: "user_id" });

        if (upsertError) {
          console.error("Tier upsert error:", upsertError);
        }
      }

      // Also insert into purchases for record
      const { error: insertError } = await supabase.from("purchases").insert({
        user_id: userId,
        provider: "lemonsqueezy",
        provider_order_id: orderId,
        product_name: productName,
        status: "active",
      });

      if (insertError) {
        console.error("Purchase insert error:", insertError);
      }

      console.log(`Upgraded user ${userId} to ${newTier} (variant ${variantId})`);

      return new Response(JSON.stringify({ ok: true, tier: newTier }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (eventName === "order_refunded") {
      if (!email) {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find user by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      if (profile) {
        // Revert to free tier
        await supabase
          .from("user_tiers")
          .update({ tier: "free", payment_reference: `refund_ls_${orderId}` })
          .eq("user_id", profile.user_id);

        // Update purchase status
        await supabase
          .from("purchases")
          .update({ status: "refunded" })
          .eq("provider_order_id", orderId);

        console.log(`Reverted user ${profile.user_id} to free (refund)`);
      }

      return new Response(JSON.stringify({ ok: true, refunded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Other events — acknowledge
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

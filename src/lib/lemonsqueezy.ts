/**
 * Lemon Squeezy Checkout Utilities
 * ─────────────────────────────────
 * Generates checkout URLs for Pro ($27) and Elite ($97) one-time purchases.
 */

import { supabase } from "@/integrations/supabase/client";

const STORE_SLUG = "selfmasteryformen";

// Live variant IDs
const LIVE_VARIANTS: Record<string, string> = {
  tier1: "1319026",
  tier2: "1319029",
};

// Test variant IDs (same for now — replace with test variants when available)
const TEST_VARIANTS: Record<string, string> = {
  tier1: "1319026",
  tier2: "1319029",
};

function isTestMode(): boolean {
  try {
    return import.meta.env.VITE_LEMON_SQUEEZY_TEST_MODE === "true";
  } catch {
    return false;
  }
}

function getVariantId(tier: "tier1" | "tier2"): string {
  const variants = isTestMode() ? TEST_VARIANTS : LIVE_VARIANTS;
  return variants[tier];
}

/**
 * Build a Lemon Squeezy checkout URL for a given tier.
 */
export async function getCheckoutUrl(
  tier: "tier1" | "tier2",
  userEmail: string
): Promise<string> {
  const variantId = getVariantId(tier);

  // Get user ID for custom data
  let userId = "";
  try {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? "";
  } catch {}

  const params = new URLSearchParams({
    "checkout[email]": userEmail,
    "checkout[custom][user_id]": userId,
    "checkout[custom][variant_id]": variantId,
  });

  return `https://${STORE_SLUG}.lemonsqueezy.com/checkout/buy/${variantId}?${params.toString()}`;
}

/**
 * Open the checkout in a new tab.
 */
/**
 * Payments are temporarily disabled while the store is being reviewed.
 * Set to `false` once the LemonSqueezy store is activated.
 */
export const PAYMENTS_DISABLED = true;

export async function redirectToCheckout(
  tier: "tier1" | "tier2",
  userEmail: string
): Promise<void> {
  if (PAYMENTS_DISABLED) {
    // Silently no-op while store is in review
    return;
  }
  const url = await getCheckoutUrl(tier, userEmail);
  window.open(url, "_blank", "noopener,noreferrer");
}

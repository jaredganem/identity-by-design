/**
 * Tier Access System
 * ──────────────────
 * Infrastructure for tiered feature gating.
 * NOT enforced yet — helpers are ready to flip on.
 *
 * Tiers:
 *   "free"  → Record & experience one session. No save/replay.
 *   "tier1" → $27 — Full guided + freestyle recording, unlimited saves, library.
 *   "tier2" → $97 — Everything in tier1 + AI features, track building, mixing, future updates.
 */

import { supabase } from "@/integrations/supabase/client";

export type UserTier = "free" | "tier1" | "tier2";

export interface TierInfo {
  tier: UserTier;
  purchaseDate: string | null;
  paymentReference: string | null;
}

const TIER_RANK: Record<UserTier, number> = { free: 0, tier1: 1, tier2: 2 };

// ─── Core check ──────────────────────────────────────────

/** Fetch the authenticated user's tier from the database. */
export async function checkTier(userId?: string): Promise<TierInfo> {
  const fallback: TierInfo = { tier: "free", purchaseDate: null, paymentReference: null };

  try {
    // If no userId provided, get from current session
    let uid = userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id;
    }
    if (!uid) return fallback;

    const { data, error } = await supabase
      .from("user_tiers")
      .select("tier, purchase_date, payment_reference")
      .eq("user_id", uid)
      .maybeSingle();

    if (error || !data) return fallback;

    return {
      tier: data.tier as UserTier,
      purchaseDate: data.purchase_date,
      paymentReference: data.payment_reference,
    };
  } catch {
    return fallback;
  }
}

// ─── Boolean gate helpers ────────────────────────────────
// Each derives from the tier so gating is one clean call.

/** Can the user save recordings to the library? Requires tier1+. */
export function canSave(tier: UserTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK.tier1;
}

/** Can the user access the full affirmation library & replay? Requires tier1+. */
export function canAccessLibrary(tier: UserTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK.tier1;
}

/** Can the user use AI features (personalization, transcription, track builder)? Requires tier2. */
export function canAccessAI(tier: UserTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK.tier2;
}

/** Can the user build & mix tracks? Requires tier2. */
export function canBuildTracks(tier: UserTier): boolean {
  return TIER_RANK[tier] >= TIER_RANK.tier2;
}

/** Generic helper — check if user tier meets a minimum requirement. */
export function meetsMinimumTier(userTier: UserTier, required: UserTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}

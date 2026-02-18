/**
 * Tier Access System
 * ──────────────────
 * Infrastructure for tiered feature gating.
 *
 * Revised Tiers:
 *   "free"  → Record & hear playback. No save, no download, default prompts only.
 *   "tier1" → $27 (Pro) — Save, download, edit prompts, mixer, depth, reps, cloud sync, streaks.
 *   "tier2" → $97 (Elite) — Everything + full AI suite, voice cloning, delivery coaching, subliminal.
 */

import { supabase } from "@/integrations/supabase/client";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";

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

export function canSave(tier: UserTier): boolean {
  if (PAYMENTS_DISABLED) return true;
  return TIER_RANK[tier] >= TIER_RANK.tier1;
}

export function canDownload(tier: UserTier): boolean {
  if (PAYMENTS_DISABLED) return true;
  return TIER_RANK[tier] >= TIER_RANK.tier1;
}

export function canEditPrompts(tier: UserTier): boolean {
  if (PAYMENTS_DISABLED) return true;
  return TIER_RANK[tier] >= TIER_RANK.tier1;
}

export function canAccessLibrary(tier: UserTier): boolean {
  if (PAYMENTS_DISABLED) return true;
  return TIER_RANK[tier] >= TIER_RANK.tier1;
}

export function canCloudSync(tier: UserTier): boolean {
  if (PAYMENTS_DISABLED) return true;
  return TIER_RANK[tier] >= TIER_RANK.tier1;
}

export function canTrackProgress(tier: UserTier): boolean {
  if (PAYMENTS_DISABLED) return true;
  return TIER_RANK[tier] >= TIER_RANK.tier1;
}

export function canAccessAI(tier: UserTier): boolean {
  if (PAYMENTS_DISABLED) return true;
  return TIER_RANK[tier] >= TIER_RANK.tier2;
}

export function canBuildTracks(tier: UserTier): boolean {
  if (PAYMENTS_DISABLED) return true;
  return TIER_RANK[tier] >= TIER_RANK.tier2;
}

export function meetsMinimumTier(userTier: UserTier, required: UserTier): boolean {
  if (PAYMENTS_DISABLED) return true;
  return TIER_RANK[userTier] >= TIER_RANK[required];
}

/**
 * React hook for accessing the current user's tier.
 * Merges database tier (from purchases) with promo tier (from lead capture).
 * Handles trial expiry — trial codes grant real access for a limited time,
 * then drop back to free with a grace period warning.
 */

import { useState, useEffect, useCallback } from "react";
import { checkTier, type UserTier, type TierInfo } from "@/lib/tierAccess";
import { PROMO_TIER_MAP, TRIAL_DURATION_DAYS, TRIAL_GRACE_PERIOD_DAYS, type FeatureTier } from "@/lib/featureTiers";

const TIER_RANK: Record<string, number> = { free: 0, tier1: 1, pro: 1, tier2: 2, elite: 2 };

/** Map featureTier labels ("pro"/"elite") to UserTier ("tier1"/"tier2"). */
function normalizeToUserTier(tier: string): UserTier {
  if (tier === "pro" || tier === "tier1") return "tier1";
  if (tier === "elite" || tier === "tier2") return "tier2";
  return "free";
}

interface PromoInfo {
  tier: UserTier;
  promoCode: string | null;
  trialStartTs: number | null;
  daysRemaining: number | null;
  isExpired: boolean;
  isInGracePeriod: boolean;
}

function getPromoInfo(): PromoInfo {
  const none: PromoInfo = { tier: "free", promoCode: null, trialStartTs: null, daysRemaining: null, isExpired: false, isInGracePeriod: false };
  try {
    const raw = localStorage.getItem("smfm_lead");
    if (!raw) return none;
    const data = JSON.parse(raw);
    const promoCode = data.promoTier as string | null;
    if (!promoCode) return none;

    const mapped = PROMO_TIER_MAP[promoCode] || "free";
    const mappedTier = normalizeToUserTier(mapped);

    // Check if this is a time-limited trial
    const trialDays = TRIAL_DURATION_DAYS[promoCode];
    if (!trialDays) {
      // Permanent access — no expiry
      return { tier: mappedTier, promoCode, trialStartTs: data.ts || null, daysRemaining: null, isExpired: false, isInGracePeriod: false };
    }

    // Calculate trial expiry
    const startTs = data.ts as number;
    if (!startTs) return none;

    const now = Date.now();
    const expiryTs = startTs + trialDays * 24 * 60 * 60 * 1000;
    const msRemaining = expiryTs - now;
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    if (daysRemaining <= 0) {
      // Trial expired — drop to free
      return { tier: "free", promoCode, trialStartTs: startTs, daysRemaining: 0, isExpired: true, isInGracePeriod: false };
    }

    const isInGracePeriod = daysRemaining <= TRIAL_GRACE_PERIOD_DAYS;
    return { tier: mappedTier, promoCode, trialStartTs: startTs, daysRemaining, isExpired: false, isInGracePeriod };
  } catch {
    return none;
  }
}

export interface UseTierResult extends TierInfo {
  loading: boolean;
  refresh: () => Promise<void>;
  /** Days remaining on trial, or null if not a trial */
  trialDaysRemaining: number | null;
  /** True if trial expired */
  trialExpired: boolean;
  /** True if within grace period (last N days of trial) */
  trialGracePeriod: boolean;
  /** The tier label for display ("Pro" / "Elite") */
  tierLabel: string;
}

const TIER_LABELS: Record<UserTier, string> = { free: "Free", tier1: "Pro", tier2: "Elite" };

export function useTier(): UseTierResult {
  const [tierInfo, setTierInfo] = useState<TierInfo>({
    tier: "free" as UserTier,
    purchaseDate: null,
    paymentReference: null,
  });
  const [loading, setLoading] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialGracePeriod, setTrialGracePeriod] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const dbInfo = await checkTier();
    const promo = getPromoInfo();

    // Use whichever tier is higher (purchased tier always wins over expired trial)
    const dbRank = TIER_RANK[dbInfo.tier] ?? 0;
    const promoRank = TIER_RANK[promo.tier] ?? 0;

    if (promoRank > dbRank) {
      setTierInfo({
        tier: promo.tier,
        purchaseDate: dbInfo.purchaseDate,
        paymentReference: dbInfo.paymentReference,
      });
    } else {
      setTierInfo(dbInfo);
    }

    setTrialDaysRemaining(promo.daysRemaining);
    setTrialExpired(promo.isExpired);
    setTrialGracePeriod(promo.isInGracePeriod);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const effectiveTier = tierInfo.tier;

  return {
    ...tierInfo,
    loading,
    refresh,
    trialDaysRemaining,
    trialExpired,
    trialGracePeriod,
    tierLabel: TIER_LABELS[effectiveTier] || "Free",
  };
}

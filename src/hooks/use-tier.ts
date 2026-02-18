/**
 * React hook for accessing the current user's tier.
 * Merges database tier (from purchases) with promo tier (from lead capture).
 * Returns the HIGHER of the two so promo users aren't gated.
 * Components can call `refresh()` after a purchase to re-check.
 */

import { useState, useEffect, useCallback } from "react";
import { checkTier, type UserTier, type TierInfo } from "@/lib/tierAccess";
import { PROMO_TIER_MAP, type FeatureTier } from "@/lib/featureTiers";

const TIER_RANK: Record<string, number> = { free: 0, tier1: 1, pro: 1, tier2: 2, elite: 2 };

/** Map featureTier labels ("pro"/"elite") to UserTier ("tier1"/"tier2"). */
function normalizeToUserTier(tier: string): UserTier {
  if (tier === "pro" || tier === "tier1") return "tier1";
  if (tier === "elite" || tier === "tier2") return "tier2";
  return "free";
}

function getPromoTier(): UserTier {
  try {
    const raw = localStorage.getItem("smfm_lead");
    if (!raw) return "free";
    const data = JSON.parse(raw);
    if (!data.promoTier) return "free";
    const mapped = PROMO_TIER_MAP[data.promoTier] || "free";
    return normalizeToUserTier(mapped);
  } catch {
    return "free";
  }
}

export function useTier() {
  const [tierInfo, setTierInfo] = useState<TierInfo>({
    tier: "free" as UserTier,
    purchaseDate: null,
    paymentReference: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const dbInfo = await checkTier();
    const promoTier = getPromoTier();

    // Use whichever tier is higher
    const dbRank = TIER_RANK[dbInfo.tier] ?? 0;
    const promoRank = TIER_RANK[promoTier] ?? 0;

    if (promoRank > dbRank) {
      setTierInfo({
        tier: promoTier,
        purchaseDate: dbInfo.purchaseDate,
        paymentReference: dbInfo.paymentReference,
      });
    } else {
      setTierInfo(dbInfo);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...tierInfo, loading, refresh };
}

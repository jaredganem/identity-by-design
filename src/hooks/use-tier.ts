/**
 * React hook for accessing the current user's tier.
 * Fetches once on mount and caches in state.
 * Components can call `refresh()` after a purchase to re-check.
 */

import { useState, useEffect, useCallback } from "react";
import { checkTier, type UserTier, type TierInfo } from "@/lib/tierAccess";

export function useTier() {
  const [tierInfo, setTierInfo] = useState<TierInfo>({
    tier: "free" as UserTier,
    purchaseDate: null,
    paymentReference: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const info = await checkTier();
    setTierInfo(info);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...tierInfo, loading, refresh };
}

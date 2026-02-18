import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeatureTier, PROMO_TIER_MAP } from "@/lib/featureTiers";

interface VerifiedTier {
  tier: FeatureTier;
  isFoundingMember: boolean;
  source: "database" | "local" | "default";
}

const STORAGE_KEY = "smfm_lead";

function getLocalTier(): VerifiedTier {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tier: "free", isFoundingMember: false, source: "default" };
    const data = JSON.parse(raw);
    const tier = data.promoTier ? (PROMO_TIER_MAP[data.promoTier] || "free") : "free";
    return { tier: tier as FeatureTier, isFoundingMember: !!data.founding, source: "local" };
  } catch {
    return { tier: "free", isFoundingMember: false, source: "default" };
  }
}

export function useVerifyTier() {
  const [verifiedTier, setVerifiedTier] = useState<VerifiedTier>(getLocalTier);
  const [loading, setLoading] = useState(false);

  const verify = useCallback(async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const { email } = JSON.parse(raw);
      if (!email) return;

      setLoading(true);
      const { data, error } = await supabase.functions.invoke("verify-tier", {
        body: { email },
      });

      if (!error && data?.source === "database") {
        setVerifiedTier({
          tier: (data.tier || "free") as FeatureTier,
          isFoundingMember: !!data.is_founding_member,
          source: "database",
        });

        // Sync local storage with server truth
        const local = JSON.parse(raw);
        local.promoTier = data.promo_tier || null;
        local.founding = data.is_founding_member;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
      }
    } catch {
      // Fall back to local tier silently
    } finally {
      setLoading(false);
    }
  }, []);

  return { ...verifiedTier, loading, verify };
}

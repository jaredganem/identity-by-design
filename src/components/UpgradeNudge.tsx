import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { useTier } from "@/hooks/use-tier";
import { trackEvent } from "@/lib/analytics";
import TierComparison from "@/components/TierComparison";

const UpgradeNudge = () => {
  const { tier, loading } = useTier();
  const [showTiers, setShowTiers] = useState(false);

  if (loading || tier !== "free") return null;

  if (PAYMENTS_DISABLED) {
    return (
      <>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full"
          >
            <button
              onClick={() => {
                trackEvent("tier_comparison_opened", { source: "nudge" });
                setShowTiers(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-xs text-muted-foreground hover:text-primary cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="font-display tracking-wide">
                All Pro features unlocked free during launch.
              </span>
              <span className="text-primary/60 text-[10px]">See all →</span>
            </button>
          </motion.div>
        </AnimatePresence>
        <TierComparison open={showTiers} onClose={() => setShowTiers(false)} />
      </>
    );
  }

  return null;
};

export default UpgradeNudge;

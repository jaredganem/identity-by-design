import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { useTier } from "@/hooks/use-tier";

const UpgradeNudge = () => {
  const { tier, loading } = useTier();

  if (loading || tier !== "free") return null;

  // During launch period, show a "you're getting this free" nudge instead of hiding
  if (PAYMENTS_DISABLED) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="w-full"
        >
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-display tracking-wide">
              All Pro features unlocked free during launch.
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null; // Normal paid flow handled elsewhere
};

export default UpgradeNudge;

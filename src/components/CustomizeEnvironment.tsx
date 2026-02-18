import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTier } from "@/hooks/use-tier";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import UpgradePrompt from "@/components/UpgradePrompt";

interface CustomizeEnvironmentProps {
  children: React.ReactNode;
}

/**
 * Collapsible "Customize Environment" section.
 * - Free tier: shows a 🔒 Pro badge; tapping opens the upgrade prompt.
 * - Pro / Elite: normal expand/collapse (collapsed by default).
 */
const CustomizeEnvironment = ({ children }: CustomizeEnvironmentProps) => {
  const { tier } = useTier();
  const isPro = PAYMENTS_DISABLED || tier === "tier1" || tier === "tier2";
  const [expanded, setExpanded] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleToggle = () => {
    if (!isPro) {
      setShowUpgrade(true);
      return;
    }
    setExpanded((prev) => !prev);
  };

  return (
    <div className="space-y-0">
      {/* Header toggle */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between py-3 px-1 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground tracking-wide">
            Customize Environment
          </span>
          {!isPro && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] rounded-full border border-primary/40 text-primary bg-primary/5 font-medium">
              <Lock className="w-2.5 h-2.5" /> Pro
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            expanded && isPro ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {expanded && isPro && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-2 space-y-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {showUpgrade && (
        <UpgradePrompt
          requiredTier="tier1"
          featureName="Custom Soundscapes & Frequencies"
          onDismiss={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
};

export default CustomizeEnvironment;

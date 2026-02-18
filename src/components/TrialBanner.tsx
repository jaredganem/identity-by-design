import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { useTier } from "@/hooks/use-tier";
import { redirectToCheckout, PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TrialBanner = () => {
  const { trialDaysRemaining, trialExpired, trialGracePeriod, tierLabel, tier } = useTier();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        try {
          const raw = localStorage.getItem("smfm_lead");
          if (raw) {
            const lead = JSON.parse(raw);
            if (lead.email) setUserEmail(lead.email);
          }
        } catch {}
      }
    });
  }, []);

  // Show nothing if not a trial user, or trial is active and not in grace period
  if (trialDaysRemaining === null && !trialExpired) return null;
  if (!trialExpired && !trialGracePeriod) return null;

  const upgradeTier = tier === "tier2" ? "tier2" : "tier1";

  if (trialExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-destructive flex-shrink-0" />
          <span className="text-foreground normal-case tracking-normal">
            Your <span className="font-display text-destructive">{tierLabel}</span> trial has ended.
          </span>
        </div>
        <button
          onClick={() => redirectToCheckout(upgradeTier, userEmail)}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display font-bold uppercase tracking-wider hover:shadow-glow transition-shadow"
        >
          {PAYMENTS_DISABLED ? "Coming Soon" : "Upgrade Now"}
        </button>
      </motion.div>
    );
  }

  // Grace period — trial ending soon
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-muted-foreground normal-case tracking-normal">
            Your <span className="font-display text-primary">{tierLabel}</span> trial ends in{" "}
            <span className="text-foreground font-medium">{trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""}</span>
          </span>
        </div>
        <button
          onClick={() => redirectToCheckout(upgradeTier, userEmail)}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-display font-bold uppercase tracking-wider hover:shadow-glow transition-shadow"
        >
          {PAYMENTS_DISABLED ? "Coming Soon" : "Keep Access"}
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrialBanner;

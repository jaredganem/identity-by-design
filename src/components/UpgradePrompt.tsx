import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, Crown, X, Sparkles, Tag } from "lucide-react";
import { redirectToCheckout, PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { supabase } from "@/integrations/supabase/client";
import { saveLead } from "@/components/LeadCaptureGate";
import { trackEvent } from "@/lib/analytics";

interface UpgradePromptProps {
  requiredTier: "tier1" | "tier2";
  featureName: string;
  inline?: boolean;
  onDismiss?: () => void;
}

const TIER_INFO = {
  tier1: {
    label: "Pro",
    price: "$27",
    icon: Zap,
    tagline: "For the man who's done consuming and ready to install.",
    features: [
      "Save Recordings to Your Library",
      "Download & Export Your Programs",
      "Edit Affirmation Prompts",
      "Audio Mixer & Depth Effects",
      "Sleep Timer & Repetition Control",
      "AI Clip Naming & Categorization",
      "Cloud Sync Across Devices",
      "Full Identity Player with Visualizer",
      "Install as an App on Your Phone",
    ],
  },
  tier2: {
    label: "Elite",
    price: "$97",
    icon: Crown,
    tagline: "For the man who wants the full installation.",
    features: [
      "Everything in Pro",
      "AI Prompt Personalization — Affirmations Written for You",
      "AI Track Builder — Full Programs from a Single Goal",
    ],
  },
};

/** Inline promo code entry + launch access messaging */
const LaunchAccessCard = ({ onDismiss }: { onDismiss?: () => void }) => {
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    setApplying(true);
    trackEvent("promo_code_submitted", { code });
    try {
      const raw = localStorage.getItem("smfm_lead");
      if (raw) {
        const lead = JSON.parse(raw);
        await saveLead(lead.name || "User", lead.email || "", code, lead.lastName);
        setApplied(true);
        trackEvent("promo_code_applied", { code });
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {} finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-display text-sm text-primary">Launch Access</span>
        </div>
        <p className="text-xs text-muted-foreground normal-case tracking-normal leading-relaxed">
          All Pro &amp; Elite features are unlocked free during our launch period. Pricing goes live soon — get in early.
        </p>

        {!showPromoInput ? (
          <button
            type="button"
            onClick={() => { setShowPromoInput(true); trackEvent("promo_code_opened", {}); }}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
          >
            <Tag className="w-3 h-3" />
            Have a promo code?
          </button>
        ) : applied ? (
          <p className="text-xs text-primary font-medium normal-case tracking-normal">✓ Code applied! Refreshing…</p>
        ) : (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code"
              maxLength={50}
              className="flex-1 h-9 px-3 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
            />
            <button
              onClick={handleApplyPromo}
              disabled={applying || !promoCode.trim()}
              className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-display font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {applying ? "…" : "Apply"}
            </button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-shadow duration-500"
        >
          Continue — It's Free
        </button>
      )}
    </div>
  );
};

const UpgradePrompt = ({ requiredTier, featureName, inline = false, onDismiss }: UpgradePromptProps) => {
  const info = TIER_INFO[requiredTier];
  const Icon = info.icon;
  const [userEmail, setUserEmail] = useState("");

  // Track when the upgrade prompt is shown
  useEffect(() => {
    trackEvent("upgrade_prompt_viewed", { tier: requiredTier, feature: featureName, payments_disabled: PAYMENTS_DISABLED });
  }, [requiredTier, featureName]);

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

  const handleUpgrade = () => {
    trackEvent("upgrade_clicked", { tier: requiredTier, feature: featureName });
    redirectToCheckout(requiredTier, userEmail);
  };

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Lock className="w-5 h-5 text-primary" />
        <span className="text-sm text-muted-foreground normal-case tracking-normal">
          <span className="text-foreground font-medium">{featureName}</span> requires{" "}
          <span className="text-primary font-display">{info.label}</span>
        </span>
      </div>

      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Icon className="w-6 h-6 text-primary" />
          <h3 className="font-display text-xl text-foreground">
            Unlock <span className="text-primary">{info.label}</span>
          </h3>
        </div>
        <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
          {info.tagline}
        </p>
      </div>

      {PAYMENTS_DISABLED ? (
        <LaunchAccessCard onDismiss={onDismiss} />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
            {info.features.map((f) => (
              <li key={f} className="flex items-center gap-2 normal-case tracking-normal">
                <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgrade}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-shadow duration-500"
          >
            Get {info.label} — {info.price} one time
          </motion.button>

          {onDismiss && (
            <button
              onClick={() => { trackEvent("upgrade_prompt_dismissed", { tier: requiredTier, feature: featureName }); onDismiss(); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 normal-case tracking-normal"
            >
              Maybe later
            </button>
          )}
        </>
      )}
    </div>
  );

  if (inline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm p-6"
      >
        {content}
      </motion.div>
    );
  }

  // Modal overlay
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6"
        >
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradePrompt;

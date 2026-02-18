import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, Crown, X } from "lucide-react";
import { redirectToCheckout } from "@/lib/lemonsqueezy";
import { supabase } from "@/integrations/supabase/client";

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
      "Save to Library",
      "Download Programs",
      "Edit Prompts",
      "Audio Mixer & Depth Effects",
      "Sleep Timer & Repetition Control",
      "AI Clip Naming & Categorization",
      "Cloud Sync Across Devices",
      "Streak & Progress Tracking",
      "Identity Player",
      "Installable PWA",
    ],
  },
  tier2: {
    label: "Elite",
    price: "$97",
    icon: Crown,
    tagline: "For the man who wants the full installation.",
    features: [
      "Everything in Pro",
      "AI Prompt Personalization",
      "AI Track Builder",
      "AI Voice Cloning",
      "AI Delivery Coaching",
      "Background Soundscapes",
      "Multiple Healing Frequencies",
      "Subliminal Layering",
      "Batch Export All Tracks",
      "Daily Program Scheduler",
    ],
  },
};

const UpgradePrompt = ({ requiredTier, featureName, inline = false, onDismiss }: UpgradePromptProps) => {
  const info = TIER_INFO[requiredTier];
  const Icon = info.icon;
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? "");
    });
  }, []);

  const handleUpgrade = () => {
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
          onClick={onDismiss}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 normal-case tracking-normal"
        >
          Maybe later
        </button>
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

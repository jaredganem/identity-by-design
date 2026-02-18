import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { logReferral } from "@/lib/referral";

const STORAGE_KEY = "smfm_lead";

export function hasLeadCaptured(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

const PROMO_CODES: Record<string, string> = {
  VIP: "vip",
  FREE3: "3mo_free",
  FREE6: "6mo_free",
  FOUNDERSVIP: "founders_vip",
  VIPALL: "vip_all",       // Free VIP → all tiers forever
  VIPMID: "vip_mid",       // Free VIP → up to Pro tier forever
  VIPBASIC: "vip_basic",   // Free VIP → Free tier forever, must upgrade for Pro/Elite
};

export async function saveLead(firstName: string, email: string, promoCode?: string, lastName?: string) {
  const upperCode = (promoCode || "").trim().toUpperCase();
  const promoTier = PROMO_CODES[upperCode] || null;
  const isFoundingMember = ["VIP", "FOUNDERSVIP", "VIPALL"].includes(upperCode);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: firstName, lastName, email, founding: isFoundingMember, promoTier, ts: Date.now() }));
  const { data } = await supabase.from("leads").insert({ name: firstName, last_name: lastName || null, email, is_founding_member: isFoundingMember, promo_tier: promoTier } as any).select("id, referral_code").single();
  trackEvent("lead_captured", { is_founding_member: isFoundingMember, promo_tier: promoTier });

  // Log referral attribution if they arrived via ?ref=
  if (data?.id) {
    await logReferral(email, data.id);
    // Store their own referral code so share links include it
    if (data.referral_code) {
      localStorage.setItem("smfm_ref_code", data.referral_code);
    }
  }
}

interface LeadCaptureGateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LeadCaptureGate = ({ open, onClose, onSuccess }: LeadCaptureGateProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst) {
      setError("Enter your first name to continue.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    await saveLead(trimmedFirst, trimmedEmail, promoCode, trimmedLast || undefined);
    setSubmitting(false);
    setError("");
    onSuccess();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-0 overflow-y-auto overscroll-contain"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md rounded-2xl sm:rounded-2xl rounded-b-none bg-gradient-card border border-border shadow-card p-6 sm:p-8 space-y-4 sm:space-y-6 max-h-[80dvh] overflow-y-auto overscroll-contain mb-0 sm:mb-auto"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Self-Mastery for Men™
              </p>
              <h3 className="font-display text-2xl text-foreground">
                Start Your{" "}
                <span className="text-primary text-glow">Free Trial</span>
              </h3>
              <p className="text-sm text-muted-foreground normal-case tracking-normal">
                Enter your name and email to unlock the full identity installation experience.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setError(""); }}
                    placeholder="First name"
                    maxLength={100}
                    className="w-full h-11 px-4 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                    autoFocus
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Name <span className="text-muted-foreground/50 normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    maxLength={100}
                    className="w-full h-11 px-4 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="your@email.com"
                  maxLength={255}
                  className="w-full h-11 px-4 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>

              {/* Promo code toggle */}
              {!showPromo ? (
                <button
                  type="button"
                  onClick={() => setShowPromo(true)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                >
                  Have a promo code?
                </button>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    maxLength={50}
                    className="w-full h-11 px-4 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
              )}

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-primary text-primary-foreground font-display text-sm tracking-wider hover:shadow-glow transition-all"
              >
                {submitting ? "Unlocking..." : "Unlock Access"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Trust */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span className="normal-case tracking-normal">No spam. No credit card. Just identity work.</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LeadCaptureGate;

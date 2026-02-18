import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Minus, Zap, Crown, Sparkles, Tag } from "lucide-react";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { saveLead } from "@/components/LeadCaptureGate";
import { trackEvent } from "@/lib/analytics";

interface TierComparisonProps {
  open: boolean;
  onClose: () => void;
}

const TIERS = [
  { key: "free", label: "Free", price: "$0", icon: Sparkles, color: "text-muted-foreground" },
  { key: "pro", label: "Pro", price: "$27", icon: Zap, color: "text-primary" },
  { key: "elite", label: "Elite", price: "$97", icon: Crown, color: "text-amber-400" },
] as const;

const FEATURES: { name: string; free: boolean; pro: boolean; elite: boolean; category: string }[] = [
  // Recording
  { name: "Guided 12-Affirmation Recording", free: true, pro: true, elite: true, category: "Recording" },
  { name: "Freestyle Recording", free: true, pro: true, elite: true, category: "Recording" },
  { name: "417Hz Frequency Playback", free: true, pro: true, elite: true, category: "Recording" },
  { name: "In-Session Playback", free: true, pro: true, elite: true, category: "Recording" },
  // Pro
  { name: "Save to Library", free: false, pro: true, elite: true, category: "Library & Export" },
  { name: "Browse & Replay Library", free: false, pro: true, elite: true, category: "Library & Export" },
  { name: "Download & Export Programs", free: false, pro: true, elite: true, category: "Library & Export" },
  { name: "Cloud Sync Across Devices", free: false, pro: true, elite: true, category: "Library & Export" },
  { name: "Edit Affirmation Prompts", free: false, pro: true, elite: true, category: "Customization" },
  { name: "Audio Mixer & Depth Effects", free: false, pro: true, elite: true, category: "Customization" },
  { name: "Sleep Timer & Repetition Control", free: false, pro: true, elite: true, category: "Customization" },
  { name: "AI Clip Naming & Categorization", free: false, pro: true, elite: true, category: "Customization" },
  { name: "Identity Player with Visualizer", free: false, pro: true, elite: true, category: "Customization" },
  { name: "Install as App (PWA)", free: false, pro: true, elite: true, category: "Customization" },
  // Elite
  { name: "AI Prompt Personalization", free: false, pro: false, elite: true, category: "AI Suite" },
  { name: "AI Track Builder", free: false, pro: false, elite: true, category: "AI Suite" },
  { name: "AI Delivery Coaching", free: false, pro: false, elite: true, category: "AI Suite" },
  { name: "Multiple Healing Frequencies", free: false, pro: false, elite: true, category: "AI Suite" },
  { name: "Background Soundscapes", free: false, pro: false, elite: true, category: "AI Suite" },
  { name: "Subliminal Layering", free: false, pro: false, elite: true, category: "AI Suite" },
];

// Group features by category
const CATEGORIES = [...new Set(FEATURES.map((f) => f.category))];

const TierComparison = ({ open, onClose }: TierComparisonProps) => {
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    setApplying(true);
    trackEvent("promo_code_submitted", { code, source: "tier_comparison" });
    try {
      const raw = localStorage.getItem("smfm_lead");
      if (raw) {
        const lead = JSON.parse(raw);
        await saveLead(lead.name || "User", lead.email || "", code, lead.lastName);
        setApplied(true);
        trackEvent("promo_code_applied", { code, source: "tier_comparison" });
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {} finally {
      setApplying(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto overscroll-contain"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl sm:rounded-2xl rounded-b-none bg-card border border-border shadow-card max-h-[85dvh] overflow-y-auto overscroll-contain mb-0 sm:mb-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg text-foreground">
                  What's <span className="text-primary">Included</span>
                </h3>
                {PAYMENTS_DISABLED && (
                  <p className="text-[10px] text-primary font-display tracking-wider mt-0.5">
                    ✦ ALL FEATURES UNLOCKED DURING LAUNCH
                  </p>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tier Headers */}
            <div className="sticky top-[61px] z-10 bg-card/95 backdrop-blur-sm border-b border-border">
              <div className="grid grid-cols-[1fr_60px_60px_60px] gap-1 px-5 py-3">
                <div />
                {TIERS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <div key={t.key} className="text-center">
                      <Icon className={`w-4 h-4 mx-auto mb-0.5 ${t.color}`} />
                      <p className={`text-[10px] font-display font-bold ${t.color}`}>{t.label}</p>
                      <p className="text-[9px] text-muted-foreground">{t.price}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feature Rows */}
            <div className="px-5 py-3 space-y-4">
              {CATEGORIES.map((cat) => (
                <div key={cat}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display mb-2">{cat}</p>
                  <div className="space-y-0">
                    {FEATURES.filter((f) => f.category === cat).map((feature) => (
                      <div
                        key={feature.name}
                        className="grid grid-cols-[1fr_60px_60px_60px] gap-1 py-2 border-b border-border/30 last:border-b-0"
                      >
                        <span className="text-xs text-foreground/80 normal-case tracking-normal leading-tight">
                          {feature.name}
                        </span>
                        {[feature.free, feature.pro, feature.elite].map((included, i) => (
                          <div key={i} className="flex justify-center">
                            {included ? (
                              <Check className={`w-3.5 h-3.5 ${PAYMENTS_DISABLED ? "text-primary" : i === 0 ? "text-muted-foreground" : TIERS[i].color}`} />
                            ) : (
                              <Minus className="w-3.5 h-3.5 text-border" />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border px-5 py-4">
              {PAYMENTS_DISABLED && (
                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground normal-case tracking-normal">
                    Everything above is free right now. Pricing goes live soon.
                  </p>
                  {!showPromoInput ? (
                    <button
                      type="button"
                      onClick={() => { setShowPromoInput(true); trackEvent("promo_code_opened", { source: "tier_comparison" }); }}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
                    >
                      <Tag className="w-3 h-3" />
                      Have a promo code?
                    </button>
                  ) : applied ? (
                    <p className="text-xs text-primary font-medium normal-case tracking-normal">✓ Code applied! Refreshing…</p>
                  ) : (
                    <div className="flex gap-2">
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
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TierComparison;

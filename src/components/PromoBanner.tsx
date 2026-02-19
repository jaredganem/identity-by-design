import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { hasLeadCaptured } from "@/components/LeadCaptureGate";
import LeadCaptureGate from "@/components/LeadCaptureGate";

const PromoBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const alreadyCaptured = hasLeadCaptured();

  if (alreadyCaptured || dismissed) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ delay: 1.5, duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none"
        >
          <div className="max-w-lg mx-auto pointer-events-auto">
            <div className="relative rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-lg px-5 py-4">
              {/* Dismiss */}
              <button
                onClick={() => setDismissed(true)}
                className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
                    Pre-Launch Access
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed pr-6">
                  Have a promo code? Unlock unlimited access to every feature during our beta.
                </p>
                <button
                  onClick={() => setShowGate(true)}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Enter Promo Code
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <LeadCaptureGate
        open={showGate}
        onClose={() => setShowGate(false)}
        onSuccess={() => {
          setShowGate(false);
          setDismissed(true);
        }}
      />
    </>
  );
};

export default PromoBanner;

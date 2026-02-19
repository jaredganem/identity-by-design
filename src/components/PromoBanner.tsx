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
            <div className="relative rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-xl shadow-lg px-5 py-3.5 text-center">
              <button
                onClick={() => setDismissed(true)}
                className="absolute top-2.5 right-2.5 p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-medium">
                    Pre-Launch Access
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Have a promo code? Unlock unlimited access during beta.
                </p>
                <button
                  onClick={() => setShowGate(true)}
                  className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
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

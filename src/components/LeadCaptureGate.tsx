import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "smfm_lead";

export function hasLeadCaptured(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export async function saveLead(name: string, email: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email, ts: Date.now() }));
  await supabase.from("leads").insert({ name, email });
}

interface LeadCaptureGateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LeadCaptureGate = ({ open, onClose, onSuccess }: LeadCaptureGateProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Enter your name to continue.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    await saveLead(trimmedName, trimmedEmail);
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-0 overflow-y-auto"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md rounded-2xl sm:rounded-2xl rounded-b-none bg-gradient-card border border-border shadow-card p-6 sm:p-8 space-y-4 sm:space-y-6 max-h-[85dvh] overflow-y-auto mb-0 sm:mb-auto"
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  First Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Your first name"
                  maxLength={100}
                  className="w-full h-11 px-4 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  autoFocus
                />
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

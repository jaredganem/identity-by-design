import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { redirectToCheckout } from "@/lib/lemonsqueezy";
import { supabase } from "@/integrations/supabase/client";
import { useTier } from "@/hooks/use-tier";

const UpgradeNudge = () => {
  const { tier, loading } = useTier();
  const [userEmail, setUserEmail] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? "");
    });
  }, []);

  if (loading || tier !== "free" || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="w-full"
      >
        <button
          onClick={() => redirectToCheckout("tier1", userEmail)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-xs text-muted-foreground hover:text-primary"
        >
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="font-display tracking-wide">
            Unlock Pro — $27 one time. Own it forever.
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeNudge;

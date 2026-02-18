import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const InstallBanner = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Hide if already installed (standalone mode) or previously dismissed this session
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    const wasDismissed = sessionStorage.getItem("smfm_install_dismissed");

    if (!isStandalone && !wasDismissed) {
      // Show after a short delay so it doesn't compete with initial load
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("smfm_install_dismissed", "1");
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 max-w-2xl mx-auto px-6 mb-4"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
              <Download className="w-4 h-4 text-primary" />
            </div>
            <button
              onClick={() => navigate("/install")}
              className="flex-1 text-left"
            >
              <p className="text-xs text-foreground font-medium">Get the App</p>
              <p className="text-[10px] text-muted-foreground">Install for instant access — no app store needed</p>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallBanner;

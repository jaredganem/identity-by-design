import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const Footer = () => {
  const [open, setOpen] = useState(false);

  return (
    <footer className="relative z-10 max-w-2xl mx-auto px-6 py-12 mt-8">
      <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full p-5 flex items-center justify-between text-left"
        >
          <p className="font-display font-bold text-sm text-foreground tracking-[0.05em]">Disclaimer</p>
          <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-3 text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                <p>
                  This program is for educational and personal development purposes only. Results are not guaranteed and will vary based on individual effort and consistency. Not a substitute for professional medical or psychological care.
                </p>
                <p className="text-xs text-muted-foreground pt-2">
                  © 2026 Self-Mastery for Men™
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </footer>
  );
};

export default Footer;

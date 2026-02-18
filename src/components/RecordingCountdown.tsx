import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface RecordingCountdownProps {
  onComplete: () => void;
  onCancel: () => void;
}

const RecordingCountdown = ({ onComplete, onCancel }: RecordingCountdownProps) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-3 py-6"
    >
      <div className="flex items-center gap-3">
        {[3, 2, 1].map((n) => (
          <motion.div
            key={n}
            initial={{ opacity: 0.2, scale: 0.8 }}
            animate={{
              opacity: count <= n ? (count === n ? 1 : 0.2) : 0.15,
              scale: count === n ? 1.15 : 0.9,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
              count === n
                ? "border-primary bg-primary/20 shadow-glow"
                : count < n
                ? "border-muted-foreground/20 bg-muted/10"
                : "border-primary/30 bg-primary/5"
            }`}
          >
            <span
              className={`font-display text-2xl transition-colors duration-300 ${
                count === n ? "text-primary text-glow" : "text-muted-foreground/40"
              }`}
            >
              {n}
            </span>
          </motion.div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground font-display tracking-wide">
        {count > 0 ? "Get into state…" : "Recording"}
      </p>
      <button
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-4"
      >
        Cancel
      </button>
    </motion.div>
  );
};

export default RecordingCountdown;

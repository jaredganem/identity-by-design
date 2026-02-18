import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onCancel}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-28 h-28 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shadow-glow">
            <span className="font-display text-5xl text-primary text-glow">
              {count > 0 ? count : ""}
            </span>
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
      </AnimatePresence>
    </motion.div>
  );
};

export default RecordingCountdown;

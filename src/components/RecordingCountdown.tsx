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
    <motion.button
      onClick={(e) => { e.stopPropagation(); onCancel(); }}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className="w-20 h-20 rounded-full flex items-center justify-center bg-primary/20 border-2 border-primary shadow-glow relative"
    >
      {/* Animated ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40" cy="40" r="36"
          fill="none"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="3"
        />
        <motion.circle
          cx="40" cy="40" r="36"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 36}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 36 }}
          transition={{ duration: 2.4, ease: "linear" }}
        />
      </svg>
      <motion.span
        key={count}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="font-display text-2xl text-primary text-glow z-10"
      >
        {count}
      </motion.span>
    </motion.button>
  );
};

export default RecordingCountdown;

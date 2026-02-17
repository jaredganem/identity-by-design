import { motion } from "framer-motion";

interface HeroSectionProps {
  onStart: (mode: "guided" | "freestyle" | "library") => void;
}

const HeroSection = ({ onStart }: HeroSectionProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.2 }}
    className="flex flex-col items-center justify-center text-center min-h-[80vh] relative z-10 px-6"
  >
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6"
    >
      Self Mastery for Men™
    </motion.p>

    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="font-display text-5xl md:text-7xl font-bold text-foreground mb-4 leading-tight tracking-[0.06em]"
    >
      Command
      <br />
      <span className="text-primary text-glow">Your Mind</span>
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="text-muted-foreground max-w-md text-base leading-relaxed mb-10"
    >
      Record powerful affirmations in your own voice, layered over
      417 Hz frequencies. Reprogram your subconscious while you sleep.
    </motion.p>

    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.1, duration: 0.5 }}
      className="flex flex-col sm:flex-row gap-4"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onStart("guided")}
        className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.15em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-shadow duration-500"
      >
        Guided Journey
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onStart("freestyle")}
        className="px-10 py-4 rounded-full border border-primary/40 text-foreground font-display font-bold text-sm uppercase tracking-[0.15em] hover:bg-primary/10 transition-all duration-500"
      >
        Create Your Own
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onStart("library")}
        className="px-10 py-4 rounded-full border border-primary/40 text-foreground font-display font-bold text-sm uppercase tracking-[0.15em] hover:bg-primary/10 transition-all duration-500"
      >
        My Library
      </motion.button>
    </motion.div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
      className="text-xs text-muted-foreground mt-6 max-w-md"
    >
      <span className="text-primary">Guided</span> walks you through 12 curated affirmations.{" "}
      <span className="text-primary">Create Your Own</span> lets you record freely.{" "}
      <span className="text-primary">My Library</span> lets you mix &amp; match saved recordings into new tracks.
    </motion.p>
  </motion.div>
);

export default HeroSection;

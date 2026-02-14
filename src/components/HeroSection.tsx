import { motion } from "framer-motion";

interface HeroSectionProps {
  onStart: () => void;
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
      Sacred Frequency · 417 Hz
    </motion.p>

    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      className="font-display text-5xl md:text-7xl font-light text-foreground mb-4 leading-tight"
    >
      Speak Your
      <br />
      <span className="text-primary text-glow font-medium">Truth</span>
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="text-muted-foreground max-w-md text-base leading-relaxed mb-10"
    >
      Record your affirmations with ethereal reverb, layered over sacred 417 Hz
      frequencies. Fall asleep to the sound of your own transformation.
    </motion.p>

    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.1, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onStart}
      className="px-10 py-4 rounded-full bg-primary text-primary-foreground font-body font-medium text-sm uppercase tracking-[0.15em] shadow-glow hover:shadow-[0_0_60px_hsl(42_78%_55%/0.4)] transition-shadow duration-500"
    >
      Begin Your Journey
    </motion.button>
  </motion.div>
);

export default HeroSection;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onStart: (mode: "guided" | "freestyle" | "library") => void;
}

const steps = [
  {
    number: "01",
    title: "Write Your Identity Code",
    description:
      "Write 2–5 \"I am\" statements in each major life category: Health, Wealth, Relationships, Career/Mission, and Personal Character. State them in the positive, present tense — as if it's already done. Example: \"I am now 180 lbs at 10% body fat by January 1st.\"",
  },
  {
    number: "02",
    title: "Record in Your Own Voice",
    description:
      "Record each statement first in first person (\"I am now…\") then again in third person (\"[Your name] is now…\"). Your brain accepts your own voice like a sponge — it bypasses the resistance you'd feel from a stranger's voice.",
  },
  {
    number: "03",
    title: "Layer Over 417 Hz",
    description:
      "The app layers your voice over a 417 Hz frequency — known to heal, balance, and promote change. It puts your brain into that sweet spot between awake and asleep where you're most open to suggestion.",
  },
  {
    number: "04",
    title: "Add Reverb & Set Your Loop",
    description:
      "Bring your voice volume down, add a slight echo so it sounds spacey and trance-like. Set how many times your affirmations loop — 20 to 30 minutes is the sweet spot.",
  },
  {
    number: "05",
    title: "Fall Asleep & Transform",
    description:
      "Listen as you drift off to sleep. Set the sleep timer so it doesn't interrupt your REM cycle. Within days, your internal dialogue starts mimicking what you recorded. Within weeks, the things you've been forcing start happening naturally.",
  },
];

const HeroSection = ({ onStart }: HeroSectionProps) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="flex flex-col items-center justify-center text-center min-h-[80vh] relative z-10 px-6 py-12"
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
        Identity
        <br />
        <span className="text-primary text-glow">By Design</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-muted-foreground max-w-lg text-base leading-relaxed mb-10"
      >
        Script, record, and activate your own unconscious autopilot.
        A custom-built identity code — in your own voice, your own words —
        hardwired into your nervous system through repetition.
        This isn't some generic meditation.
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

      {/* How to Use This */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mt-12 w-full max-w-xl"
      >
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center justify-center gap-2 mx-auto text-sm uppercase tracking-[0.2em] text-primary hover:text-foreground transition-colors"
        >
          How This Works
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${showGuide ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <div className="mt-6 space-y-4">
                {steps.map((step, i) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gradient-card border border-border rounded-2xl p-5 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-primary font-display font-bold text-lg leading-none mt-0.5">
                        {step.number}
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-sm text-foreground mb-1.5 tracking-[0.1em]">
                          {step.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed normal-case tracking-normal">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <p className="text-xs text-muted-foreground text-center pt-2 italic normal-case tracking-normal">
                  "Your brain can't tell the difference between what's real and what's imagined.
                  Within a week, your internal dialogue starts mimicking what you recorded."
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default HeroSection;

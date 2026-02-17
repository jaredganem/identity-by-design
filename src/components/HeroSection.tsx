import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";

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
  const [showOnboarding, setShowOnboarding] = useState(false);

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
        Self-Mastery for Men™
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="font-display text-5xl md:text-7xl font-bold text-foreground mb-2 leading-tight tracking-[0.06em]"
      >
        Identity
        <br />
        <span className="text-primary text-glow">By Design</span>
        <span className="text-primary text-lg align-super ml-1">™</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-6"
      >
        Unconscious Autopilot Installer
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-foreground max-w-2xl text-lg md:text-xl font-medium leading-relaxed mb-4"
      >
        Finally. A tool that rewires your unconscious identity overnight — in your own voice.
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95 }}
        className="text-muted-foreground max-w-xl text-base leading-relaxed mb-4"
      >
        Most men know exactly who they're capable of being. Something keeps stopping them. This installs the new version at the only level where change actually sticks — the unconscious.
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05 }}
        className="text-sm text-primary font-medium mb-10 italic"
      >
        The exact tool I used to lose 80lbs, eliminate six figures of debt, and completely rebuild my life — in less than 18 months.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowOnboarding(true)}
          className="px-12 py-5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.15em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-shadow duration-500 flex items-center gap-2"
        >
          Start Building Your Identity
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* How This Works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
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
                  <br />
                  <span className="text-foreground not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">— Jared Ganem</span>
                </p>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center italic normal-case tracking-normal">
                    "Any idea, plan, or purpose may be placed in the mind through repetition of thought.
                    The principle of autosuggestion voluntarily reaches the subconscious mind and influences it with these thoughts."
                    <br />
                    <span className="text-foreground not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">— Napoleon Hill, Think and Grow Rich</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
            onClick={() => setShowOnboarding(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-gradient-card border border-border p-8 space-y-6 shadow-card"
            >
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Welcome to</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
                  Identity by Design<span className="text-primary text-sm align-super ml-0.5">™</span>
                </h2>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                <p>
                  Your unconscious mind is running your life on autopilot.<br />
                  Right now. 24/7.
                </p>
                <p>
                  Most of that programming was installed before you were 7.
                  You didn't choose it. But it's choosing your results.
                </p>
                <p className="text-foreground font-medium">
                  This tool lets you override it.
                </p>
                <p>
                  In your own voice.<br />
                  While you sleep.<br />
                  Using the exact method I used to lose 80lbs, eliminate six figures of debt, and rebuild my entire life from scratch.
                </p>
                <p>
                  Not motivation. Not willpower.<br />
                  <span className="text-primary font-medium">Unconscious reprogramming.</span>
                </p>

                <div className="border-t border-border/50 pt-4">
                  <p className="text-foreground font-medium mb-3">Here's what you're going to do:</p>
                  <div className="space-y-2 text-sm">
                    <p>→ Write 2-5 "I AM" statements in each life category</p>
                    <p>→ Record them in your voice (first person + third person)</p>
                    <p>→ Add the 417Hz frequency behind it</p>
                    <p>→ Fall asleep listening for 20-30 minutes</p>
                    <p>→ Repeat nightly</p>
                  </div>
                </div>

                <p className="text-center text-foreground font-medium pt-2">
                  Do this for 30 days. Then tell me what changed.
                </p>

                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs italic text-center">
                    "Any idea, plan, or purpose may be placed in the mind through repetition of thought."
                    <br />
                    <span className="text-foreground not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">— Napoleon Hill, Think and Grow Rich</span>
                  </p>
                </div>
              </div>

              <div className="text-center space-y-4 pt-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Choose your path</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => { setShowOnboarding(false); onStart("guided"); }}
                    className="w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-all duration-500 text-left"
                  >
                    <span className="block text-primary-foreground/70 text-xs normal-case tracking-normal font-normal mb-0.5">Don't know where to start? Use this.</span>
                    Guided Identity Blueprint
                    <span className="block text-primary-foreground/60 text-xs normal-case tracking-normal font-normal mt-1">
                      A structured 12-affirmation sequence across Health, Wealth, Relationships, Career & Character.
                    </span>
                  </button>

                  <button
                    onClick={() => { setShowOnboarding(false); onStart("freestyle"); }}
                    className="w-full px-8 py-4 rounded-xl border border-primary/40 text-foreground font-display font-bold text-sm uppercase tracking-[0.12em] hover:bg-primary/10 transition-all duration-500 text-left"
                  >
                    <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mb-0.5">You know what you want to install. Let's do it.</span>
                    Custom Identity Script
                    <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mt-1">
                      Freestyle recording for men who know their affirmations. Record as many as you want.
                    </span>
                  </button>

                  <button
                    onClick={() => { setShowOnboarding(false); onStart("library"); }}
                    className="w-full px-8 py-4 rounded-xl border border-primary/40 text-foreground font-display font-bold text-sm uppercase tracking-[0.12em] hover:bg-primary/10 transition-all duration-500 text-left"
                  >
                    <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mb-0.5">Your personal unconscious programming vault.</span>
                    Identity Library
                    <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mt-1">
                      All your saved identity statements. Mix, match, and build custom sessions from what's working.
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HeroSection;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onStart: (mode: "guided" | "freestyle" | "library") => void;
}

const steps = [
  {
    number: "01",
    title: "Write Your Identity Code",
    description:
      'Write 2–5 "I am now…" statements in each major life category: Health, Wealth, Relationships, Career/Mission, and Personal Character. State them in the positive, present tense — as if it\'s already done.',
  },
  {
    number: "02",
    title: "Record in Your Own Voice",
    description:
      'Record each statement first in first person ("I am now…") then again in third person ("[Your name] is now…"). Your brain accepts your own voice like a sponge — bypassing the resistance you\'d feel from a stranger\'s voice.',
  },
  {
    number: "03",
    title: "Layer Over 417 Hz",
    description:
      "The app layers your voice over a 417 Hz frequency — known to heal, balance, and promote change. It puts your brain into that sweet spot between awake and asleep.",
  },
  {
    number: "04",
    title: "Add Depth & Set Your Loop",
    description:
      "Bring your voice volume down, add a slight echo so it sounds spacey and trance-like. Set how many times your affirmations loop — 20 to 30 minutes is the sweet spot.",
  },
  {
    number: "05",
    title: "Fall Asleep & Transform",
    description:
      "Listen as you drift off to sleep. Set the session timer so it doesn't interrupt your REM cycle. Within days, your internal dialogue starts mimicking what you recorded.",
  },
];

const HeroSection = ({ onStart }: HeroSectionProps) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showModes, setShowModes] = useState(false);

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="flex flex-col items-center justify-center text-center relative z-10 px-6 py-12"
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
        className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-8"
      >
        Your Unconscious Autopilot Installer
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-muted-foreground max-w-xl text-base leading-relaxed mb-10"
      >
        Your custom unconscious reprogramming system. Script, record, and install your new identity — in your own voice, while you sleep.
      </motion.p>

      {/* Napoleon Hill — Featured Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95 }}
        className="max-w-lg mb-10 px-6 py-5 rounded-2xl border border-primary/30 bg-primary/5"
      >
        <p className="text-sm text-foreground italic leading-relaxed">
          "Any idea, plan, or purpose may be placed in the mind through repetition of thought."
        </p>
        <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">
          — Napoleon Hill, Think and Grow Rich
        </p>
      </motion.div>

      {/* Start Building CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowModes(true)}
          className="px-12 py-5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.15em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-shadow duration-500 flex items-center gap-2"
        >
          Start Building Your Identity
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Choose Your Path — revealed on CTA click */}
      <AnimatePresence>
        {showModes && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
            className="mt-8 w-full max-w-2xl space-y-4"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground text-center">
              Choose your path
            </p>

            <div className="space-y-3">
              <button
                onClick={() => onStart("guided")}
                className="w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-all duration-500 text-left"
              >
                <span className="block text-primary-foreground/70 text-xs normal-case tracking-normal font-normal mb-0.5">Don't know where to start? Use this.</span>
                Guided Identity Blueprint
                <span className="block text-primary-foreground/60 text-xs normal-case tracking-normal font-normal mt-1">
                  A structured 12-affirmation sequence across Health, Wealth, Relationships, Career & Character.
                </span>
              </button>

              <button
                onClick={() => onStart("freestyle")}
                className="w-full px-8 py-4 rounded-xl border border-primary/40 text-foreground font-display font-bold text-sm uppercase tracking-[0.12em] hover:bg-primary/10 transition-all duration-500 text-left"
              >
                <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mb-0.5">You already know your affirmations. Let's install them.</span>
                Custom Identity Script
                <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mt-1">
                  Freestyle recording for men who already know their affirmations. Record as many as you want. Build your exact identity code.
                </span>
                <span className="block text-muted-foreground/60 text-xs normal-case tracking-normal font-normal mt-1.5 italic">
                  Press record → save your clip → rename it → reuse it from your library anytime.
                </span>
              </button>

              <button
                onClick={() => onStart("library")}
                className="w-full px-8 py-4 rounded-xl border border-primary/40 text-foreground font-display font-bold text-sm uppercase tracking-[0.12em] hover:bg-primary/10 transition-all duration-500 text-left"
              >
                <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mb-0.5">Your personal unconscious programming vault.</span>
                Identity Library
                <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mt-1">
                  Mix, match, and build custom sessions from what's working.
                </span>
              </button>
            </div>

            <p className="text-center text-foreground font-display text-sm tracking-[0.1em] pt-2">
              Do this for 30 days. Then tell me what changed.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ABOUT — Always visible accordion cards at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="w-full max-w-2xl space-y-4 mt-12"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">About</p>

        {/* Card 1: Why Do This? */}
        <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden">
          <button
            onClick={() => toggleCard("why")}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-1">01</p>
              <h3 className="font-display font-bold text-lg text-foreground tracking-[0.05em]">Why Do This?</h3>
              <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">The relevance. Why this matters.</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${expandedCard === "why" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedCard === "why" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4 text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                  <p>
                    Your unconscious mind is running your life on autopilot. Right now. 24/7.
                    Most of that programming was installed before you were 7. You didn't choose it. But it's choosing your results.
                  </p>
                  <p>
                    Have you ever tried affirmations and felt like you were lying to yourself?
                    Or listened to someone else's hypnosis audio and couldn't quite… trust it?
                  </p>
                  <p className="text-foreground font-medium">
                    There's a reason. Your unconscious mind already has a voice. YOUR voice.
                    And it's been running on programming you never chose.
                  </p>
                  <p>This tool lets you take that back.</p>
                  <div className="pt-3 border-t border-border/50">
                    <p className="italic text-foreground">
                      "The subconscious mind makes no distinction between constructive and destructive thought impulses. It works with the material we feed it through our thought impulses."
                    </p>
                    <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">— Napoleon Hill</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card 2: What This Is */}
        <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden">
          <button
            onClick={() => toggleCard("what")}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-1">02</p>
              <h3 className="font-display font-bold text-lg text-foreground tracking-[0.05em]">What This Is</h3>
              <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">The tool. What you're building.</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${expandedCard === "what" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedCard === "what" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4 text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                  <p>
                    This is an unconscious conditioning tool. You're going to create an audio file
                    of your own voice — your new internal dialogue — layered over a 417Hz frequency
                    that primes your brain for change.
                  </p>
                  <p>
                    Record your identity statements in first person ("I am now…") and third person
                    ("[Your name] is now…"). Your brain accepts your own voice without resistance —
                    it sounds like the voice you already think with.
                  </p>
                  <p className="text-foreground font-medium">
                    Not motivation. Not willpower. Unconscious reprogramming.
                  </p>
                  <p>
                    This tool is designed to support the personal development work you're already doing — not replace it. It's a conditioning tool that works on the unconscious level to reduce internal resistance and align your nervous system with the outcomes you're pursuing. Used consistently, it's one of the most powerful supplements to any growth journey.
                  </p>
                  <div className="pt-3 border-t border-border/50">
                    <p className="italic text-foreground">
                      "You act and feel not according to what things are really like, but according to the image your mind holds of what they're like. Change the self-image and you change the personality and the behavior."
                    </p>
                    <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">— Maxwell Maltz, Psycho-Cybernetics</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card 3: How This Works */}
        <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden">
          <button
            onClick={() => toggleCard("how")}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-1">03</p>
              <h3 className="font-display font-bold text-lg text-foreground tracking-[0.05em]">How This Works</h3>
              <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">The steps. What you're going to do.</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${expandedCard === "how" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedCard === "how" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3">
                  {steps.map((step, i) => (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-primary font-display font-bold text-sm leading-none mt-1 flex-shrink-0">
                        {step.number}
                      </span>
                      <div>
                        <h4 className="font-display font-bold text-sm text-foreground tracking-[0.05em]">
                          {step.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 normal-case tracking-normal">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div className="pt-3 border-t border-border/50 mt-3">
                    <p className="text-xs italic text-muted-foreground normal-case tracking-normal">
                      "When you change your thoughts, you change your brain chemistry — and your body begins to believe it's living in a new reality. Repetition of new thought and emotion is how we install a new program into the unconscious."
                    </p>
                    <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">— Dr. Joe Dispenza, Breaking the Habit of Being Yourself</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroSection;

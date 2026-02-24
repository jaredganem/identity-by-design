import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Headphones, Moon, ArrowRight, X, Bookmark, Library, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ONBOARDING_KEY = "ibd-onboarding-seen";

const steps = [
  {
    icon: Mic,
    title: "Record Your Identity",
    description: "Script powerful \"I am now…\" statements and record them in your own voice. Your unconscious mind already trusts it.",
  },
  {
    icon: Bookmark,
    title: "Clips Auto-Save",
    description: "Every recording is saved to your Identity Library automatically. You can reuse, rename, and remix them anytime.",
  },
  {
    icon: Headphones,
    title: "Build Your Installation",
    description: "Layer your voice over 417Hz healing frequency with reverb and looping. Add soundscapes for a sleep-ready experience.",
  },
  {
    icon: Library,
    title: "Mix From Your Library",
    description: "Open the Library to combine your best clips into a single track. The AI can even select them for you based on your goal.",
  },
  {
    icon: Moon,
    title: "Sleep & Transform",
    description: "Use the Sleep Timer and drift off. Your subconscious absorbs the programming all night. 30 nights to rewire your identity.",
  },
];

const OnboardingWalkthrough = () => {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!show) return null;

  const current = steps[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-background/90 backdrop-blur-md"
          onClick={dismiss}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-3xl border border-primary/30 bg-card p-8 shadow-glow"
        >
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/50" : "w-4 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Visual */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, damping: 15 }}
                className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center"
              >
                <Icon className="w-10 h-10 text-primary" />
              </motion.div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-primary font-display">
                  Step {step + 1} of {steps.length}
                </p>
                <h3 className="font-display text-xl font-bold text-foreground tracking-[0.06em]">
                  {current.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                  {current.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={next}
            className="mt-6 w-full px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em] flex items-center justify-center gap-2"
          >
            {step < steps.length - 1 ? (
              <>
                Next <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              "Let's Build →"
            )}
          </motion.button>

          {step < steps.length - 1 && (
            <button
              onClick={dismiss}
              className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors normal-case tracking-normal"
            >
              Skip walkthrough
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingWalkthrough;

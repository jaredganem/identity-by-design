import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NeuralNetwork from "@/components/SacredGeometry";
import HeroSection from "@/components/HeroSection";
import AffirmationRecorder from "@/components/AffirmationRecorder";
import TrackBuilder from "@/components/TrackBuilder";
import FreestyleRecorder from "@/components/FreestyleRecorder";
import FreestyleTrackBuilder from "@/components/FreestyleTrackBuilder";
import AffirmationLibrary from "@/components/AffirmationLibrary";
import ModularTrackBuilder from "@/components/ModularTrackBuilder";
import GoDeeper from "@/components/GoDeeper";
import Player from "@/components/Player";
import IdentityChallenge from "@/components/IdentityChallenge";
import OnboardingWalkthrough from "@/components/OnboardingWalkthrough";
import Footer from "@/components/Footer";
import InstallBanner from "@/components/InstallBanner";
import { trackPageView, trackEvent } from "@/lib/analytics";
import { getAllAffirmationsSync as getAllAffirmations } from "@/lib/cloudStorage";
import CompletionShareCTA from "@/components/CompletionShareCTA";
import UpgradeNudge from "@/components/UpgradeNudge";
import TrialBanner from "@/components/TrialBanner";
import LeadCaptureGate, { hasLeadCaptured } from "@/components/LeadCaptureGate";
import PromoBanner from "@/components/PromoBanner";

type Mode = "guided" | "freestyle" | "library" | "player" | "challenge";

const modeHeaders: Record<string, { title: string; highlight: string; subtitle: string; quote?: { text: string; author: string } }> = {
  guided: {
    title: "Guided",
    highlight: "Identity Blueprint",
    subtitle: "A structured 12-affirmation sequence across the core areas of a man's life. Read, record, and install.",
    quote: {
      text: "The subconscious mind makes no distinction between constructive and destructive thought impulses. It works with the material we feed it through our thought impulses.",
      author: "Napoleon Hill",
    },
  },
  freestyle: {
    title: "Custom",
    highlight: "Identity Script",
    subtitle: "Freestyle recording for men who already know their affirmations. Record as many as you want. Build your exact identity code.",
    quote: {
      text: "You will become as small as your controlling desire, or as great as your dominant aspiration.",
      author: "James Allen, As A Man Thinketh",
    },
  },
  library: {
    title: "Identity",
    highlight: "Library",
    subtitle: "Your personal unconscious programming vault. Mix, match, and build custom sessions from what's working.",
    quote: {
      text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.",
      author: "Carl Jung",
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const Index = () => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [recordings, setRecordings] = useState<Record<string, Blob>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [clips, setClips] = useState<Blob[]>([]);
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);
  const [libraryCount, setLibraryCount] = useState(0);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  useEffect(() => {
    trackPageView("/");
    // Check library for returning user experience
    getAllAffirmations().then((items) => setLibraryCount(items.length)).catch(() => {});
  }, []);

  const handleBack = () => {
    setMode(null);
    setRecordings({});
    setCustomTexts({});
    setClips([]);
  };

  const handleModeSelect = (m: Mode) => {
    setMode(m);
    trackEvent("mode_selected", { mode: m });
  };

  const handleLeadClose = () => {
    setShowLeadCapture(false);
    trackEvent("lead_gate_closed", { pending_mode: pendingMode });
    setPendingMode(null);
  };

  const handleLeadSuccess = () => {
    setShowLeadCapture(false);
    trackEvent("lead_gate_completed", { mode: pendingMode });
    if (pendingMode) {
      setMode(pendingMode);
      trackEvent("mode_selected", { mode: pendingMode });
      setPendingMode(null);
    }
  };

  return (
    <div className="min-h-screen bg-sacred relative overflow-hidden">
      <NeuralNetwork />
      <OnboardingWalkthrough />

      <AnimatePresence mode="wait">
        {!mode ? (
          <HeroSection key="hero" libraryCount={libraryCount} onStart={handleModeSelect} />
        ) : mode === "player" ? (
          <Player key="player" onBack={handleBack} />
        ) : mode === "challenge" ? (
          <motion.div
            key="challenge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl mx-auto px-6 py-12 space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Self-Mastery for Men™
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground">
                The Identity{" "}
                <span className="text-primary text-glow">Challenge</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto normal-case tracking-normal">
                Progressive identity installation. Complete each level to unlock the next.
                Days are logged automatically when you record or listen.
              </p>
            </motion.div>
            <IdentityChallenge />
            <div className="text-center pt-4">
              <button
                onClick={handleBack}
                className="min-h-[44px] px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl mx-auto px-6 py-12 space-y-8"
          >
            <TrialBanner />
            {/* Header with stagger */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="text-center space-y-3"
            >
              <motion.p variants={staggerItem} className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Self-Mastery for Men™
              </motion.p>
              <motion.h2 variants={staggerItem} className="font-display text-3xl md:text-4xl text-foreground">
                {modeHeaders[mode].title}{" "}
                <span className="text-primary text-glow">{modeHeaders[mode].highlight}</span>
              </motion.h2>
              <motion.p variants={staggerItem} className="text-sm text-muted-foreground max-w-lg mx-auto normal-case tracking-normal">
                {modeHeaders[mode].subtitle}
              </motion.p>
            </motion.div>

            {/* Authority quote */}
            {modeHeaders[mode].quote && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center px-4"
              >
                <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
                  "{modeHeaders[mode].quote!.text}"
                  <br />
                  <span className="text-foreground not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">
                    — {modeHeaders[mode].quote!.author}
                  </span>
                </p>
              </motion.div>
            )}

            {/* Pattern Interrupt */}
            {(mode === "guided" || mode === "freestyle") && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-center px-6 py-6 space-y-4"
              >
                <div className="space-y-2">
                  <p className="text-base text-foreground leading-relaxed normal-case tracking-normal">
                    You already know what you're capable of.
                  </p>
                  <p className="text-base text-foreground leading-relaxed normal-case tracking-normal">
                    You've known for a while.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                    Something keeps getting in the way —
                    <br />
                    not lack of effort, not lack of knowledge.
                  </p>
                  <p className="text-sm text-foreground font-medium leading-relaxed normal-case tracking-normal mt-3">
                    The version of you that you know you can be
                    <br />
                    is already in there.
                  </p>
                  <p className="text-sm text-primary font-display tracking-[0.08em] mt-3">
                    This is how you install him.
                  </p>
                </div>

                <div className="pt-3 border-t border-border/20">
                  <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
                    "You act and feel not according to what things are really like, but according to the image your mind holds of what they're like. Change the self-image and you change the personality and the behavior."
                    <br />
                    <span className="text-primary not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">
                      — Maxwell Maltz, Psycho-Cybernetics
                    </span>
                  </p>
                </div>
              </motion.div>
            )}

            {mode === "guided" ? (
              <>
                {/* Session completion celebration */}
                {Object.keys(recordings).length === 12 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center py-8 space-y-3"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="text-4xl"
                    >
                      🏆
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="font-display text-2xl text-primary text-glow"
                    >
                      Identity Blueprint Complete
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-sm text-muted-foreground normal-case tracking-normal"
                    >
                      All 12 affirmations recorded. Now build your nightly installation track below.
                    </motion.p>
                    <CompletionShareCTA />
                    <UpgradeNudge />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                      className="pt-2"
                    >
                      <GoDeeper />
                    </motion.div>
                  </motion.div>
                )}
                <AffirmationRecorder
                  recordings={recordings}
                  onRecordingsChange={setRecordings}
                  customTexts={customTexts}
                  onCustomTextsChange={setCustomTexts}
                  onLibraryChanged={() => setLibraryRefreshKey((k) => k + 1)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center px-6 py-4 rounded-2xl border border-border/30 bg-secondary/10 my-2"
                >
                  <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
                    "When you change your thoughts, you change your brain chemistry — and your body begins to believe it's living in a new reality. Repetition of new thought and emotion is how we install a new program into the unconscious."
                    <br />
                    <span className="text-primary not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">
                      — Dr. Joe Dispenza, Breaking the Habit of Being Yourself
                    </span>
                  </p>
                </motion.div>
                <TrackBuilder recordings={recordings} />
              </>
            ) : mode === "freestyle" ? (
              <>
                <FreestyleRecorder clips={clips} onClipsChange={setClips} onLibraryChanged={() => setLibraryRefreshKey((k) => k + 1)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center px-6 py-4 rounded-2xl border border-border/30 bg-secondary/10 my-2"
                >
                  <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
                    "When you change your thoughts, you change your brain chemistry — and your body begins to believe it's living in a new reality. Repetition of new thought and emotion is how we install a new program into the unconscious."
                    <br />
                    <span className="text-primary not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">
                      — Dr. Joe Dispenza, Breaking the Habit of Being Yourself
                    </span>
                  </p>
                </motion.div>
                <FreestyleTrackBuilder clips={clips} />
              </>
            ) : (
              <>
                <ModularTrackBuilder refreshKey={libraryRefreshKey} />
              </>
            )}

            {/* Back button */}
            <div className="text-center pt-4">
              <button
                onClick={handleBack}
                className="min-h-[44px] px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PromoBanner />
      <InstallBanner />
      <Footer />
      <LeadCaptureGate
        open={showLeadCapture}
        onClose={handleLeadClose}
        onSuccess={handleLeadSuccess}
      />
    </div>
  );
};

export default Index;

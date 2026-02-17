import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NeuralNetwork from "@/components/SacredGeometry";
import HeroSection from "@/components/HeroSection";
import AffirmationRecorder from "@/components/AffirmationRecorder";
import TrackBuilder from "@/components/TrackBuilder";
import FreestyleRecorder from "@/components/FreestyleRecorder";
import FreestyleTrackBuilder from "@/components/FreestyleTrackBuilder";
import AffirmationLibrary from "@/components/AffirmationLibrary";
import ModularTrackBuilder from "@/components/ModularTrackBuilder";
import Footer from "@/components/Footer";

type Mode = "guided" | "freestyle" | "library";

const modeHeaders: Record<Mode, { title: string; highlight: string; subtitle: string; quote?: { text: string; author: string } }> = {
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
      text: "The ancestor of every action is a thought.",
      author: "Ralph Waldo Emerson",
    },
  },
};

const Index = () => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [recordings, setRecordings] = useState<Record<string, Blob>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [clips, setClips] = useState<Blob[]>([]);
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

  const handleBack = () => {
    setMode(null);
    setRecordings({});
    setCustomTexts({});
    setClips([]);
  };

  return (
    <div className="min-h-screen bg-sacred relative overflow-hidden">
      <NeuralNetwork />

      <AnimatePresence mode="wait">
        {!mode ? (
          <HeroSection key="hero" onStart={(m) => setMode(m)} />
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl mx-auto px-6 py-12 space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Self-Mastery for Men™
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground">
                {modeHeaders[mode].title}{" "}
                <span className="text-primary text-glow">{modeHeaders[mode].highlight}</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto normal-case tracking-normal">
                {modeHeaders[mode].subtitle}
              </p>
            </div>

            {/* Authority quote */}
            {modeHeaders[mode].quote && (
              <div className="text-center px-4">
                <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
                  "{modeHeaders[mode].quote!.text}"
                  <br />
                  <span className="text-foreground not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">
                    — {modeHeaders[mode].quote!.author}
                  </span>
                </p>
              </div>
            )}

            {/* Authority Quote — Before Recording */}
            {(mode === "guided" || mode === "freestyle") && (
              <div className="text-center px-4">
                <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
                  "You act and feel not according to what things are really like, but according to the image your mind holds of what they're like. Change the self-image and you change the personality and the behavior."
                  <br />
                  <span className="text-primary not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">
                    — Maxwell Maltz, Psycho-Cybernetics
                  </span>
                </p>
              </div>
            )}

            {mode === "guided" ? (
              <>
                <AffirmationRecorder
                  recordings={recordings}
                  onRecordingsChange={setRecordings}
                  customTexts={customTexts}
                  onCustomTextsChange={setCustomTexts}
                  onLibraryChanged={() => setLibraryRefreshKey((k) => k + 1)}
                />
                {/* Authority Quote — Before Track Builder */}
                <div className="text-center px-4">
                  <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
                    "When you change your thoughts, you change your brain chemistry — and your body begins to believe it's living in a new reality. Repetition of new thought and emotion is how we install a new program into the unconscious."
                    <br />
                    <span className="text-primary not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">
                      — Dr. Joe Dispenza, Breaking the Habit of Being Yourself
                    </span>
                  </p>
                </div>
                <TrackBuilder recordings={recordings} />
              </>
            ) : mode === "freestyle" ? (
              <>
                <FreestyleRecorder clips={clips} onClipsChange={setClips} onLibraryChanged={() => setLibraryRefreshKey((k) => k + 1)} />
                {/* Authority Quote — Before Track Builder */}
                <div className="text-center px-4">
                  <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
                    "When you change your thoughts, you change your brain chemistry — and your body begins to believe it's living in a new reality. Repetition of new thought and emotion is how we install a new program into the unconscious."
                    <br />
                    <span className="text-primary not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">
                      — Dr. Joe Dispenza, Breaking the Habit of Being Yourself
                    </span>
                  </p>
                </div>
                <FreestyleTrackBuilder clips={clips} />
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-gradient-card border border-border">
                  <p className="text-sm text-muted-foreground mb-4 normal-case tracking-normal">
                    Your saved identity statements. Build a new installation by picking favorites from different categories.
                  </p>
                  <AffirmationLibrary refreshKey={libraryRefreshKey} />
                </div>
                <ModularTrackBuilder refreshKey={libraryRefreshKey} />
              </>
            )}

            {/* Back button */}
            <div className="text-center pt-4">
              <button
                onClick={handleBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;

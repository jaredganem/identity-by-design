import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SacredGeometry from "@/components/SacredGeometry";
import HeroSection from "@/components/HeroSection";
import AffirmationRecorder from "@/components/AffirmationRecorder";
import TrackBuilder from "@/components/TrackBuilder";
import FreestyleRecorder from "@/components/FreestyleRecorder";
import FreestyleTrackBuilder from "@/components/FreestyleTrackBuilder";
import AffirmationLibrary from "@/components/AffirmationLibrary";
import ModularTrackBuilder from "@/components/ModularTrackBuilder";

type Mode = "guided" | "freestyle" | "library";

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
      <SacredGeometry />

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
            className="relative z-10 max-w-2xl mx-auto px-6 py-12 space-y-12"
          >
            {/* Header */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
                Self-Mastery for Men™
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground">
                {mode === "guided" ? (
                  <>Record Your <span className="text-primary text-glow">Affirmations</span></>
                ) : mode === "freestyle" ? (
                  <>Create Your <span className="text-primary text-glow">Own</span></>
                ) : (
                  <>My <span className="text-primary text-glow">Library</span></>
                )}
              </h2>
            </div>

            {mode === "guided" ? (
              <>
                <AffirmationRecorder
                  recordings={recordings}
                  onRecordingsChange={setRecordings}
                  customTexts={customTexts}
                  onCustomTextsChange={setCustomTexts}
                  onLibraryChanged={() => setLibraryRefreshKey((k) => k + 1)}
                />
                <TrackBuilder recordings={recordings} />
              </>
            ) : mode === "freestyle" ? (
              <>
                <FreestyleRecorder clips={clips} onClipsChange={setClips} onLibraryChanged={() => setLibraryRefreshKey((k) => k + 1)} />
                <FreestyleTrackBuilder clips={clips} />
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-gradient-card border border-border">
                  <p className="text-sm text-muted-foreground mb-4">
                    Your saved affirmations. Build a new track by picking favorites from different categories.
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
    </div>
  );
};

export default Index;

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SacredGeometry from "@/components/SacredGeometry";
import HeroSection from "@/components/HeroSection";
import AffirmationRecorder from "@/components/AffirmationRecorder";
import TrackBuilder from "@/components/TrackBuilder";
import FreestyleRecorder from "@/components/FreestyleRecorder";
import FreestyleTrackBuilder from "@/components/FreestyleTrackBuilder";

type Mode = "guided" | "freestyle";

const Index = () => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [recordings, setRecordings] = useState<Record<string, Blob>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});
  const [clips, setClips] = useState<Blob[]>([]);

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
                Better Life Hypnosis &amp; Meditations
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground">
                {mode === "guided" ? (
                  <>Record Your <span className="text-primary text-glow">Affirmations</span></>
                ) : (
                  <>Freestyle <span className="text-primary text-glow">Recording</span></>
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
                />
                <TrackBuilder recordings={recordings} />
              </>
            ) : (
              <>
                <FreestyleRecorder clips={clips} onClipsChange={setClips} />
                <FreestyleTrackBuilder clips={clips} />
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

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SacredGeometry from "@/components/SacredGeometry";
import HeroSection from "@/components/HeroSection";
import AffirmationRecorder from "@/components/AffirmationRecorder";
import TrackBuilder from "@/components/TrackBuilder";

const Index = () => {
  const [started, setStarted] = useState(false);
  const [recordings, setRecordings] = useState<Record<string, Blob>>({});
  const [customTexts, setCustomTexts] = useState<Record<string, string>>({});

  return (
    <div className="min-h-screen bg-sacred relative overflow-hidden">
      <SacredGeometry />

      <AnimatePresence mode="wait">
        {!started ? (
          <HeroSection key="hero" onStart={() => setStarted(true)} />
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
                Record Your <span className="text-primary text-glow">Affirmations</span>
              </h2>
            </div>

            {/* Affirmation recorder */}
            <AffirmationRecorder
              recordings={recordings}
              onRecordingsChange={setRecordings}
              customTexts={customTexts}
              onCustomTextsChange={setCustomTexts}
            />

            {/* Track builder */}
            <TrackBuilder recordings={recordings} />

            {/* Back button */}
            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setStarted(false);
                  setRecordings({});
                  setCustomTexts({});
                }}
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

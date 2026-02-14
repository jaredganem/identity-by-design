import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SacredGeometry from "@/components/SacredGeometry";
import HeroSection from "@/components/HeroSection";
import PromptSelector from "@/components/PromptSelector";
import RecordingStudio from "@/components/RecordingStudio";

const Index = () => {
  const [started, setStarted] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

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
                Recording Studio
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground">
                Create Your <span className="text-primary text-glow">Sacred Track</span>
              </h2>
            </div>

            {/* Prompt selector */}
            <PromptSelector
              onSelect={setSelectedPrompt}
              selectedPrompt={selectedPrompt}
            />

            {/* Recording studio */}
            <RecordingStudio selectedPrompt={selectedPrompt} />

            {/* Back button */}
            <div className="text-center pt-4">
              <button
                onClick={() => { setStarted(false); setSelectedPrompt(null); }}
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

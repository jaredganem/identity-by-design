import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";

const FreeWorkshopCTA = () => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className="mt-10 w-full max-w-lg"
      >
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Free Training
          </p>
          <h3 className="font-display text-xl md:text-2xl text-foreground tracking-[0.05em]">
            Claim Your Free{" "}
            <span className="text-primary text-glow">Identity Shifting</span>{" "}
            Workshop
          </h3>
          <p className="text-sm text-muted-foreground normal-case tracking-normal">
            Learn the exact framework that rewires your unconscious autopilot — in under 30 minutes.
          </p>

          <button
            onClick={() => setShowVideo(true)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-shadow duration-500"
          >
            <Play className="w-4 h-4" />
            Watch Now — It's Free
          </button>

          <div>
            <a
              href="https://www.youtube.com/@SelfMasteryForMen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 normal-case tracking-normal"
            >
              Subscribe for more on YouTube
            </a>
          </div>
        </div>
      </motion.div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div
              className="absolute inset-0 bg-background/90 backdrop-blur-sm"
              onClick={() => setShowVideo(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-card"
            >
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/K77Gj-aKe-U?si=Hkm7CR6JrdiTK5H2&autoplay=1"
                title="Free Identity Shifting Workshop"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FreeWorkshopCTA;

import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LeadCaptureGate, { hasLeadCaptured } from "@/components/LeadCaptureGate";

const FreeWorkshopCTA = () => {
  const [showVideo, setShowVideo] = useState(false);
  const [showGate, setShowGate] = useState(false);

  const handleClick = () => {
    if (hasLeadCaptured()) {
      setShowVideo(true);
    } else {
      setShowGate(true);
    }
  };

  const handleGateSuccess = () => {
    setShowGate(false);
    setShowVideo(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className="mt-10 w-full max-w-lg"
      >
        <button
          onClick={handleClick}
          className="w-full rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3 cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
        >
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
          <span className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em] shadow-glow">
            <Play className="w-4 h-4" />
            Watch Now — It's Free
          </span>
        </button>
      </motion.div>

      {/* Lead Capture Gate */}
      <LeadCaptureGate
        open={showGate}
        onClose={() => setShowGate(false)}
        onSuccess={handleGateSuccess}
      />

      {/* Video Dialog (shown after lead captured) */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="bg-card border-border/50 max-w-3xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Free Identity Shifting Workshop</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/K77Gj-aKe-U?si=Hkm7CR6JrdiTK5H2&autoplay=1"
              title="Free Identity Shifting Workshop"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="p-4 text-center">
            <a
              href="https://www.youtube.com/@SelfMasteryForMen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-destructive text-destructive-foreground font-display font-bold text-sm uppercase tracking-[0.08em] hover:opacity-90 transition-opacity"
            >
              Subscribe for More on YouTube →
            </a>
            <a
              href="https://youtu.be/K77Gj-aKe-U"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 normal-case tracking-normal"
            >
              Watch on YouTube instead
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FreeWorkshopCTA;
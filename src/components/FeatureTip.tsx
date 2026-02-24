import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Lightbulb } from "lucide-react";

interface FeatureTipProps {
  title: string;
  tips: string[];
  defaultOpen?: boolean;
}

const FeatureTip = ({ title, tips, defaultOpen = false }: FeatureTipProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left min-h-[44px]"
      >
        <span className="flex items-center gap-2 text-sm font-display font-bold text-foreground tracking-[0.04em]">
          <Lightbulb className="w-4 h-4 text-primary shrink-0" />
          {title}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="px-4 pb-4 space-y-2.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed normal-case tracking-normal">
                  <span className="text-primary font-bold mt-0.5 shrink-0">→</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FeatureTip;

/** Pre-built tip sets for each feature area */

export const RECORDER_TIPS = {
  title: "Pro Tips: Recording",
  tips: [
    "Speak with conviction — your unconscious mind responds to certainty, not wishful thinking.",
    "Each clip auto-saves to your Identity Library. You can reuse them later to build custom installations.",
    "If you don't like a take, just re-record. Only your best version gets saved.",
    "Use 'I am now…' phrasing. Present tense tells your brain it's already real.",
  ],
};

export const TRACK_BUILDER_TIPS = {
  title: "Pro Tips: Track Builder",
  tips: [
    "Set the loop count higher (3–5x) for deeper subconscious absorption during sleep.",
    "The reverb slider adds a 'trance-like' quality that bypasses your critical mind. Start around 40%.",
    "Layer your voice over a soundscape — brown noise or ocean waves work best for sleep sessions.",
    "Hit 'Save My Mix' to lock in your perfect settings. They'll carry over every time.",
  ],
};

export const PLAYER_TIPS = {
  title: "Pro Tips: Identity Player",
  tips: [
    "Use the Sleep Timer to let it play as you drift off — your unconscious absorbs it all night.",
    "Loop mode 'All' cycles through your entire library. 'One' repeats a single track for deep focus.",
    "Your phone's lock screen controls will work — the audio keeps playing even when the screen goes dark.",
    "Add a soundscape under your voice for an immersive experience. Brown noise is the most popular.",
  ],
};

export const LIBRARY_TIPS = {
  title: "Pro Tips: Identity Library",
  tips: [
    "Every recording you make gets auto-saved here. This is your vault of identity programming.",
    "Tap any saved clip to rename it — give it a name that resonates (e.g., 'Unstoppable Confidence').",
    "Use the Track Builder to combine your best clips into a single nightly installation.",
    "The AI can auto-select the most impactful clips for you if you tell it your goal.",
  ],
};

export const SLEEP_TIPS = {
  title: "Pro Tips: Sleep Installation",
  tips: [
    "Use headphones — even low volume is enough. Your unconscious hears everything.",
    "Set a 30-minute timer minimum. The first 20 minutes of sleep are the most programmable.",
    "Commit to 30 nights. Research shows new neural pathways need consistent repetition to form.",
    "Keep the volume just above a whisper. Louder isn't better — subtle is more effective.",
  ],
};

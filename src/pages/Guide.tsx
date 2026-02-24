import { motion } from "framer-motion";
import { ChevronLeft, Lightbulb, Mic, Headphones, Moon, Library, Sparkles, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import {
  RECORDER_TIPS,
  TRACK_BUILDER_TIPS,
  PLAYER_TIPS,
  LIBRARY_TIPS,
  SLEEP_TIPS,
} from "@/components/FeatureTip";

const sections = [
  {
    icon: Mic,
    emoji: "🎙️",
    title: "Recording Your Identity",
    description: "Your voice is the key. Here's how to get the most out of every recording session.",
    tips: RECORDER_TIPS.tips,
  },
  {
    icon: Headphones,
    emoji: "🎧",
    title: "Building Your Track",
    description: "Turn raw recordings into a polished subconscious installation program.",
    tips: TRACK_BUILDER_TIPS.tips,
  },
  {
    icon: Library,
    emoji: "📚",
    title: "Your Identity Library",
    description: "Every clip you record is saved. Here's how to make the most of your collection.",
    tips: LIBRARY_TIPS.tips,
  },
  {
    icon: Sparkles,
    emoji: "▶️",
    title: "The Identity Player",
    description: "Your personal reprogramming player. Built for conscious and sleep-state listening.",
    tips: PLAYER_TIPS.tips,
  },
  {
    icon: Moon,
    emoji: "🌙",
    title: "Sleep Installation",
    description: "The most powerful window for identity change is the first 20 minutes of sleep.",
    tips: SLEEP_TIPS.tips,
  },
];

const quickStart = [
  { step: "1", text: "Choose Guided or Freestyle mode and record your identity statements in your own voice." },
  { step: "2", text: "Build your track — set loops, reverb, frequency, and soundscape to create your custom installation." },
  { step: "3", text: "Save to your library. Your clips are stored and can be remixed anytime." },
  { step: "4", text: "Open the Player, set the Sleep Timer, put on headphones, and let it play as you drift off." },
  { step: "5", text: "Do this for 30 nights. Watch your internal dialogue — and your reality — begin to shift." },
];

const Guide = () => {
  return (
    <div className="min-h-screen bg-sacred relative overflow-hidden">
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to app
          </Link>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Self-Mastery for Men™
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-foreground">
            How to Use{" "}
            <span className="text-primary text-glow">Identity by Design</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto normal-case tracking-normal">
            Everything you need to know to start reprogramming your identity tonight.
          </p>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-primary/30 bg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground tracking-[0.06em]">
              Quick Start (5 Steps)
            </h2>
          </div>
          <ol className="space-y-3">
            {quickStart.map((item) => (
              <li key={item.step} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {item.step}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Feature sections */}
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.05 }}
              className="rounded-2xl border border-border/50 bg-card/50 p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground tracking-[0.06em]">
                    {section.title}
                  </h2>
                  <p className="text-xs text-muted-foreground normal-case tracking-normal">
                    {section.description}
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 pl-1">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                    <span className="text-primary font-bold mt-0.5 shrink-0">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-3 pb-8"
        >
          <p className="text-sm text-muted-foreground italic normal-case tracking-normal">
            "The only person you are destined to become is the person you decide to be."
            <br />
            <span className="text-primary not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">
              — Ralph Waldo Emerson
            </span>
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em]"
          >
            Start Building →
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Guide;

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Headphones, Play, Flame, Trophy, Calendar, Mic, Pause } from "lucide-react";
import GoDeeper from "@/components/GoDeeper";
import IdentityChallenge from "@/components/IdentityChallenge";
import { Progress } from "@/components/ui/progress";
import FreeWorkshopCTA from "@/components/FreeWorkshopCTA";
import jaredPhoto from "@/assets/jared-before-after.jpeg";
import { getProgressStats, isReturningUser } from "@/lib/streakTracker";
import { getChallengeStatus, CHALLENGE_LEVELS } from "@/lib/challengeTracker";
import { getSavedTracks, type SavedTrack } from "@/lib/savedTrackStorage";
import { audioEngine } from "@/lib/audioEngine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HeroSectionProps {
  onStart: (mode: "guided" | "freestyle" | "library" | "player" | "challenge") => void;
  libraryCount?: number;
}

const steps = [
  {
    number: "01",
    title: "Write Your Identity Code",
    description:
      'Write 2–5 "I am now…" statements in each major life category: Health, Wealth, Relationships, Career/Mission, and Personal Character. State them in the positive, present tense — as if it\'s already done.',
  },
  {
    number: "02",
    title: "Record in Your Own Voice",
    description:
      'Record each statement first in first person ("I am now…") then again in third person ("[Your name] is now…"). Your brain accepts your own voice like a sponge — bypassing the resistance you\'d feel from a stranger\'s voice.',
  },
  {
    number: "03",
    title: "Layer Over 417 Hz",
    description:
      "The app layers your voice over a 417 Hz frequency — known to heal, balance, and promote change. It puts your brain into that sweet spot between awake and asleep.",
  },
  {
    number: "04",
    title: "Add Depth & Set Your Loop",
    description:
      "Bring your voice volume down, add a slight echo so it sounds spacey and trance-like. Set how many times your affirmations loop — 20 to 30 minutes is the sweet spot.",
  },
  {
    number: "05",
    title: "Fall Asleep & Transform",
    description:
      "Listen as you drift off to sleep. Set the session timer so it doesn't interrupt your REM cycle. Within days, your internal dialogue starts mimicking what you recorded.",
  },
];

const HeroSection = ({ onStart, libraryCount = 0 }: HeroSectionProps) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [showModes, setShowModes] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof getProgressStats> | null>(null);
  const [challengeStatus, setChallengeStatus] = useState(getChallengeStatus());
  const [savedTrack, setSavedTrack] = useState<SavedTrack | null>(null);
  const [isPlayingSaved, setIsPlayingSaved] = useState(false);
  const savedPlayerRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (isReturningUser()) {
      setStats(getProgressStats());
      setChallengeStatus(getChallengeStatus());
    }
    getSavedTracks().then((tracks) => {
      if (tracks.length > 0) setSavedTrack(tracks[0]);
    }).catch(() => {});
  }, []);

  const handlePlaySaved = async () => {
    if (!savedTrack) return;
    if (isPlayingSaved) {
      savedPlayerRef.current?.stop();
      setIsPlayingSaved(false);
      return;
    }
    const ctx = audioEngine.getContext();
    const buf = await ctx.decodeAudioData(await savedTrack.blob.arrayBuffer());
    const player = audioEngine.playBuffer(buf);
    savedPlayerRef.current = player;
    setIsPlayingSaved(true);
    import("@/lib/streakTracker").then(({ logActivity }) => logActivity("listen"));
    import("@/lib/challengeTracker").then(({ logChallengeDay }) => logChallengeDay());
    setTimeout(() => setIsPlayingSaved(false), buf.duration * 1000);
  };

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="flex flex-col items-center justify-center text-center relative z-10 px-6 py-12"
    >
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6"
      >
        Self-Mastery for Men™
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="font-display text-5xl md:text-7xl font-bold text-foreground mb-2 leading-tight tracking-[0.06em]"
      >
        Identity
        <br />
        <span className="text-primary text-glow">By Design</span>
        <span className="text-primary text-lg align-super ml-1">™</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-8"
      >
        Your Unconscious Autopilot Installer
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-muted-foreground max-w-xl text-base leading-relaxed mb-4"
      >
        Your custom unconscious reprogramming system. Script, record, and install your new identity — in your own voice, while you sleep.
      </motion.p>

      {/* Returning user — streak & challenge progress */}
      {stats ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-8 px-5 py-4 rounded-xl border border-primary/20 bg-primary/5 w-full max-w-md"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 text-center font-display">
            Welcome Back
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-xl font-display font-bold text-primary">{stats.currentStreak}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Day Streak</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Mic className="w-4 h-4 text-primary" />
                <span className="text-xl font-display font-bold text-foreground">{stats.totalRecordings}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Recordings</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xl font-display font-bold text-foreground">{stats.totalDaysActive}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Days Active</p>
            </div>
          </div>

          {/* Challenge progress — compact inline */}
          {challengeStatus.active && challengeStatus.level && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{challengeStatus.level.badge}</span>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-primary font-display">
                    {challengeStatus.level.name}
                  </p>
                </div>
                <span className="text-xs font-display font-bold text-primary">
                  {challengeStatus.daysCompleted}/{challengeStatus.totalDays}
                </span>
              </div>
              <Progress value={challengeStatus.progressPercent} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-1 text-center normal-case tracking-normal">
                {challengeStatus.completedToday
                  ? "✓ Today logged"
                  : challengeStatus.isLevelComplete
                  ? "🎉 Challenge complete!"
                  : "Record or listen to log today's session"}
              </p>
            </div>
          )}

          {/* Completed badges */}
          {challengeStatus.completedLevels.length > 0 && !challengeStatus.active && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <div className="flex items-center justify-center gap-2">
                {CHALLENGE_LEVELS.map((l) => (
                  <span
                    key={l.id}
                    className={`text-lg ${challengeStatus.completedLevels.includes(l.id) ? "" : "opacity-20 grayscale"}`}
                    title={l.name}
                  >
                    {l.badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          {stats.currentStreak > 0 && !challengeStatus.active && (
            <p className="text-xs text-center text-primary/80 mt-2 font-display tracking-wide">
              {stats.currentStreak >= 30
                ? "🏆 30-Day Identity Shift complete. Legend."
                : stats.currentStreak >= 7
                ? "🔥 You're on fire. Keep the momentum."
                : stats.isActiveToday
                ? "✓ Today's session logged."
                : "Don't break the chain — record today."}
            </p>
          )}
          {stats.currentStreak === 0 && stats.totalDaysActive > 0 && !challengeStatus.active && (
            <p className="text-xs text-center text-muted-foreground mt-2 italic normal-case tracking-normal">
              Your streak reset. Start a new one today.
            </p>
          )}
          {stats.longestStreak > stats.currentStreak && stats.longestStreak > 1 && (
            <p className="text-[10px] text-center text-muted-foreground mt-1">
              <Trophy className="w-3 h-3 inline mr-0.5" />
              Best streak: {stats.longestStreak} days
            </p>
          )}
          {/* Saved track quick replay */}
          {savedTrack && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <button
                onClick={handlePlaySaved}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {isPlayingSaved ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary ml-0.5" />}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{savedTrack.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {Math.round(savedTrack.durationSec / 60)} min • Tap to {isPlayingSaved ? "stop" : "play"}
                  </p>
                </div>
              </button>
            </div>
          )}
        </motion.div>
      ) : libraryCount > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-8 px-5 py-3 rounded-xl border border-primary/20 bg-primary/5"
        >
          <p className="text-sm text-primary font-display tracking-wide">
            Welcome back. Your library has{" "}
            <span className="font-bold">{libraryCount}</span>{" "}
            {libraryCount === 1 ? "track" : "tracks"}.
          </p>
        </motion.div>
      ) : null}

      {!stats && libraryCount === 0 && <div className="mb-6" />}

      {/* Napoleon Hill — Featured Quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95 }}
        className="max-w-lg mb-10 px-6 py-5 rounded-2xl border border-primary/30 bg-primary/5"
      >
        <p className="text-sm text-foreground italic leading-relaxed">
          "Any idea, plan, or purpose may be placed in the mind through repetition of thought."
        </p>
        <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">
          — Napoleon Hill, Think and Grow Rich
        </p>
      </motion.div>

      {/* Start Building CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setShowModes(true);
            setTimeout(() => {
              document.getElementById("choose-path")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          }}
          className="px-12 py-5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.15em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-shadow duration-500 flex items-center gap-2"
        >
          Start Building Your Identity
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-4 text-center"
      >
        <button
          onClick={() => setShowTutorial(true)}
          className="inline-flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors normal-case tracking-normal"
        >
          🎓 New to autosuggestion? <span className="underline underline-offset-2">Watch the tutorial video</span>
        </button>
      </motion.p>

      {/* Tutorial Video Dialog */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="bg-card border-border/50 max-w-3xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>What is Autosuggestion?</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/XYj8qBdpZ6A?si=SX5t3ivDHUIKpcgt&autoplay=1"
              title="What is Autosuggestion?"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="p-4 text-center">
            <a
              href="https://www.youtube.com/@SelfMasteryForMen?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-destructive text-destructive-foreground font-display font-bold text-sm uppercase tracking-[0.08em] hover:opacity-90 transition-opacity"
            >
              Subscribe for More on YouTube →
            </a>
            <a
              href="https://youtu.be/XYj8qBdpZ6A"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 normal-case tracking-normal"
            >
              Watch on YouTube instead
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Identity Challenge Dialog */}
      <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
        <DialogContent className="bg-card border-border/50 max-w-lg p-0 gap-0 overflow-hidden max-h-[85dvh] overflow-y-auto">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="font-display text-lg text-foreground">
              The Identity <span className="text-primary">Challenge</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground normal-case tracking-normal mt-1">
              Progressive identity installation. Days log automatically when you record or listen.
            </p>
          </DialogHeader>
          <div className="px-5 pb-5">
            <IdentityChallenge />
          </div>
        </DialogContent>
      </Dialog>

      {/* Choose Your Path — revealed on CTA click */}
      <AnimatePresence>
        {showModes && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5 }}
            id="choose-path"
            className="mt-8 w-full max-w-2xl space-y-4"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground text-center">
              Choose your path
            </p>

            <div className="space-y-3">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStart("guided")}
                className="w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-all duration-500 text-left"
              >
                <span className="block text-primary-foreground/70 text-xs normal-case tracking-normal font-normal mb-0.5">Don't know where to start? Use this.</span>
                Guided Identity Blueprint
                <span className="block text-primary-foreground/60 text-xs normal-case tracking-normal font-normal mt-1">
                  A structured 12-affirmation sequence across Health, Wealth, Relationships, Career & Character.
                </span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStart("freestyle")}
                className="w-full px-8 py-4 rounded-xl border border-primary/40 text-foreground font-display font-bold text-sm uppercase tracking-[0.12em] hover:bg-primary/10 transition-all duration-500 text-left"
              >
                <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mb-0.5">You already know your affirmations. Let's install them.</span>
                Custom Identity Script
                <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mt-1">
                  Freestyle recording for men who already know their affirmations. Record as many as you want. Build your exact identity code.
                </span>
                <span className="block text-muted-foreground/60 text-xs normal-case tracking-normal font-normal mt-1.5 italic">
                  Press record → save your clip → rename it → reuse it from your library anytime.
                </span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStart("library")}
                className="w-full px-8 py-4 rounded-xl border border-primary/40 text-foreground font-display font-bold text-sm uppercase tracking-[0.12em] hover:bg-primary/10 transition-all duration-500 text-left"
              >
                <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mb-0.5">Your personal unconscious programming vault.</span>
                Identity Library
                <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mt-1">
                  Mix, match, and build custom sessions from what's working.
                </span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStart("player")}
                className="w-full px-8 py-4 rounded-xl border border-accent/30 bg-accent/5 text-foreground font-display font-bold text-sm uppercase tracking-[0.12em] hover:bg-accent/10 transition-all duration-500 text-left"
              >
                <span className="block text-accent/70 text-xs normal-case tracking-normal font-normal mb-0.5 flex items-center gap-1">
                  <Headphones className="w-3 h-3" /> Listen to your programs
                </span>
                Identity Player
                <span className="block text-muted-foreground text-xs normal-case tracking-normal font-normal mt-1">
                  Play your saved affirmations with a visualizer. Loop, shuffle, and immerse.
                </span>
              </motion.button>
            </div>

            {/* Identity Challenge CTA with live streak */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-4"
            >
              <button
                onClick={() => setShowChallengeDialog(true)}
                className="w-full px-6 py-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-center space-y-2"
              >
                <p className="text-sm text-muted-foreground italic normal-case tracking-normal">
                  "They say it takes 21 days to build a habit…"
                </p>
                <p className="text-foreground font-display text-lg md:text-xl font-bold tracking-[0.08em]">
                  The Identity Challenge
                </p>
                {challengeStatus.active && challengeStatus.level ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm">{challengeStatus.level.badge}</span>
                      <span className="text-xs text-primary font-display">{challengeStatus.level.name}</span>
                      <span className="text-xs font-display font-bold text-primary">
                        {challengeStatus.daysCompleted}/{challengeStatus.totalDays}
                      </span>
                    </div>
                    <div className="max-w-xs mx-auto">
                      <Progress value={challengeStatus.progressPercent} className="h-1.5" />
                    </div>
                    {stats && stats.currentStreak > 0 && (
                      <div className="flex items-center justify-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-primary font-display font-bold">{stats.currentStreak} day streak</span>
                      </div>
                    )}
                  </div>
                ) : stats && stats.currentStreak > 0 ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-primary font-display font-bold">{stats.currentStreak} day streak</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground normal-case tracking-normal">1 → 7 → 30 → 365 days</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground normal-case tracking-normal">
                    Progressive levels from Day 1 to Day 365. Can you go the distance?
                  </p>
                )}
                <p className="text-[10px] text-primary/70 font-display tracking-wider">
                  TAP TO VIEW →
                </p>
              </button>
            </motion.div>

            <div className="text-center pt-3">
              <GoDeeper />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jared's Story */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="mt-10 max-w-lg px-6 py-5 rounded-2xl border border-border/50 bg-secondary/10 space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground text-center font-display">
          From the Founder
        </p>
        <div className="flex flex-row items-center gap-4">
          <img
            src={jaredPhoto}
            alt="Jared — before and after"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-cover flex-shrink-0"
          />
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm text-foreground leading-relaxed normal-case tracking-normal">
              I'd been to every personal development seminar, read every book — but inner conflicts were still holding me back. Then in 2019, I hit what many would consider rock bottom. This was the tool that began to change everything for me. And now I'm excited to bring it to you.
            </p>
            <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">
              — Jared Ganem, Lead Trainer
              <br />
              <span className="text-muted-foreground">Self-Mastery for Men™</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Free Workshop CTA */}
      <FreeWorkshopCTA />

      {/* ABOUT — Always visible accordion cards at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="w-full max-w-2xl space-y-4 mt-12"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">About</p>

        {/* Card 1: Why Do This? */}
        <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden">
          <button
            onClick={() => toggleCard("why")}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-1">01</p>
              <h3 className="font-display font-bold text-lg text-foreground tracking-[0.05em]">Why Do This?</h3>
              <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">Because willpower alone has never been enough</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${expandedCard === "why" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedCard === "why" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4 text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                  <p>
                    Your unconscious mind is running your life on autopilot. Right now. 24/7.
                    Most of that programming was installed before you were 7. You didn't choose it. But it's choosing your results.
                  </p>
                  <p>
                    Have you ever tried affirmations and felt like you were lying to yourself?
                    Or listened to someone else's hypnosis audio and couldn't quite… trust it?
                  </p>
                  <p className="text-foreground font-medium">
                    There's a reason. Your unconscious mind already has a voice. YOUR voice.
                    And it's been running on programming you never chose.
                  </p>
                  <p>This tool lets you take that back.</p>
                  <div className="pt-3 border-t border-border/50">
                    <p className="italic text-foreground">
                      "The subconscious mind makes no distinction between constructive and destructive thought impulses. It works with the material we feed it through our thought impulses."
                    </p>
                    <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">— Napoleon Hill</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card 2: What This Is */}
        <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden">
          <button
            onClick={() => toggleCard("what")}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-1">02</p>
              <h3 className="font-display font-bold text-lg text-foreground tracking-[0.05em]">What This Is</h3>
              <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">Your identity, installed in your own voice</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${expandedCard === "what" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedCard === "what" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4 text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
                  <p>
                    This is an unconscious conditioning tool. You're going to create an audio file
                    of your own voice — your new internal dialogue — layered over a 417Hz frequency
                    that primes your brain for change.
                  </p>
                  <p>
                    Record your identity statements in first person ("I am now…") and third person
                    ("[Your name] is now…"). Your brain accepts your own voice without resistance —
                    it sounds like the voice you already think with.
                  </p>
                  <p className="text-foreground font-medium">
                    Not motivation. Not willpower. Unconscious reprogramming.
                  </p>
                  <p>
                    This tool is designed to support the personal development work you're already doing — not replace it. It's a conditioning tool that works on the unconscious level to reduce internal resistance and align your nervous system with the outcomes you're pursuing. Used consistently, it's one of the most powerful supplements to any growth journey.
                  </p>
                  <div className="pt-3 border-t border-border/50">
                    <p className="italic text-foreground">
                      "You act and feel not according to what things are really like, but according to the image your mind holds of what they're like. Change the self-image and you change the personality and the behavior."
                    </p>
                    <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">— Maxwell Maltz, Psycho-Cybernetics</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card 3: How This Works */}
        <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden">
          <button
            onClick={() => toggleCard("how")}
            className="w-full p-5 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-1">03</p>
              <h3 className="font-display font-bold text-lg text-foreground tracking-[0.05em]">How This Works</h3>
              <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">Simpler than you'd expect. More powerful than you'd believe.</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${expandedCard === "how" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {expandedCard === "how" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-3">
                  {steps.map((step, i) => (
                    <motion.div
                      key={step.number}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-primary font-display font-bold text-sm leading-none mt-1 flex-shrink-0">
                        {step.number}
                      </span>
                      <div>
                        <h4 className="font-display font-bold text-sm text-foreground tracking-[0.05em]">
                          {step.title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 normal-case tracking-normal">
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div className="pt-3 border-t border-border/50 mt-3">
                    <p className="text-xs italic text-muted-foreground normal-case tracking-normal">
                      "When you change your thoughts, you change your brain chemistry — and your body begins to believe it's living in a new reality. Repetition of new thought and emotion is how we install a new program into the unconscious."
                    </p>
                    <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">— Dr. Joe Dispenza, Breaking the Habit of Being Yourself</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HeroSection;

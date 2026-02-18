import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Lock, Check, Trophy, Zap, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  getChallengeStatus,
  startChallenge,
  logChallengeDay,
  isLevelUnlocked,
  CHALLENGE_LEVELS,
  type ChallengeLevel,
} from "@/lib/challengeTracker";
import { useTier } from "@/hooks/use-tier";
import { meetsMinimumTier } from "@/lib/tierAccess";
import { trackEvent } from "@/lib/analytics";

interface IdentityChallengeProps {
  onNeedsUpgrade?: (tier: "tier1" | "tier2") => void;
}

const IdentityChallenge = ({ onNeedsUpgrade }: IdentityChallengeProps) => {
  const [status, setStatus] = useState(getChallengeStatus());
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const { tier } = useTier();

  const refresh = () => setStatus(getChallengeStatus());

  useEffect(() => {
    refresh();
  }, []);

  const handleStart = (level: ChallengeLevel) => {
    if (!isLevelUnlocked(level.id)) return;
    if (!meetsMinimumTier(tier, level.requiredTier)) {
      onNeedsUpgrade?.(level.requiredTier as "tier1" | "tier2");
      return;
    }
    startChallenge(level.id);
    trackEvent("challenge_started", { level: level.id });
    refresh();
    setShowLevelSelect(false);
  };

  const handleLogDay = () => {
    const completed = logChallengeDay();
    trackEvent("challenge_day_logged", {
      level: status.level?.id,
      day: status.daysCompleted + 1,
    });
    if (completed) {
      setShowCelebration(true);
      trackEvent("challenge_level_completed", { level: status.level?.id });
      setTimeout(() => setShowCelebration(false), 4000);
    }
    refresh();
  };

  // Not in a challenge — show start prompt or level select
  if (!status.active) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {!showLevelSelect ? (
          <button
            onClick={() => setShowLevelSelect(true)}
            className="w-full px-5 py-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary font-display mb-1">
                  The Identity Challenge
                </p>
                <p className="text-sm text-foreground font-display font-bold">
                  {status.completedLevels.length > 0
                    ? "Continue your journey"
                    : "Begin the transformation"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">
                  {status.completedLevels.length > 0
                    ? `${status.completedLevels.length} of 3 levels complete`
                    : "7 → 21 → 30 days. Progressive identity installation."}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
            </div>
            {status.completedLevels.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {CHALLENGE_LEVELS.map((l) => (
                  <span
                    key={l.id}
                    className={`text-sm ${
                      status.completedLevels.includes(l.id) ? "" : "opacity-30 grayscale"
                    }`}
                  >
                    {l.badge}
                  </span>
                ))}
              </div>
            )}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-primary/20 bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-display">
                Choose Your Level
              </p>
              <button
                onClick={() => setShowLevelSelect(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            {CHALLENGE_LEVELS.map((level, i) => {
              const unlocked = isLevelUnlocked(level.id);
              const completed = status.completedLevels.includes(level.id);
              const tierOk = meetsMinimumTier(tier, level.requiredTier);

              return (
                <button
                  key={level.id}
                  onClick={() => !completed && handleStart(level)}
                  disabled={completed}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    completed
                      ? "border-primary/20 bg-primary/5 opacity-60"
                      : unlocked && tierOk
                      ? "border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                      : "border-border/30 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{completed ? "✅" : level.badge}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-bold text-foreground">
                        {level.name}
                      </p>
                      <p className="text-xs text-muted-foreground normal-case tracking-normal">
                        {completed
                          ? "Completed"
                          : !unlocked
                          ? `Complete ${CHALLENGE_LEVELS[i - 1]?.name} first`
                          : !tierOk
                          ? `Requires ${level.requiredTier === "tier1" ? "Pro" : "Elite"}`
                          : `${level.days} days • ${level.subtitle}`}
                      </p>
                    </div>
                    {!unlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                    {!tierOk && unlocked && !completed && (
                      <Zap className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Active challenge — progress view
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
    >
      {/* Level Completion Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="relative text-center p-8 rounded-2xl bg-card border border-primary/30 shadow-glow max-w-sm mx-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.4 }}
                className="text-6xl mb-4"
              >
                {status.level?.badge}
              </motion.div>
              <h3 className="font-display text-xl text-primary text-glow mb-2">
                Challenge Complete
              </h3>
              <p className="text-sm text-foreground font-display font-bold mb-1">
                {status.level?.name}
              </p>
              <p className="text-xs text-muted-foreground normal-case tracking-normal">
                You showed up {status.level?.days} days. That's not motivation — that's identity.
              </p>
              {status.nextLevel && (
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    refresh();
                  }}
                  className="mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground font-display font-bold text-xs uppercase tracking-wider"
                >
                  Next Level →
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display">
            {status.level?.name}
          </p>
          <p className="text-xs text-muted-foreground normal-case tracking-normal">
            {status.level?.subtitle}
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-display font-bold text-primary">
            {status.daysCompleted}
          </span>
          <span className="text-xs text-muted-foreground">/{status.totalDays}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={status.progressPercent} className="h-2" />

      {/* Day dots */}
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: status.totalDays }, (_, i) => {
          const completed = i < status.daysCompleted;
          const isToday = i === status.daysCompleted && !status.completedToday;
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                completed
                  ? "bg-primary shadow-[0_0_6px_hsl(195_100%_29%/0.5)]"
                  : isToday
                  ? "border-2 border-primary/50 bg-transparent animate-pulse-slow"
                  : "bg-border/30"
              }`}
            />
          );
        })}
      </div>

      {/* Streak & Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-xs text-foreground font-display">
            {status.currentStreak} day streak
          </span>
        </div>

        {status.isLevelComplete ? (
          <div className="flex items-center gap-1.5 text-primary">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-display font-bold">Complete!</span>
          </div>
        ) : status.completedToday ? (
          <div className="flex items-center gap-1.5 text-primary/70">
            <Check className="w-4 h-4" />
            <span className="text-xs font-display">Today logged</span>
          </div>
        ) : (
          <button
            onClick={handleLogDay}
            className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-xs uppercase tracking-wider hover:shadow-glow transition-shadow"
          >
            Log Today
          </button>
        )}
      </div>

      {/* Motivational message */}
      {status.currentStreak > 0 && !status.isLevelComplete && (
        <p className="text-[10px] text-center text-primary/70 italic normal-case tracking-normal">
          {status.currentStreak >= 14
            ? "You're becoming someone new. Keep going."
            : status.currentStreak >= 7
            ? "One week down. The pattern is shifting."
            : status.currentStreak >= 3
            ? "Three days in. Your unconscious is listening."
            : "Don't break the chain."}
        </p>
      )}
    </motion.div>
  );
};

export default IdentityChallenge;

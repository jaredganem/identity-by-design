import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Trophy, Zap, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  getChallengeStatus,
  startChallenge,
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
  const { tier } = useTier();

  const refresh = () => setStatus(getChallengeStatus());

  useEffect(() => {
    refresh();
  }, []);

  // Check if level just completed
  useEffect(() => {
    if (status.isLevelComplete && status.active) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  }, [status.isLevelComplete, status.active]);

  const handleStart = (level: ChallengeLevel) => {
    if (!isLevelUnlocked(level.id)) return;
    if (!meetsMinimumTier(tier, level.requiredTier)) {
      onNeedsUpgrade?.(level.requiredTier as "tier1" | "tier2");
      return;
    }
    startChallenge(level.id);
    trackEvent("challenge_started", { level: level.id });
    refresh();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Level Completion Celebration */}
      <AnimatePresence>
        {showCelebration && status.level && (
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
                {status.level.badge}
              </motion.div>
              <h3 className="font-display text-xl text-primary text-glow mb-2">
                Challenge Complete
              </h3>
              <p className="text-sm text-foreground font-display font-bold mb-1">
                {status.level.name}
              </p>
              <p className="text-xs text-muted-foreground normal-case tracking-normal">
                You showed up {status.level.days} days. That's not motivation — that's identity.
              </p>
              <button
                onClick={() => {
                  setShowCelebration(false);
                  refresh();
                }}
                className="mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground font-display font-bold text-xs uppercase tracking-wider"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level cards */}
      {CHALLENGE_LEVELS.map((level, i) => {
        const unlocked = isLevelUnlocked(level.id);
        const completed = status.completedLevels.includes(level.id);
        const isActive = status.level?.id === level.id;
        const tierOk = meetsMinimumTier(tier, level.requiredTier);

        return (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-xl border p-4 transition-all ${
              isActive
                ? "border-primary/40 bg-primary/5"
                : completed
                ? "border-primary/20 bg-primary/5 opacity-70"
                : unlocked && tierOk
                ? "border-border/40 hover:border-primary/30"
                : "border-border/20 opacity-40"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{completed ? "✅" : level.badge}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-bold text-foreground">{level.name}</p>
                <p className="text-xs text-muted-foreground normal-case tracking-normal">
                  {completed
                    ? "Completed — Badge earned"
                    : !unlocked
                    ? `Complete ${CHALLENGE_LEVELS[i - 1]?.name} first`
                    : !tierOk
                    ? `Requires ${level.requiredTier === "tier1" ? "Pro" : "Elite"}`
                    : `${level.days} days • ${level.subtitle}`}
                </p>
              </div>
              {!unlocked && <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              {!tierOk && unlocked && !completed && (
                <Zap className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </div>

            {/* Active challenge progress */}
            {isActive && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground normal-case tracking-normal">
                    {status.completedToday ? "✓ Today logged" : "Record or listen to log today"}
                  </span>
                  <span className="font-display font-bold text-primary">
                    {status.daysCompleted}/{status.totalDays}
                  </span>
                </div>
                <Progress value={status.progressPercent} className="h-2" />
                {/* Day dots */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {Array.from({ length: status.totalDays }, (_, j) => {
                    const dayDone = j < status.daysCompleted;
                    const isToday = j === status.daysCompleted && !status.completedToday;
                    return (
                      <div
                        key={j}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          dayDone
                            ? "bg-primary shadow-[0_0_4px_hsl(195_100%_29%/0.5)]"
                            : isToday
                            ? "border border-primary/50 bg-transparent animate-pulse-slow"
                            : "bg-border/30"
                        }`}
                      />
                    );
                  })}
                </div>
                {status.currentStreak > 0 && (
                  <p className="text-[10px] text-center text-primary/70 italic normal-case tracking-normal pt-1">
                    {status.currentStreak >= 14
                      ? "You're becoming someone new. Keep going."
                      : status.currentStreak >= 7
                      ? "One week down. The pattern is shifting."
                      : status.currentStreak >= 3
                      ? "Three days in. Your unconscious is listening."
                      : "Don't break the chain."}
                  </p>
                )}
              </div>
            )}

            {/* Start button for unlocked, not active, not completed */}
            {!isActive && !completed && unlocked && tierOk && (
              <button
                onClick={() => handleStart(level)}
                className="mt-3 w-full py-2 rounded-lg bg-primary/10 text-primary font-display font-bold text-xs uppercase tracking-wider hover:bg-primary/20 transition-colors"
              >
                Begin Challenge
              </button>
            )}

            {/* Upgrade prompt for tier-gated */}
            {!tierOk && unlocked && !completed && (
              <button
                onClick={() => onNeedsUpgrade?.(level.requiredTier as "tier1" | "tier2")}
                className="mt-3 w-full py-2 rounded-lg border border-primary/30 text-primary font-display font-bold text-xs uppercase tracking-wider hover:bg-primary/10 transition-colors"
              >
                Unlock with Pro →
              </button>
            )}
          </motion.div>
        );
      })}

      {/* All completed */}
      {status.completedLevels.length === 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4 space-y-2"
        >
          <div className="flex justify-center gap-2 text-2xl">
            {CHALLENGE_LEVELS.map((l) => (
              <span key={l.id}>{l.badge}</span>
            ))}
          </div>
          <p className="text-sm text-primary font-display font-bold">
            All Challenges Complete
          </p>
          <p className="text-xs text-muted-foreground normal-case tracking-normal">
            You've completed the full Identity Challenge. You're not the same man who started.
          </p>
        </motion.div>
      )}

      <div className="text-center pt-2">
        <p className="text-[10px] text-muted-foreground normal-case tracking-normal italic">
          Days are logged automatically when you record or listen to a session.
        </p>
      </div>
    </div>
  );
};

export default IdentityChallenge;

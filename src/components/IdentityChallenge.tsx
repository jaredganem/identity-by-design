import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Trophy, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  getChallengeStatus,
  startChallenge,
  isLevelUnlocked,
  getVisibleLevels,
  getCompletedTrophies,
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
  const [visible, setVisible] = useState(getVisibleLevels());
  const [trophies, setTrophies] = useState(getCompletedTrophies());
  const { tier } = useTier();

  const refresh = () => {
    setStatus(getChallengeStatus());
    setVisible(getVisibleLevels());
    setTrophies(getCompletedTrophies());
  };

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
    trackEvent("challenge_started", { level: level.id, days: level.days });
    refresh();
  };

  const allComplete = trophies.length === CHALLENGE_LEVELS.length;

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Trophy Shelf */}
      {trophies.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-primary/15 bg-primary/5 p-3"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-display mb-2 flex items-center gap-1.5">
            <Trophy className="w-3 h-3 text-primary" />
            Trophy Shelf
          </p>
          <div className="flex flex-wrap gap-2">
            {trophies.map((t) => (
              <motion.div
                key={t.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card border border-border/30"
                title={t.name}
              >
                <span className="text-sm">{t.badge}</span>
                <span className="text-[10px] text-foreground/70 font-display">{t.days}d</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All complete */}
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4 space-y-2"
        >
          <p className="text-sm text-primary font-display font-bold">
            All Challenges Complete
          </p>
          <p className="text-xs text-muted-foreground normal-case tracking-normal">
            365 days. One full year. You're not the same man who started this.
          </p>
        </motion.div>
      )}

      {/* Visible levels (max 3) */}
      {!allComplete && visible.map((level, i) => {
        const unlocked = isLevelUnlocked(level.id);
        const isActive = status.level?.id === level.id;
        const tierOk = meetsMinimumTier(tier, level.requiredTier);

        return (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-xl border p-4 transition-all ${
              isActive
                ? "border-primary/40 bg-primary/5"
                : unlocked && tierOk
                ? "border-border/30 hover:border-primary/30"
                : "border-border/20 opacity-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{level.badge}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-bold text-foreground">{level.name}</p>
                <p className="text-xs text-muted-foreground normal-case tracking-normal italic">
                  {!unlocked
                    ? "Complete the previous challenge first"
                    : !tierOk
                    ? `Requires ${level.requiredTier === "tier1" ? "Pro" : "Elite"}`
                    : level.tagline}
                </p>
              </div>
              {!unlocked && <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              {!tierOk && unlocked && (
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
                {/* Day dots for short challenges */}
                {level.days <= 30 && (
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
                )}
                {status.currentStreak > 0 && (
                  <p className="text-[10px] text-center text-primary/70 italic normal-case tracking-normal pt-1">
                    {status.currentStreak >= 30
                      ? "This is who you are now."
                      : status.currentStreak >= 14
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

            {/* Start button */}
            {!isActive && unlocked && tierOk && (
              <button
                onClick={() => handleStart(level)}
                className="mt-3 w-full py-2.5 rounded-lg bg-primary/10 text-primary font-display font-bold text-xs uppercase tracking-wider hover:bg-primary/20 transition-colors"
              >
                Begin {level.days === 1 ? "First Session" : `${level.days}-Day Challenge`}
              </button>
            )}

            {/* Upgrade prompt */}
            {!tierOk && unlocked && (
              <button
                onClick={() => onNeedsUpgrade?.(level.requiredTier as "tier1" | "tier2")}
                className="mt-3 w-full py-2.5 rounded-lg border border-primary/30 text-primary font-display font-bold text-xs uppercase tracking-wider hover:bg-primary/10 transition-colors"
              >
                Unlock with Pro →
              </button>
            )}
          </motion.div>
        );
      })}

      <div className="text-center pt-2">
        <p className="text-[10px] text-muted-foreground normal-case tracking-normal italic">
          Days log automatically when you record or listen to a session.
        </p>
      </div>
    </div>
  );
};

export default IdentityChallenge;

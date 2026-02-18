/**
 * Identity Challenge System
 * ─────────────────────────
 * Progressive 7 → 21 → 30 day challenge with tier gating.
 * - 7 Day Identity Activation (Free)
 * - 21 Day Installation (Pro)
 * - 30 Day Identity Shift (Elite/Pro)
 *
 * Tracks daily completions, unlocks next level on completion.
 */

const STORAGE_KEY = "smfm_challenge";

export interface ChallengeLevel {
  id: "activation" | "installation" | "shift";
  name: string;
  subtitle: string;
  days: number;
  requiredTier: "free" | "tier1" | "tier2";
  badge: string;
}

export const CHALLENGE_LEVELS: ChallengeLevel[] = [
  {
    id: "activation",
    name: "The 7-Day Identity Activation",
    subtitle: "Prove it to yourself.",
    days: 7,
    requiredTier: "free",
    badge: "🔥",
  },
  {
    id: "installation",
    name: "The 21-Day Installation",
    subtitle: "Rewire the pattern.",
    days: 21,
    requiredTier: "tier1",
    badge: "⚡",
  },
  {
    id: "shift",
    name: "The 30-Day Identity Shift",
    subtitle: "Full installation.",
    days: 30,
    requiredTier: "tier1",
    badge: "🏆",
  },
];

export interface ChallengeData {
  /** Which challenge level is active */
  activeLevel: ChallengeLevel["id"] | null;
  /** ISO date strings of completed days */
  completedDays: string[];
  /** Date challenge was started */
  startDate: string | null;
  /** Completed challenge level IDs */
  completedLevels: ChallengeLevel["id"][];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function getChallengeData(): ChallengeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    activeLevel: null,
    completedDays: [],
    startDate: null,
    completedLevels: [],
  };
}

function save(data: ChallengeData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Start a challenge level */
export function startChallenge(levelId: ChallengeLevel["id"]): void {
  const data = getChallengeData();
  data.activeLevel = levelId;
  data.startDate = today();
  data.completedDays = [];
  save(data);
}

/** Log today as a completed challenge day */
export function logChallengeDay(): boolean {
  const data = getChallengeData();
  if (!data.activeLevel) return false;

  const d = today();
  if (!data.completedDays.includes(d)) {
    data.completedDays.push(d);
  }

  // Check if level is complete
  const level = CHALLENGE_LEVELS.find((l) => l.id === data.activeLevel);
  if (level && data.completedDays.length >= level.days) {
    if (!data.completedLevels.includes(data.activeLevel)) {
      data.completedLevels.push(data.activeLevel);
    }
    save(data);
    return true; // level completed!
  }

  save(data);
  return false;
}

/** Get the current challenge status */
export function getChallengeStatus() {
  const data = getChallengeData();
  const level = data.activeLevel
    ? CHALLENGE_LEVELS.find((l) => l.id === data.activeLevel) || null
    : null;

  const completedToday = data.completedDays.includes(today());
  const daysCompleted = data.completedDays.length;
  const totalDays = level?.days || 0;
  const progressPercent = totalDays > 0 ? Math.round((daysCompleted / totalDays) * 100) : 0;

  // Streak: consecutive days ending today or yesterday
  let currentStreak = 0;
  if (data.completedDays.length > 0) {
    const sorted = [...data.completedDays].sort().reverse();
    const todayStr = today();
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (sorted[0] === todayStr || sorted[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = (prev.getTime() - curr.getTime()) / 86400000;
        if (diff === 1) currentStreak++;
        else break;
      }
    }
  }

  // Next available level
  const nextLevel = getNextAvailableLevel(data);

  return {
    active: !!data.activeLevel,
    level,
    daysCompleted,
    totalDays,
    progressPercent,
    completedToday,
    currentStreak,
    completedLevels: data.completedLevels,
    nextLevel,
    isLevelComplete: level ? daysCompleted >= level.days : false,
  };
}

function getNextAvailableLevel(data: ChallengeData): ChallengeLevel | null {
  for (const level of CHALLENGE_LEVELS) {
    if (!data.completedLevels.includes(level.id) && data.activeLevel !== level.id) {
      return level;
    }
  }
  return null;
}

/** Check if a specific level is unlocked (previous levels completed) */
export function isLevelUnlocked(levelId: ChallengeLevel["id"]): boolean {
  const data = getChallengeData();
  const levelIndex = CHALLENGE_LEVELS.findIndex((l) => l.id === levelId);
  if (levelIndex === 0) return true;
  // All previous levels must be completed
  for (let i = 0; i < levelIndex; i++) {
    if (!data.completedLevels.includes(CHALLENGE_LEVELS[i].id)) return false;
  }
  return true;
}

/** Reset challenge (for testing or restart) */
export function resetChallenge(): void {
  localStorage.removeItem(STORAGE_KEY);
}

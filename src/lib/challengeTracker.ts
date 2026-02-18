/**
 * Identity Challenge System
 * ─────────────────────────
 * Progressive challenge levels that unlock sequentially.
 * Only 3 visible at a time — completed ones go to trophy shelf.
 * Days auto-log from recordings, track builds, and listens.
 *
 * Levels: 1 → 3 → 7 → 30 → 60 → 90 → 120 → 180 → 365
 */

const STORAGE_KEY = "smfm_challenge";

export interface ChallengeLevel {
  id: string;
  name: string;
  tagline: string;
  days: number;
  badge: string;
  requiredTier: "free" | "tier1" | "tier2";
}

export const CHALLENGE_LEVELS: ChallengeLevel[] = [
  {
    id: "day1",
    name: "First Step",
    tagline: "Just once. That's all it takes to start.",
    days: 1,
    badge: "✦",
    requiredTier: "free",
  },
  {
    id: "day3",
    name: "The Spark",
    tagline: "3 days. Prove you're serious.",
    days: 3,
    badge: "🔥",
    requiredTier: "free",
  },
  {
    id: "day7",
    name: "The 7-Day Identity Activation",
    tagline: "You could do anything for 7 days… couldn't you?",
    days: 7,
    badge: "⚡",
    requiredTier: "free",
  },
  {
    id: "day30",
    name: "The 30-Day Installation",
    tagline: "This is where habits become identity.",
    days: 30,
    badge: "🛡️",
    requiredTier: "tier1",
  },
  {
    id: "day60",
    name: "The 60-Day Rewire",
    tagline: "The old patterns don't fit anymore.",
    days: 60,
    badge: "💎",
    requiredTier: "tier1",
  },
  {
    id: "day90",
    name: "The 90-Day Identity Shift",
    tagline: "You're not the same man who started.",
    days: 90,
    badge: "👑",
    requiredTier: "tier1",
  },
  {
    id: "day120",
    name: "The 120-Day Transformation",
    tagline: "People around you are starting to notice.",
    days: 120,
    badge: "🏛️",
    requiredTier: "tier1",
  },
  {
    id: "day180",
    name: "The 180-Day Mastery",
    tagline: "Half a year. This is who you are now.",
    days: 180,
    badge: "🔱",
    requiredTier: "tier1",
  },
  {
    id: "day365",
    name: "The 365-Day Legend",
    tagline: "One full year. Unrecognizable.",
    days: 365,
    badge: "🏆",
    requiredTier: "tier1",
  },
];

export interface ChallengeData {
  /** Which challenge level is active */
  activeLevel: string | null;
  /** ISO date strings of completed days */
  completedDays: string[];
  /** Date challenge was started */
  startDate: string | null;
  /** Completed challenge level IDs */
  completedLevels: string[];
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
export function startChallenge(levelId: string): void {
  const data = getChallengeData();
  data.activeLevel = levelId;
  data.startDate = today();
  data.completedDays = [];
  save(data);
}

/** Log today as a completed challenge day. Returns true if level completed. */
export function logChallengeDay(): boolean {
  const data = getChallengeData();
  if (!data.activeLevel) return false;

  const d = today();
  if (!data.completedDays.includes(d)) {
    data.completedDays.push(d);
  }

  const level = CHALLENGE_LEVELS.find((l) => l.id === data.activeLevel);
  if (level && data.completedDays.length >= level.days) {
    if (!data.completedLevels.includes(data.activeLevel)) {
      data.completedLevels.push(data.activeLevel);
    }
    // Auto-advance to next level
    const idx = CHALLENGE_LEVELS.findIndex((l) => l.id === data.activeLevel);
    const next = CHALLENGE_LEVELS[idx + 1];
    if (next) {
      data.activeLevel = next.id;
      data.startDate = d;
      data.completedDays = [];
    } else {
      data.activeLevel = null;
    }
    save(data);
    return true;
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

  return {
    active: !!data.activeLevel,
    level,
    daysCompleted,
    totalDays,
    progressPercent,
    completedToday,
    currentStreak,
    completedLevels: data.completedLevels,
    isLevelComplete: level ? daysCompleted >= level.days : false,
  };
}

/** Get the 3 visible levels: current + next 2 unlocked ones */
export function getVisibleLevels(): ChallengeLevel[] {
  const data = getChallengeData();

  // Find the first non-completed level
  let startIdx = 0;
  for (let i = 0; i < CHALLENGE_LEVELS.length; i++) {
    if (!data.completedLevels.includes(CHALLENGE_LEVELS[i].id)) {
      startIdx = i;
      break;
    }
    if (i === CHALLENGE_LEVELS.length - 1) {
      startIdx = CHALLENGE_LEVELS.length; // all done
    }
  }

  return CHALLENGE_LEVELS.slice(startIdx, startIdx + 3);
}

/** Get completed levels as trophies */
export function getCompletedTrophies(): ChallengeLevel[] {
  const data = getChallengeData();
  return CHALLENGE_LEVELS.filter((l) => data.completedLevels.includes(l.id));
}

/** Check if a specific level is unlocked (previous levels completed) */
export function isLevelUnlocked(levelId: string): boolean {
  const data = getChallengeData();
  const levelIndex = CHALLENGE_LEVELS.findIndex((l) => l.id === levelId);
  if (levelIndex === 0) return true;
  for (let i = 0; i < levelIndex; i++) {
    if (!data.completedLevels.includes(CHALLENGE_LEVELS[i].id)) return false;
  }
  return true;
}

/** Reset challenge */
export function resetChallenge(): void {
  localStorage.removeItem(STORAGE_KEY);
}

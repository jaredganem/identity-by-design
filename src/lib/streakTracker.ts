/**
 * Progress & Streak Tracking
 * ──────────────────────────
 * Tracks daily activity (recordings, listens, track builds) in localStorage.
 * Calculates current streak, longest streak, and total sessions.
 */

const STORAGE_KEY = "smfm_streak_data";

export interface StreakData {
  /** ISO date strings of active days (YYYY-MM-DD) */
  activeDays: string[];
  /** Total number of recordings made */
  totalRecordings: number;
  /** Total number of tracks built */
  totalTrackBuilds: number;
  /** Total number of listen sessions */
  totalListens: number;
  /** First activity date */
  firstActiveDate: string | null;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function getStreakData(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    activeDays: [],
    totalRecordings: 0,
    totalTrackBuilds: 0,
    totalListens: 0,
    firstActiveDate: null,
  };
}

function saveStreakData(data: StreakData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Mark today as active and increment a counter */
export function logActivity(type: "recording" | "track_build" | "listen"): void {
  const data = getStreakData();
  const d = today();

  if (!data.activeDays.includes(d)) {
    data.activeDays.push(d);
  }

  if (!data.firstActiveDate) {
    data.firstActiveDate = d;
  }

  switch (type) {
    case "recording":
      data.totalRecordings++;
      break;
    case "track_build":
      data.totalTrackBuilds++;
      break;
    case "listen":
      data.totalListens++;
      break;
  }

  saveStreakData(data);
}

/** Calculate current streak (consecutive days ending today or yesterday) */
export function getCurrentStreak(): number {
  const data = getStreakData();
  if (data.activeDays.length === 0) return 0;

  const sorted = [...data.activeDays].sort().reverse();
  const todayStr = today();
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Streak must include today or yesterday
  if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/** Get the longest streak ever */
export function getLongestStreak(): number {
  const data = getStreakData();
  if (data.activeDays.length === 0) return 0;

  const sorted = [...data.activeDays].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }

  return longest;
}

/** Get total days active */
export function getTotalDaysActive(): number {
  return getStreakData().activeDays.length;
}

/** Get all stats at once */
export function getProgressStats() {
  const data = getStreakData();
  return {
    currentStreak: getCurrentStreak(),
    longestStreak: getLongestStreak(),
    totalDaysActive: data.activeDays.length,
    totalRecordings: data.totalRecordings,
    totalTrackBuilds: data.totalTrackBuilds,
    totalListens: data.totalListens,
    firstActiveDate: data.firstActiveDate,
    isActiveToday: data.activeDays.includes(today()),
  };
}

/** Check if user has any activity at all (returning user detection) */
export function isReturningUser(): boolean {
  const data = getStreakData();
  return data.activeDays.length > 0;
}

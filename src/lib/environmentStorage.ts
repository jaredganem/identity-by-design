/**
 * Persists and retrieves the user's environment settings
 * (soundscape, frequency, subliminal, volumes) across sessions.
 */

const STORAGE_KEY = "smfm_environment";

export interface EnvironmentSettings {
  soundscapeId: string;
  frequencyId: string;
  subliminalOn: boolean;
  bgVolume: number;
  freqVolume: number;
}

const DEFAULTS: EnvironmentSettings = {
  soundscapeId: "none",
  frequencyId: "417hz",
  subliminalOn: false,
  bgVolume: 0.3,
  freqVolume: 0.3,
};

export function loadEnvironment(): EnvironmentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveEnvironment(settings: EnvironmentSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

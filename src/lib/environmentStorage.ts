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

/** Mixer-level settings (voice, reverb, loops) */
export interface MixerSettings {
  vocalVolume: number;
  reverbAmount: number;
  loopCount: number;
}

const DEFAULTS: EnvironmentSettings = {
  soundscapeId: "none",
  frequencyId: "417hz",
  subliminalOn: false,
  bgVolume: 0.2,
  freqVolume: 0.25,
};

/** Optimal mix for active/awake listening */
export const OPTIMAL_MIX: MixerSettings & Pick<EnvironmentSettings, "bgVolume" | "freqVolume"> = {
  vocalVolume: 0.85,
  reverbAmount: 0.4,
  loopCount: 3,
  bgVolume: 0.2,
  freqVolume: 0.25,
};

/** Sleep mix for nighttime installation */
export const SLEEP_MIX: MixerSettings & Pick<EnvironmentSettings, "bgVolume" | "freqVolume"> = {
  vocalVolume: 0.63,
  reverbAmount: 0.55,
  loopCount: 5,
  bgVolume: 0.3,
  freqVolume: 0.42,
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
    window.dispatchEvent(new CustomEvent("environment-changed", { detail: settings }));
  } catch {}
}

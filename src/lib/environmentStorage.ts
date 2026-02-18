/**
 * Persists and retrieves the user's environment settings
 * (soundscape, frequency, subliminal, volumes) across sessions.
 */

const STORAGE_KEY = "smfm_environment";
const MY_MIX_KEY = "smfm_my_mix";

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

/** Frequencies that require elite tier */
const ELITE_FREQ_IDS = new Set(["963hz", "40hz", "7.83hz"]);

export function loadEnvironment(userTier?: string): EnvironmentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = { ...DEFAULTS, ...JSON.parse(raw) };
    // Reset elite-locked frequency to 417hz if user isn't elite
    if (ELITE_FREQ_IDS.has(parsed.frequencyId) && userTier !== "tier2") {
      parsed.frequencyId = "417hz";
    }
    return parsed;
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

/** Full mix = mixer settings + environment settings combined */
export interface FullMixSettings extends MixerSettings, EnvironmentSettings {}

export function saveMyMix(mix: FullMixSettings): void {
  try {
    localStorage.setItem(MY_MIX_KEY, JSON.stringify(mix));
  } catch {}
}

export function loadMyMix(): FullMixSettings | null {
  try {
    const raw = localStorage.getItem(MY_MIX_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FullMixSettings;
  } catch {
    return null;
  }
}

export function hasMyMix(): boolean {
  return localStorage.getItem(MY_MIX_KEY) !== null;
}

export function clearMyMix(): void {
  localStorage.removeItem(MY_MIX_KEY);
}

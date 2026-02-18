/**
 * Subliminal Saturation Engine
 * ────────────────────────────
 * Layers the user's own recorded affirmations at near-inaudible volume
 * underneath the main playback. Two modes:
 *
 * • Echo — same recording pitched down slightly, very low gain
 * • Rapid Loop — shorter clips sped up (1.5–2x), whisper-volume, looping
 *
 * All content is the user's own voice. No hidden/unknown affirmations.
 *
 * Intensity levels control the subliminal gain:
 *   off = 0, low = 0.03 (3%), medium = 0.08 (8%)
 */

export type SubliminalMode = "echo" | "rapid";
export type SubliminalIntensity = "off" | "low" | "medium" | "high";

const GAIN_MAP: Record<SubliminalIntensity, number> = {
  off: 0,
  low: 0.03,
  medium: 0.08,
  high: 0.14,
};

const STORAGE_KEY = "smfm_subliminal";

interface SubliminalPrefs {
  mode: SubliminalMode;
  intensity: SubliminalIntensity;
}

export function getSubliminalPrefs(): SubliminalPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { mode: "echo", intensity: "off" };
}

export function saveSubliminalPrefs(prefs: SubliminalPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * Create a subliminal audio node chain that plays alongside the main audio.
 * Returns a control object to start/stop/update the subliminal layer.
 *
 * @param audioContext - The existing AudioContext from the player
 * @param destination - Where to connect (usually ctx.destination)
 */
export function createSubliminalLayer(
  audioContext: AudioContext,
  destination: AudioNode
) {
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0;
  gainNode.connect(destination);

  let activeSource: AudioBufferSourceNode | null = null;
  let currentBuffer: AudioBuffer | null = null;

  const stop = () => {
    if (activeSource) {
      try {
        activeSource.stop();
      } catch {}
      activeSource.disconnect();
      activeSource = null;
    }
  };

  const start = (buffer: AudioBuffer, mode: SubliminalMode, intensity: SubliminalIntensity) => {
    stop();
    if (intensity === "off") return;

    currentBuffer = buffer;
    gainNode.gain.setValueAtTime(GAIN_MAP[intensity], audioContext.currentTime);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    if (mode === "echo") {
      // Pitched down slightly — detune by -200 cents (one whole tone lower)
      source.detune.value = -200;
      source.playbackRate.value = 1.0;
    } else {
      // Rapid loop — sped up, whisper-speed saturation
      source.playbackRate.value = 1.7;
      source.detune.value = -100;
    }

    source.connect(gainNode);
    source.start(0);
    activeSource = source;
  };

  const updateIntensity = (intensity: SubliminalIntensity) => {
    gainNode.gain.linearRampToValueAtTime(
      GAIN_MAP[intensity],
      audioContext.currentTime + 0.3
    );
  };

  const updateMode = (mode: SubliminalMode, intensity: SubliminalIntensity) => {
    if (currentBuffer && intensity !== "off") {
      start(currentBuffer, mode, intensity);
    }
  };

  const destroy = () => {
    stop();
    gainNode.disconnect();
  };

  return { start, stop, updateIntensity, updateMode, destroy };
}

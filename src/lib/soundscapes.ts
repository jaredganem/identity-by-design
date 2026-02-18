export interface Soundscape {
  id: string;
  label: string;
  emoji: string;
  /** File path for file-based soundscapes */
  path?: string;
  /** Frequency in Hz for oscillator-generated tones */
  frequency?: number;
  /** Group for UI display */
  group: "soundscape" | "frequency";
  /** Description shown on hover/select */
  description?: string;
}

export const SOUNDSCAPES: Soundscape[] = [
  // File-based soundscapes
  { id: "417hz-file", label: "417Hz Frequency", emoji: "🔊", path: "/audio/417Hz_Frequency.mp3", group: "soundscape", description: "Original 417Hz audio file" },
  { id: "ocean", label: "Ocean Waves", emoji: "🌊", path: "/audio/soundscape_oceanwaves.m4a", group: "soundscape" },
  { id: "rain", label: "Slow Rain", emoji: "🌧️", path: "/audio/soundscape_slowrain.m4a", group: "soundscape" },
  { id: "forest", label: "Forest", emoji: "🌲", path: "/audio/soundscape_forest.m4a", group: "soundscape" },
  { id: "fireplace", label: "Fireplace", emoji: "🔥", path: "/audio/soundscape_fireplace.m4a", group: "soundscape" },
  { id: "brownnoise", label: "Brown Noise", emoji: "🟤", path: "/audio/soundscape_brownnoise.m4a", group: "soundscape" },

  // Healing frequencies (oscillator-generated)
  { id: "174hz", label: "174 Hz", emoji: "🩹", frequency: 174, group: "frequency", description: "Pain relief & security" },
  { id: "285hz", label: "285 Hz", emoji: "🧬", frequency: 285, group: "frequency", description: "Tissue healing & restoration" },
  { id: "396hz", label: "396 Hz", emoji: "🔓", frequency: 396, group: "frequency", description: "Liberating guilt & fear" },
  { id: "417hz", label: "417 Hz", emoji: "🔄", frequency: 417, group: "frequency", description: "Facilitating change" },
  { id: "528hz", label: "528 Hz", emoji: "💎", frequency: 528, group: "frequency", description: "Transformation & DNA repair" },
  { id: "639hz", label: "639 Hz", emoji: "🤝", frequency: 639, group: "frequency", description: "Connecting & relationships" },
  { id: "741hz", label: "741 Hz", emoji: "🗣️", frequency: 741, group: "frequency", description: "Awakening intuition & expression" },
  { id: "852hz", label: "852 Hz", emoji: "👁️", frequency: 852, group: "frequency", description: "Returning to spiritual order" },
  { id: "963hz", label: "963 Hz", emoji: "👑", frequency: 963, group: "frequency", description: "Divine consciousness & oneness" },
  { id: "40hz", label: "40 Hz", emoji: "⚡", frequency: 40, group: "frequency", description: "Gamma brainwave — focus & cognition" },
  { id: "432hz", label: "432 Hz", emoji: "🎵", frequency: 432, group: "frequency", description: "Natural tuning — calm & harmony" },
  { id: "7.83hz", label: "7.83 Hz", emoji: "🌍", frequency: 7.83, group: "frequency", description: "Schumann resonance — Earth's pulse" },
];

export const DEFAULT_SOUNDSCAPE = SOUNDSCAPES[0];

export function getSoundscapeById(id: string): Soundscape {
  return SOUNDSCAPES.find((s) => s.id === id) || DEFAULT_SOUNDSCAPE;
}

/**
 * Generate a pure sine-wave AudioBuffer at the given frequency.
 * Duration is 10 seconds — the track builder loops it anyway.
 */
export function generateToneBuffer(
  frequency: number,
  sampleRate = 44100,
  durationSec = 10
): AudioBuffer {
  const length = sampleRate * durationSec;
  const ctx = new OfflineAudioContext(2, length, sampleRate);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      // Pure sine wave with gentle warmth from a subtle harmonic
      const t = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * frequency * t) * 0.8
              + Math.sin(2 * Math.PI * frequency * 2 * t) * 0.1
              + Math.sin(2 * Math.PI * frequency * 3 * t) * 0.05;
    }
  }

  return buffer;
}

/**
 * Load a soundscape as an AudioBuffer — either from a file or oscillator.
 */
export async function loadSoundscapeBuffer(
  soundscape: Soundscape,
  decodeBlob: (blob: Blob) => Promise<AudioBuffer>
): Promise<AudioBuffer> {
  if (soundscape.frequency) {
    return generateToneBuffer(soundscape.frequency);
  }

  if (soundscape.path) {
    const response = await fetch(soundscape.path);
    const blob = await response.blob();
    return decodeBlob(blob);
  }

  throw new Error(`Soundscape "${soundscape.id}" has no path or frequency`);
}

export interface Soundscape {
  id: string;
  label: string;
  emoji: string;
  path?: string;
  frequency?: number;
  group: "soundscape" | "frequency";
  description?: string;
}

export const AMBIENT_SOUNDSCAPES: Soundscape[] = [
  { id: "none", label: "None", emoji: "🔇", group: "soundscape" },
  { id: "ocean", label: "Ocean Waves", emoji: "🌊", path: "/audio/soundscape_oceanwaves.m4a", group: "soundscape" },
  { id: "rain", label: "Slow Rain", emoji: "🌧️", path: "/audio/soundscape_slowrain.m4a", group: "soundscape" },
  { id: "forest", label: "Forest", emoji: "🌲", path: "/audio/soundscape_forest.m4a", group: "soundscape" },
  { id: "fireplace", label: "Fireplace", emoji: "🔥", path: "/audio/soundscape_fireplace.m4a", group: "soundscape" },
  { id: "brownnoise", label: "Brown Noise", emoji: "🟤", path: "/audio/soundscape_brownnoise.m4a", group: "soundscape" },
];

export const HEALING_FREQUENCIES: Soundscape[] = [
  { id: "417hz", label: "417 Hz", emoji: "🔄", frequency: 417, group: "frequency", description: "Facilitating change" },
  { id: "174hz", label: "174 Hz", emoji: "🩹", frequency: 174, group: "frequency", description: "Pain relief & security" },
  { id: "285hz", label: "285 Hz", emoji: "🧬", frequency: 285, group: "frequency", description: "Tissue healing & restoration" },
  { id: "396hz", label: "396 Hz", emoji: "🔓", frequency: 396, group: "frequency", description: "Liberating guilt & fear" },
  { id: "528hz", label: "528 Hz", emoji: "💎", frequency: 528, group: "frequency", description: "Transformation & DNA repair" },
  { id: "639hz", label: "639 Hz", emoji: "🤝", frequency: 639, group: "frequency", description: "Connecting & relationships" },
  { id: "741hz", label: "741 Hz", emoji: "🗣️", frequency: 741, group: "frequency", description: "Awakening intuition & expression" },
  { id: "852hz", label: "852 Hz", emoji: "👁️", frequency: 852, group: "frequency", description: "Returning to spiritual order" },
  { id: "963hz", label: "963 Hz", emoji: "👑", frequency: 963, group: "frequency", description: "Divine consciousness & oneness" },
  { id: "40hz", label: "40 Hz", emoji: "⚡", frequency: 40, group: "frequency", description: "Gamma brainwave — focus & cognition" },
  { id: "432hz", label: "432 Hz", emoji: "🎵", frequency: 432, group: "frequency", description: "Natural tuning — calm & harmony" },
  { id: "7.83hz", label: "7.83 Hz", emoji: "🌍", frequency: 7.83, group: "frequency", description: "Schumann resonance — Earth's pulse" },
];

// Combined for backward compat
export const SOUNDSCAPES: Soundscape[] = [...AMBIENT_SOUNDSCAPES, ...HEALING_FREQUENCIES];

export const DEFAULT_SOUNDSCAPE = AMBIENT_SOUNDSCAPES[0];

export function getSoundscapeById(id: string): Soundscape | undefined {
  return SOUNDSCAPES.find((s) => s.id === id);
}

export function getFrequencyById(id: string): Soundscape | undefined {
  return HEALING_FREQUENCIES.find((f) => f.id === id);
}

/**
 * Generate a rich drone-style healing frequency AudioBuffer.
 * Uses multiple detuned oscillators + harmonics rendered through
 * a synthetic impulse-response reverb for depth.
 */
export async function generateToneBuffer(
  frequency: number,
  sampleRate = 44100,
  durationSec = 10
): Promise<AudioBuffer> {
  const length = sampleRate * durationSec;
  const ctx = new OfflineAudioContext(2, length, sampleRate);

  // Long synthetic reverb impulse with stereo spread
  const irLength = Math.floor(sampleRate * 3.5);
  const irBuffer = ctx.createBuffer(2, irLength, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = irBuffer.getChannelData(ch);
    for (let i = 0; i < irLength; i++) {
      // Stereo variation for width
      const stereoOffset = ch === 0 ? 0.7 : 1.3;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-2.8 * i / irLength) * stereoOffset;
    }
  }

  const convolver = ctx.createConvolver();
  convolver.buffer = irBuffer;

  // Wet/dry for spaciousness — heavier on wet for ethereal feel
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.35;
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.65;

  dryGain.connect(ctx.destination);
  convolver.connect(wetGain);
  wetGain.connect(ctx.destination);

  // LFO for slow amplitude shimmer
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15; // very slow pulse
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.08; // subtle shimmer depth

  // Expanded drone voices — wider detuning, stereo panning, more harmonics
  const voices: { freq: number; gain: number; detune: number; pan: number }[] = [
    // Core fundamental cluster
    { freq: frequency, gain: 0.30, detune: 0, pan: 0 },
    { freq: frequency, gain: 0.15, detune: 7, pan: -0.6 },
    { freq: frequency, gain: 0.15, detune: -7, pan: 0.6 },
    { freq: frequency, gain: 0.08, detune: 12, pan: -0.9 },
    { freq: frequency, gain: 0.08, detune: -12, pan: 0.9 },
    // Sub-octave drone
    { freq: frequency * 0.5, gain: 0.12, detune: 0, pan: 0 },
    { freq: frequency * 0.5, gain: 0.06, detune: 3, pan: -0.4 },
    // Harmonics — octave + fifth for brightness
    { freq: frequency * 2, gain: 0.05, detune: 2, pan: -0.3 },
    { freq: frequency * 2, gain: 0.05, detune: -2, pan: 0.3 },
    { freq: frequency * 3, gain: 0.025, detune: -4, pan: -0.7 },
    { freq: frequency * 1.5, gain: 0.03, detune: 1, pan: 0.5 }, // perfect fifth
  ];

  lfo.connect(lfoGain);
  lfo.start(0);
  lfo.stop(durationSec);

  for (const v of voices) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = v.freq;
    osc.detune.value = v.detune;

    const gain = ctx.createGain();
    // Slow fade in/out
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(v.gain, 1.2);
    gain.gain.setValueAtTime(v.gain, durationSec - 1.0);
    gain.gain.linearRampToValueAtTime(0, durationSec);

    // LFO modulation on gain for shimmer
    lfoGain.connect(gain.gain);

    // Stereo panning
    const panner = ctx.createStereoPanner();
    panner.pan.value = v.pan;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(dryGain);
    panner.connect(convolver);

    osc.start(0);
    osc.stop(durationSec);
  }

  return ctx.startRendering();
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

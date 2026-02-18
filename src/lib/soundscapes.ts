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
/**
 * Build the shared "pro-grade" drone voice graph into any AudioContext.
 * Used by both the offline renderer and the live preview.
 */
function buildDroneGraph(
  ctx: BaseAudioContext,
  frequency: number,
  durationSec: number,
  destination: AudioNode,
  startTime = 0,
) {
  const nodes: AudioNode[] = [];
  const f = frequency;

  // ── Synthetic hall reverb (4.5 s tail, stereo-widened) ──
  const irLength = Math.floor(ctx.sampleRate * 4.5);
  const irBuffer = ctx.createBuffer(2, irLength, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = irBuffer.getChannelData(ch);
    const stereoMul = ch === 0 ? 0.65 : 1.35;
    for (let i = 0; i < irLength; i++) {
      data[i] =
        (Math.random() * 2 - 1) *
        Math.exp((-2.2 * i) / irLength) *
        stereoMul;
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = irBuffer;

  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.28;
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.72;

  dryGain.connect(destination);
  convolver.connect(wetGain);
  wetGain.connect(destination);
  nodes.push(dryGain, wetGain, convolver);

  // ── Low-pass filter for warmth ──
  const warmth = ctx.createBiquadFilter();
  warmth.type = "lowpass";
  warmth.frequency.value = Math.min(f * 6, 8000);
  warmth.Q.value = 0.7;
  warmth.connect(dryGain);
  warmth.connect(convolver);
  nodes.push(warmth);

  // ── Multiple LFOs for organic movement ──
  const lfo1 = ctx.createOscillator();
  lfo1.type = "sine";
  lfo1.frequency.value = 0.12;
  const lfo1Gain = ctx.createGain();
  lfo1Gain.gain.value = 0.07;
  lfo1.connect(lfo1Gain);
  lfo1.start(startTime);
  if (durationSec > 0) lfo1.stop(startTime + durationSec);

  const lfo2 = ctx.createOscillator();
  lfo2.type = "triangle";
  lfo2.frequency.value = 0.05;
  const lfo2Gain = ctx.createGain();
  lfo2Gain.gain.value = 0.04;
  lfo2.connect(lfo2Gain);
  lfo2.start(startTime);
  if (durationSec > 0) lfo2.stop(startTime + durationSec);
  nodes.push(lfo1, lfo1Gain, lfo2, lfo2Gain);

  // ── Binaural beat offset (±1.5 Hz between ears) ──
  const binauralOffset = 1.5;

  // ── Rich drone voices — 16 layers for full immersion ──
  const voices: { freq: number; gain: number; detune: number; pan: number; type?: OscillatorType }[] = [
    // Core fundamental with binaural split
    { freq: f - binauralOffset, gain: 0.22, detune: 0, pan: -0.95 },
    { freq: f + binauralOffset, gain: 0.22, detune: 0, pan: 0.95 },
    { freq: f, gain: 0.18, detune: 0, pan: 0 },
    // Detuned chorus cluster
    { freq: f, gain: 0.10, detune: 6, pan: -0.5 },
    { freq: f, gain: 0.10, detune: -6, pan: 0.5 },
    { freq: f, gain: 0.06, detune: 14, pan: -0.8 },
    { freq: f, gain: 0.06, detune: -14, pan: 0.8 },
    // Sub-octave warmth
    { freq: f * 0.5, gain: 0.14, detune: 0, pan: 0 },
    { freq: f * 0.5, gain: 0.06, detune: 4, pan: -0.3 },
    { freq: f * 0.5, gain: 0.06, detune: -4, pan: 0.3 },
    // Octave shimmer
    { freq: f * 2, gain: 0.04, detune: 3, pan: -0.4 },
    { freq: f * 2, gain: 0.04, detune: -3, pan: 0.4 },
    // Perfect fifth — harmonic glow
    { freq: f * 1.5, gain: 0.035, detune: 1, pan: 0.6 },
    { freq: f * 1.5, gain: 0.035, detune: -1, pan: -0.6 },
    // High harmonic sparkle (triangle wave for softer texture)
    { freq: f * 3, gain: 0.018, detune: -5, pan: -0.7, type: "triangle" },
    { freq: f * 4, gain: 0.012, detune: 2, pan: 0.7, type: "triangle" },
  ];

  for (const v of voices) {
    const osc = ctx.createOscillator();
    osc.type = v.type || "sine";
    osc.frequency.value = v.freq;
    osc.detune.value = v.detune;

    const gain = ctx.createGain();
    // Fade in / out envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(v.gain, startTime + 1.5);
    if (durationSec > 0) {
      gain.gain.setValueAtTime(v.gain, startTime + durationSec - 1.5);
      gain.gain.linearRampToValueAtTime(0, startTime + durationSec);
    }

    // LFO modulation for organic shimmer
    lfo1Gain.connect(gain.gain);
    lfo2Gain.connect(gain.gain);

    const panner = ctx.createStereoPanner();
    panner.pan.value = v.pan;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(warmth);

    osc.start(startTime);
    if (durationSec > 0) osc.stop(startTime + durationSec);
    nodes.push(osc, gain, panner);
  }

  return nodes;
}

/**
 * Generate a rich drone-style healing frequency AudioBuffer (offline).
 */
export async function generateToneBuffer(
  frequency: number,
  sampleRate = 44100,
  durationSec = 10
): Promise<AudioBuffer> {
  const length = sampleRate * durationSec;
  const ctx = new OfflineAudioContext(2, length, sampleRate);

  buildDroneGraph(ctx, frequency, durationSec, ctx.destination, 0);

  return ctx.startRendering();
}

/**
 * Build the drone graph into a live AudioContext (for preview).
 * Returns an array of nodes the caller must stop/disconnect on cleanup.
 */
export function buildDroneGraphLive(
  ctx: AudioContext,
  frequency: number,
  destination: AudioNode,
): AudioNode[] {
  return buildDroneGraph(ctx, frequency, 0, destination, ctx.currentTime);
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

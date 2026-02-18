export interface Soundscape {
  id: string;
  label: string;
  emoji: string;
  path: string;
}

export const SOUNDSCAPES: Soundscape[] = [
  { id: "417hz", label: "417Hz Frequency", emoji: "🔊", path: "/audio/417Hz_Frequency.mp3" },
  { id: "ocean", label: "Ocean Waves", emoji: "🌊", path: "/audio/soundscape_oceanwaves.m4a" },
  { id: "rain", label: "Slow Rain", emoji: "🌧️", path: "/audio/soundscape_slowrain.m4a" },
  { id: "forest", label: "Forest", emoji: "🌲", path: "/audio/soundscape_forest.m4a" },
  { id: "fireplace", label: "Fireplace", emoji: "🔥", path: "/audio/soundscape_fireplace.m4a" },
  { id: "brownnoise", label: "Brown Noise", emoji: "🟤", path: "/audio/soundscape_brownnoise.m4a" },
];

export const DEFAULT_SOUNDSCAPE = SOUNDSCAPES[0];

export function getSoundscapeById(id: string): Soundscape {
  return SOUNDSCAPES.find((s) => s.id === id) || DEFAULT_SOUNDSCAPE;
}

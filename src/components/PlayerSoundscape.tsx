import { useState, useRef, useEffect } from "react";
import { Lock } from "lucide-react";
import { AMBIENT_SOUNDSCAPES, type Soundscape } from "@/lib/soundscapes";
import { Slider } from "@/components/ui/slider";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { useTier } from "@/hooks/use-tier";
import UpgradePrompt from "@/components/UpgradePrompt";
import { loadEnvironment, saveEnvironment } from "@/lib/environmentStorage";

/**
 * Compact soundscape selector for the Player page.
 * Plays live ambient audio via Web Audio API during playback.
 * Pro feature — free tier sees locked state with upgrade prompt.
 */
interface PlayerSoundscapeProps {
  isPlaying: boolean;
  /** AudioContext from the player for routing */
  audioContext?: AudioContext | null;
  destination?: AudioNode | null;
}

const PlayerSoundscape = ({ isPlaying, audioContext, destination }: PlayerSoundscapeProps) => {
  const { tier } = useTier();
  const isPro = PAYMENTS_DISABLED || tier === "tier1" || tier === "tier2";

  const [soundscapeId, setSoundscapeId] = useState(() => loadEnvironment(tier).soundscapeId);
  const [bgVolume, setBgVolume] = useState(() => loadEnvironment(tier).bgVolume);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Start/stop soundscape based on playback state and selection
  useEffect(() => {
    const selected = AMBIENT_SOUNDSCAPES.find((s) => s.id === soundscapeId);

    // Cleanup previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
    if (gainRef.current) {
      try { gainRef.current.disconnect(); } catch {}
      gainRef.current = null;
    }

    if (!isPlaying || !selected || selected.id === "none" || !selected.path || !isPro) return;

    const audio = new Audio(selected.path);
    audio.loop = true;
    audio.volume = bgVolume;

    // If we have an AudioContext, route through it for proper mixing
    if (audioContext && destination) {
      try {
        const source = audioContext.createMediaElementSource(audio);
        const gain = audioContext.createGain();
        gain.gain.value = bgVolume;
        source.connect(gain);
        gain.connect(destination);
        sourceRef.current = source;
        gainRef.current = gain;
        // Set audio volume to 1 since gain node handles it
        audio.volume = 1;
      } catch {
        // Fallback: direct playback
        audio.volume = bgVolume;
      }
    }

    audio.play().catch(() => {});
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [isPlaying, soundscapeId, isPro, audioContext, destination]);

  // Update volume live
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = bgVolume;
    } else if (audioRef.current) {
      audioRef.current.volume = bgVolume;
    }
  }, [bgVolume]);

  const handleSelect = (id: string) => {
    if (!isPro) {
      setShowUpgrade(true);
      return;
    }
    setSoundscapeId(id);
    const env = loadEnvironment(tier);
    saveEnvironment({ ...env, soundscapeId: id });
  };

  const handleVolumeChange = (v: number) => {
    setBgVolume(v);
    const env = loadEnvironment(tier);
    saveEnvironment({ ...env, bgVolume: v });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display">Environment</label>
        {!isPro && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] rounded-full border border-primary/40 text-primary bg-primary/5">
            <Lock className="w-2.5 h-2.5" /> Pro
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {AMBIENT_SOUNDSCAPES.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s.id)}
            className={`px-3 py-1.5 text-[11px] rounded-full border transition-colors whitespace-nowrap ${
              soundscapeId === s.id && isPro
                ? "border-primary bg-primary/15 text-primary font-medium"
                : !isPro
                  ? "border-border/40 text-muted-foreground/60 cursor-not-allowed"
                  : "border-border/60 text-muted-foreground hover:bg-primary/5 hover:border-primary/40"
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {isPro && soundscapeId !== "none" && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Soundscape Level</label>
          <Slider
            value={[bgVolume]}
            onValueChange={([v]) => handleVolumeChange(v)}
            max={1}
            step={0.01}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(bgVolume * 100)}%</span>
        </div>
      )}

      {showUpgrade && (
        <UpgradePrompt
          requiredTier="tier1"
          featureName="Live Soundscape Environment"
          onDismiss={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
};

export default PlayerSoundscape;

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Square, Lock, Volume2 } from "lucide-react";
import { AMBIENT_SOUNDSCAPES, HEALING_FREQUENCIES, buildDroneGraphLive, type Soundscape } from "@/lib/soundscapes";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { useTier } from "@/hooks/use-tier";
import UpgradePrompt from "@/components/UpgradePrompt";

/** 417 Hz is free for everyone. Everything else requires Elite. */
const FREE_FREQUENCY_ID = "417hz";

interface SoundscapeSelectorProps {
  soundscapeId: string;
  onSoundscapeChange: (id: string) => void;
  frequencyId: string;
  onFrequencyChange: (id: string) => void;
}

const SoundscapeSelector = ({
  soundscapeId,
  onSoundscapeChange,
  frequencyId,
  onFrequencyChange,
}: SoundscapeSelectorProps) => {
  const { tier } = useTier();
  const isElite = PAYMENTS_DISABLED || tier === "tier2";

  const currentFreqIndex = HEALING_FREQUENCIES.findIndex((f) => f.id === frequencyId);
  const currentFreq = HEALING_FREQUENCIES[currentFreqIndex >= 0 ? currentFreqIndex : 0];
  const isFreqLocked = currentFreq.id !== FREE_FREQUENCY_ID && !isElite;

  // --- Frequency preview state ---
  const [isPreviewingFreq, setIsPreviewingFreq] = useState(false);
  const freqNodesRef = useRef<AudioNode[]>([]);
  const freqCtxRef = useRef<AudioContext | null>(null);
  const freqTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Soundscape preview state ---
  const [isPreviewingSoundscape, setIsPreviewingSoundscape] = useState(false);
  const soundscapeAudioRef = useRef<HTMLAudioElement | null>(null);
  const soundscapeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showUpgrade, setShowUpgrade] = useState(false);

  // --- Frequency preview (rich drone) ---
  const stopFreqPreview = () => {
    if (freqTimerRef.current) { clearTimeout(freqTimerRef.current); freqTimerRef.current = null; }
    for (const node of freqNodesRef.current) {
      try { (node as OscillatorNode).stop?.(); } catch {}
      try { node.disconnect(); } catch {}
    }
    freqNodesRef.current = [];
    setIsPreviewingFreq(false);
  };

  const startFreqPreview = (freq: Soundscape) => {
    stopFreqPreview();
    if (!freq.frequency) return;

    if (!freqCtxRef.current) freqCtxRef.current = new AudioContext();
    const ctx = freqCtxRef.current;

    // Master gain with fade-in
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.0);
    masterGain.connect(ctx.destination);

    const nodes = buildDroneGraphLive(ctx, freq.frequency, masterGain);
    nodes.push(masterGain);

    freqNodesRef.current = nodes;
    setIsPreviewingFreq(true);
    freqTimerRef.current = setTimeout(() => stopFreqPreview(), 10000);
  };

  const handleFreqPreviewToggle = () => {
    if (isPreviewingFreq) { stopFreqPreview(); return; }
    startFreqPreview(currentFreq);
  };

  useEffect(() => {
    if (isPreviewingFreq) startFreqPreview(currentFreq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequencyId]);

  // --- Soundscape preview ---
  const stopSoundscapePreview = () => {
    if (soundscapeTimerRef.current) { clearTimeout(soundscapeTimerRef.current); soundscapeTimerRef.current = null; }
    if (soundscapeAudioRef.current) {
      soundscapeAudioRef.current.pause();
      soundscapeAudioRef.current.currentTime = 0;
      soundscapeAudioRef.current = null;
    }
    setIsPreviewingSoundscape(false);
  };

  const startSoundscapePreview = (s: Soundscape) => {
    stopSoundscapePreview();
    if (!s.path) return;

    const audio = new Audio(s.path);
    audio.volume = 0.4;
    audio.play().catch(() => {});
    soundscapeAudioRef.current = audio;
    setIsPreviewingSoundscape(true);

    soundscapeTimerRef.current = setTimeout(() => stopSoundscapePreview(), 10000);
  };

  const handleSoundscapePreviewToggle = () => {
    if (isPreviewingSoundscape) { stopSoundscapePreview(); return; }
    const selected = AMBIENT_SOUNDSCAPES.find((s) => s.id === soundscapeId);
    if (selected && selected.path) startSoundscapePreview(selected);
  };

  // Stop soundscape preview when selection changes
  useEffect(() => {
    stopSoundscapePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundscapeId]);

  // Cleanup on unmount
  useEffect(() => () => { stopFreqPreview(); stopSoundscapePreview(); }, []);

  const cycleFrequency = (direction: -1 | 1) => {
    const idx = currentFreqIndex >= 0 ? currentFreqIndex : 0;
    const next = (idx + direction + HEALING_FREQUENCIES.length) % HEALING_FREQUENCIES.length;
    const nextFreq = HEALING_FREQUENCIES[next];
    // Allow cycling to see all, but lock selection on build
    onFrequencyChange(nextFreq.id);
  };

  const selectedSoundscape = AMBIENT_SOUNDSCAPES.find((s) => s.id === soundscapeId);
  const canPreviewSoundscape = selectedSoundscape && selectedSoundscape.id !== "none" && selectedSoundscape.path;

  return (
    <div className="space-y-6">
      {/* Ambient Soundscape Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Background Soundscape</label>
          {canPreviewSoundscape && (
            <button
              onClick={handleSoundscapePreviewToggle}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] rounded-full border transition-colors ${
                isPreviewingSoundscape
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {isPreviewingSoundscape ? <Square className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
              {isPreviewingSoundscape ? "Stop" : "Preview"}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {AMBIENT_SOUNDSCAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => onSoundscapeChange(s.id)}
              className={`px-2.5 py-1.5 text-[11px] rounded-full border transition-colors whitespace-nowrap ${
                soundscapeId === s.id
                  ? "border-primary bg-primary/15 text-primary font-medium"
                  : "border-border/60 text-muted-foreground hover:bg-primary/5 hover:border-primary/40"
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Healing Frequency Carousel */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Healing Frequency</label>
        <div className={`flex items-center gap-3 p-4 rounded-xl border bg-secondary/20 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.15)] transition-colors ${
          isFreqLocked ? "border-border/40" : "border-primary/30"
        }`}>
          <button
            onClick={() => cycleFrequency(-1)}
            className="w-9 h-9 flex-shrink-0 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 text-center min-w-0">
            <p className={`text-lg font-display font-bold tracking-wide ${isFreqLocked ? "text-muted-foreground" : "text-foreground"}`}>
              {currentFreq.emoji} {currentFreq.label}
              {isFreqLocked && <Lock className="w-3.5 h-3.5 inline ml-1.5 opacity-60" />}
            </p>
            {currentFreq.description && (
              <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">
                {currentFreq.description}
              </p>
            )}
            {currentFreq.id === FREE_FREQUENCY_ID && (
              <p className="text-[10px] text-primary/70 mt-1 normal-case tracking-normal font-medium">
                ✦ Don't know where to start? Start here.
              </p>
            )}
            {isFreqLocked && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.15em] rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
              >
                <Lock className="w-2.5 h-2.5" /> Unlock with Elite
              </button>
            )}
            {!isFreqLocked && (
              <button
                onClick={handleFreqPreviewToggle}
                className={`mt-2 inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.15em] rounded-full border transition-colors ${
                  isPreviewingFreq
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {isPreviewingFreq ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                {isPreviewingFreq ? "Stop" : "Preview"}
              </button>
            )}
          </div>

          <button
            onClick={() => cycleFrequency(1)}
            className="w-9 h-9 flex-shrink-0 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showUpgrade && (
        <UpgradePrompt
          requiredTier="tier2"
          featureName="Additional Healing Frequencies"
          onDismiss={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
};

export default SoundscapeSelector;

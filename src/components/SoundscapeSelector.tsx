import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Square } from "lucide-react";
import { AMBIENT_SOUNDSCAPES, HEALING_FREQUENCIES, type Soundscape } from "@/lib/soundscapes";

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
  const currentFreqIndex = HEALING_FREQUENCIES.findIndex((f) => f.id === frequencyId);
  const currentFreq = HEALING_FREQUENCIES[currentFreqIndex >= 0 ? currentFreqIndex : 0];
  const [isPreviewing, setIsPreviewing] = useState(false);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPreview = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch {}
      oscRef.current = null;
    }
    if (gainRef.current) { gainRef.current.disconnect(); gainRef.current = null; }
    setIsPreviewing(false);
  };

  const startPreview = (freq: Soundscape) => {
    stopPreview();
    if (!freq.frequency) return;

    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;

    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq.frequency;
    osc.connect(gain);
    osc.start();
    oscRef.current = osc;
    setIsPreviewing(true);

    timerRef.current = setTimeout(() => stopPreview(), 10000);
  };

  const handlePreviewToggle = () => {
    if (isPreviewing) { stopPreview(); return; }
    startPreview(currentFreq);
  };

  // Stop & restart preview when frequency changes while previewing
  useEffect(() => {
    if (isPreviewing) {
      startPreview(currentFreq);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequencyId]);

  // Cleanup on unmount
  useEffect(() => () => stopPreview(), []);

  const cycleFrequency = (direction: -1 | 1) => {
    const idx = currentFreqIndex >= 0 ? currentFreqIndex : 0;
    const next = (idx + direction + HEALING_FREQUENCIES.length) % HEALING_FREQUENCIES.length;
    onFrequencyChange(HEALING_FREQUENCIES[next].id);
  };

  return (
    <div className="space-y-6">
      {/* Ambient Soundscape Pills */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Background Soundscape</label>
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
        <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-secondary/20 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.15)]">
          <button
            onClick={() => cycleFrequency(-1)}
            className="w-9 h-9 flex-shrink-0 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 text-center min-w-0">
            <p className="text-lg font-display font-bold text-foreground tracking-wide">
              {currentFreq.emoji} {currentFreq.label}
            </p>
            {currentFreq.description && (
              <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">
                {currentFreq.description}
              </p>
            )}
            <button
              onClick={handlePreviewToggle}
              className={`mt-2 inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.15em] rounded-full border transition-colors ${
                isPreviewing
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {isPreviewing ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
              {isPreviewing ? "Stop" : "Preview"}
            </button>
          </div>

          <button
            onClick={() => cycleFrequency(1)}
            className="w-9 h-9 flex-shrink-0 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoundscapeSelector;

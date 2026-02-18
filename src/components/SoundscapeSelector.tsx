import { ChevronLeft, ChevronRight } from "lucide-react";
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
        <div className="flex flex-wrap gap-1.5">
          {AMBIENT_SOUNDSCAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => onSoundscapeChange(s.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
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
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-secondary/20">
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

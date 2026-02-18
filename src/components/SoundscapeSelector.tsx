import { useState } from "react";
import { SOUNDSCAPES, type Soundscape } from "@/lib/soundscapes";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SoundscapeSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

const soundscapeItems = SOUNDSCAPES.filter((s) => s.group === "soundscape");
const frequencyItems = SOUNDSCAPES.filter((s) => s.group === "frequency");

const SoundscapeSelector = ({ value, onChange }: SoundscapeSelectorProps) => {
  const [showFrequencies, setShowFrequencies] = useState(
    frequencyItems.some((f) => f.id === value)
  );

  const renderButton = (s: Soundscape) => (
    <button
      key={s.id}
      onClick={() => onChange(s.id)}
      title={s.description}
      className={`px-3 py-2 min-h-[40px] text-xs rounded-full border transition-colors ${
        value === s.id
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-background text-foreground hover:bg-primary/10 hover:border-primary/50"
      }`}
    >
      {s.emoji} {s.label}
    </button>
  );

  const selected = SOUNDSCAPES.find((s) => s.id === value);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">Background Soundscape</label>
      </div>

      {/* Soundscapes */}
      <div className="flex flex-wrap gap-1.5">
        {soundscapeItems.map(renderButton)}
      </div>

      {/* Healing Frequencies toggle */}
      <button
        onClick={() => setShowFrequencies(!showFrequencies)}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-display uppercase tracking-wider"
      >
        {showFrequencies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Healing Frequencies
      </button>

      {showFrequencies && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {frequencyItems.map(renderButton)}
          </div>
          {selected?.group === "frequency" && selected.description && (
            <p className="text-[10px] text-muted-foreground italic normal-case tracking-normal">
              {selected.emoji} {selected.label} — {selected.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SoundscapeSelector;

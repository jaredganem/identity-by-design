import { SOUNDSCAPES, type Soundscape } from "@/lib/soundscapes";

interface SoundscapeSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

const SoundscapeSelector = ({ value, onChange }: SoundscapeSelectorProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">Background Soundscape</label>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SOUNDSCAPES.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`px-3 py-2 min-h-[40px] text-xs rounded-full border transition-colors ${
              value === s.id
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-background text-foreground hover:bg-primary/10 hover:border-primary/50"
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SoundscapeSelector;

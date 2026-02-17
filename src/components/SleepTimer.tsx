import { useState, useEffect, useRef } from "react";
import { Moon, TimerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TIMER_OPTIONS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "2 hr", minutes: 120 },
];

interface SleepTimerProps {
  onTimerEnd: () => void;
  isPlaying: boolean;
}

const SleepTimer = ({ onTimerEnd, isPlaying }: SleepTimerProps) => {
  const [activeMinutes, setActiveMinutes] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (activeMinutes === null) return;

    setRemainingSeconds(activeMinutes * 60);
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onTimerEnd();
          setActiveMinutes(null);
          toast({ title: "🌙 Session timer ended", description: "Playback stopped. Sweet dreams." });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeMinutes]);

  useEffect(() => {
    if (!isPlaying && activeMinutes !== null && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isPlaying && activeMinutes !== null && !intervalRef.current && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            onTimerEnd();
            setActiveMinutes(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isPlaying]);

  const cancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveMinutes(null);
    setRemainingSeconds(0);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (activeMinutes !== null) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground font-medium">{formatTime(remainingSeconds)}</span>
          <span className="text-xs text-muted-foreground">remaining</span>
        </div>
        <button onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          <TimerOff className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Moon className="w-3.5 h-3.5" /> Session Timer <span className="italic normal-case tracking-normal">(Set It. Forget It. Wake Up Different.)</span>
      </p>
      <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
        "The reason why people have so many problems is because they're out of rapport with their unconscious mind." — Milton Erickson
      </p>
      <div className="flex gap-2">
        {TIMER_OPTIONS.map((opt) => (
          <Button
            key={opt.minutes}
            variant="outline"
            size="sm"
            onClick={() => setActiveMinutes(opt.minutes)}
            className="flex-1 text-xs border-border hover:bg-primary/10 hover:border-primary/30"
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SleepTimer;

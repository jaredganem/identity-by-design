import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Trash2, Play, Pause, Plus } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FreestyleRecorderProps {
  clips: Blob[];
  onClipsChange: (clips: Blob[]) => void;
}

const FreestyleRecorder = ({ clips, onClipsChange }: FreestyleRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [playerRef, setPlayerRef] = useState<{ stop: () => void } | null>(null);
  const { toast } = useToast();

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      const blob = await audioEngine.stopRecording();
      onClipsChange([...clips, blob]);
      setIsRecording(false);
      toast({ title: "Clip saved ✓", description: `${clips.length + 1} clip${clips.length > 0 ? "s" : ""} total.` });
    } else {
      try {
        await audioEngine.startRecording();
        setIsRecording(true);
      } catch {
        toast({ variant: "destructive", title: "Microphone needed", description: "Please allow microphone access." });
      }
    }
  }, [isRecording, clips, onClipsChange, toast]);

  const handleDelete = (index: number) => {
    onClipsChange(clips.filter((_, i) => i !== index));
  };

  const handlePlayClip = async (index: number) => {
    if (playingIndex === index && playerRef) {
      playerRef.stop();
      setPlayingIndex(null);
      setPlayerRef(null);
      return;
    }

    if (playerRef) playerRef.stop();

    const ctx = audioEngine.getContext();
    const arrayBuffer = await clips[index].arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    const player = audioEngine.playBuffer(buffer);
    setPlayerRef(player);
    setPlayingIndex(index);
    setTimeout(() => {
      setPlayingIndex(null);
      setPlayerRef(null);
    }, buffer.duration * 1000);
  };

  const handleStartOver = () => {
    onClipsChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Clip list */}
      {clips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Your Clips ({clips.length})
          </p>
          <AnimatePresence>
            {clips.map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-card border border-border"
              >
                <span className="text-sm font-medium text-foreground flex-1">
                  Clip {i + 1}
                </span>
                <button
                  onClick={() => handlePlayClip(i)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {playingIndex === i ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(i)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Record area */}
      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={handleRecord}
          whileTap={{ scale: 0.95 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
            isRecording
              ? "bg-destructive shadow-[0_0_40px_hsl(0_84%_60%/0.4)]"
              : "bg-primary shadow-glow hover:shadow-[0_0_60px_hsl(42_78%_55%/0.4)]"
          }`}
        >
          {isRecording ? (
            <Square className="w-6 h-6 text-destructive-foreground" />
          ) : clips.length > 0 ? (
            <Plus className="w-6 h-6 text-primary-foreground" />
          ) : (
            <Mic className="w-6 h-6 text-primary-foreground" />
          )}
        </motion.button>

        <p className="text-sm text-muted-foreground">
          {isRecording
            ? "Recording... tap to stop"
            : clips.length > 0
            ? "Tap to add another clip"
            : "Tap to start recording"}
        </p>
      </div>

      {/* Start over */}
      {clips.length > 0 && !isRecording && (
        <div className="text-center">
          <button
            onClick={handleStartOver}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all &amp; start over
          </button>
        </div>
      )}
    </div>
  );
};

export default FreestyleRecorder;

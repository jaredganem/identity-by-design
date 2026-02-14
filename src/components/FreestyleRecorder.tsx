import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Mic, Square, Trash2, Play, Pause, Plus, GripVertical } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { useToast } from "@/hooks/use-toast";

interface FreestyleRecorderProps {
  clips: Blob[];
  onClipsChange: (clips: Blob[]) => void;
}

const FreestyleRecorder = ({ clips, onClipsChange }: FreestyleRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [playerRef, setPlayerRef] = useState<{ stop: () => void } | null>(null);
  // Stable IDs for reorder tracking
  const nextId = useRef(0);
  const [clipItems, setClipItems] = useState<{ id: number; blob: Blob }[]>([]);
  const { toast } = useToast();

  // Sync clipItems → parent clips
  const updateClips = (items: { id: number; blob: Blob }[]) => {
    setClipItems(items);
    onClipsChange(items.map((c) => c.blob));
  };

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      const blob = await audioEngine.stopRecording();
      const newItem = { id: nextId.current++, blob };
      const updated = [...clipItems, newItem];
      updateClips(updated);
      setIsRecording(false);
      toast({ title: "Clip saved ✓", description: `${updated.length} clip${updated.length > 1 ? "s" : ""} total.` });
    } else {
      try {
        await audioEngine.startRecording();
        setIsRecording(true);
      } catch {
        toast({ variant: "destructive", title: "Microphone needed", description: "Please allow microphone access." });
      }
    }
  }, [isRecording, clipItems, toast]);

  const handleDelete = (id: number) => {
    updateClips(clipItems.filter((c) => c.id !== id));
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
    const arrayBuffer = await clipItems[index].blob.arrayBuffer();
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
    setClipItems([]);
    onClipsChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Clip list — drag to reorder */}
      {clipItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Your Clips ({clipItems.length})
          </p>
          <Reorder.Group
            axis="y"
            values={clipItems}
            onReorder={updateClips}
            className="space-y-2"
          >
            <AnimatePresence>
              {clipItems.map((item, i) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-gradient-card border border-border cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
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
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
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
          ) : clipItems.length > 0 ? (
            <Plus className="w-6 h-6 text-primary-foreground" />
          ) : (
            <Mic className="w-6 h-6 text-primary-foreground" />
          )}
        </motion.button>

        <p className="text-sm text-muted-foreground">
          {isRecording
            ? "Recording... tap to stop"
            : clipItems.length > 0
            ? "Tap to add another clip"
            : "Tap to start recording"}
        </p>
      </div>

      {/* Start over */}
      {clipItems.length > 0 && !isRecording && (
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

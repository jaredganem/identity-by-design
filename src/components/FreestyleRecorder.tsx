import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Mic, Square, Trash2, Play, Pause, Plus, GripVertical, BookmarkPlus, X, Check } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { useToast } from "@/hooks/use-toast";
import { saveAffirmation } from "@/lib/affirmationLibrary";
import { AFFIRMATION_CATEGORIES } from "@/lib/affirmationPrompts";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  ...AFFIRMATION_CATEGORIES.map((c) => c.category),
  "Custom",
];

interface FreestyleRecorderProps {
  clips: Blob[];
  onClipsChange: (clips: Blob[]) => void;
  onLibraryChanged?: () => void;
}

const FreestyleRecorder = ({ clips, onClipsChange, onLibraryChanged }: FreestyleRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [playerRef, setPlayerRef] = useState<{ stop: () => void } | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saveCategory, setSaveCategory] = useState("Custom");
  const nextId = useRef(0);
  const [clipItems, setClipItems] = useState<{ id: number; blob: Blob }[]>([]);
  const { toast } = useToast();

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
    if (savingId === id) setSavingId(null);
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

  const handleSaveToLibrary = async (item: { id: number; blob: Blob }) => {
    const name = saveName.trim() || `Clip ${item.id + 1}`;
    await saveAffirmation({
      id: `freestyle-${item.id}-${Date.now()}`,
      name,
      text: name,
      category: saveCategory,
      blob: item.blob,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onLibraryChanged?.();
    setSavingId(null);
    setSaveName("");
    setSaveCategory("Custom");
    toast({ title: "Saved to Library 📚", description: `"${name}" added to ${saveCategory}.` });
  };

  const handleStartOver = () => {
    setClipItems([]);
    onClipsChange([]);
    setSavingId(null);
  };

  return (
    <div className="space-y-6">
      {clipItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Your Clips ({clipItems.length})
          </p>
          <Reorder.Group axis="y" values={clipItems} onReorder={updateClips} className="space-y-2">
            <AnimatePresence>
              {clipItems.map((item, i) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-xl bg-gradient-card border border-border cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2 p-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1">Clip {i + 1}</span>
                    <button
                      onClick={() => handlePlayClip(i)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      {playingIndex === i ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setSavingId(savingId === item.id ? null : item.id);
                        setSaveName(`Clip ${i + 1}`);
                        setSaveCategory("Custom");
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        savingId === item.id
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      }`}
                      title="Save to Library"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Save to library inline form */}
                  <AnimatePresence>
                    {savingId === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-muted-foreground font-medium">Name</label>
                            <input
                              type="text"
                              value={saveName}
                              onChange={(e) => setSaveName(e.target.value)}
                              placeholder="Name this affirmation..."
                              autoFocus
                              className="h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs text-muted-foreground font-medium">Category</label>
                            <select
                              value={saveCategory}
                              onChange={(e) => setSaveCategory(e.target.value)}
                              className="h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary w-full appearance-none z-50"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              onClick={() => handleSaveToLibrary(item)}
                              className="bg-primary text-primary-foreground h-8"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSavingId(null)}
                              className="h-8 text-muted-foreground"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
          {isRecording ? "Recording... tap to stop" : clipItems.length > 0 ? "Tap to add another clip" : "Tap to start recording"}
        </p>
      </div>

      {clipItems.length > 0 && !isRecording && (
        <div className="text-center">
          <button onClick={handleStartOver} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Clear all &amp; start over
          </button>
        </div>
      )}
    </div>
  );
};

export default FreestyleRecorder;

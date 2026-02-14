import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Check, RotateCcw, ChevronRight, ChevronLeft, Pencil } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { AFFIRMATION_CATEGORIES, getAllSlots } from "@/lib/affirmationPrompts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AffirmationRecorderProps {
  recordings: Record<string, Blob>;
  onRecordingsChange: (recordings: Record<string, Blob>) => void;
  customTexts: Record<string, string>;
  onCustomTextsChange: (texts: Record<string, string>) => void;
}

const AffirmationRecorder = ({
  recordings,
  onRecordingsChange,
  customTexts,
  onCustomTextsChange,
}: AffirmationRecorderProps) => {
  const allSlots = getAllSlots();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [editingText, setEditingText] = useState<string | null>(null);
  const { toast } = useToast();

  const currentSlot = allSlots[currentIndex];
  const displayText = customTexts[currentSlot.id] || currentSlot.suggestion;
  const hasRecording = !!recordings[currentSlot.id];
  const totalRecorded = Object.keys(recordings).length;

  // Find which category this slot belongs to
  let categoryInfo = { category: "", icon: "" };
  let slotInCategory = 0;
  let slotsInCategory = 0;
  let count = 0;
  for (const cat of AFFIRMATION_CATEGORIES) {
    if (currentIndex < count + cat.slots.length) {
      categoryInfo = cat;
      slotInCategory = currentIndex - count + 1;
      slotsInCategory = cat.slots.length;
      break;
    }
    count += cat.slots.length;
  }

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      const blob = await audioEngine.stopRecording();
      onRecordingsChange({ ...recordings, [currentSlot.id]: blob });
      setIsRecording(false);
      toast({ title: "Recorded ✓", description: `Affirmation ${currentIndex + 1} of ${allSlots.length} saved.` });
    } else {
      try {
        await audioEngine.startRecording();
        setIsRecording(true);
      } catch {
        toast({ variant: "destructive", title: "Microphone needed", description: "Please allow microphone access." });
      }
    }
  }, [isRecording, currentSlot.id, recordings, onRecordingsChange, currentIndex, allSlots.length, toast]);

  const handleReRecord = async () => {
    const updated = { ...recordings };
    delete updated[currentSlot.id];
    onRecordingsChange(updated);
  };

  const handleTextEdit = (text: string) => {
    onCustomTextsChange({ ...customTexts, [currentSlot.id]: text });
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{categoryInfo.icon} {categoryInfo.category} — {slotInCategory}/{slotsInCategory}</span>
        <span className="text-primary font-medium">{totalRecorded}/{allSlots.length} recorded</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${(totalRecorded / allSlots.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Affirmation text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlot.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="p-6 rounded-2xl bg-gradient-card border border-border"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Affirmation {currentIndex + 1} of {allSlots.length}
          </p>

          {editingText === currentSlot.id ? (
            <div className="space-y-3">
              <textarea
                value={displayText}
                onChange={(e) => handleTextEdit(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-3 font-display text-lg italic text-foreground resize-none focus:outline-none focus:border-primary"
                rows={3}
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => setEditingText(null)}
                className="bg-primary text-primary-foreground"
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <p className="font-display text-xl md:text-2xl italic text-foreground text-glow flex-1">
                "{displayText}"
              </p>
              <button
                onClick={() => setEditingText(currentSlot.id)}
                className="mt-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Edit affirmation text"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Record button */}
      <div className="flex flex-col items-center gap-3">
        {hasRecording && !isRecording ? (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" />
            </div>
          </div>
        ) : (
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
            ) : (
              <Mic className="w-6 h-6 text-primary-foreground" />
            )}
          </motion.button>
        )}

        <p className="text-sm text-muted-foreground">
          {isRecording
            ? "Recording... tap to stop"
            : hasRecording
            ? "Recorded ✓"
            : "Tap to record this affirmation"}
        </p>

        {hasRecording && !isRecording && (
          <button
            onClick={handleReRecord}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Re-record
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="text-muted-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="ghost"
          onClick={() => setCurrentIndex(Math.min(allSlots.length - 1, currentIndex + 1))}
          disabled={currentIndex === allSlots.length - 1}
          className="text-muted-foreground"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Category overview */}
      <div className="grid grid-cols-5 gap-1.5">
        {allSlots.map((slot, i) => (
          <button
            key={slot.id}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all ${
              recordings[slot.id]
                ? "bg-primary"
                : i === currentIndex
                ? "bg-primary/40"
                : "bg-secondary"
            }`}
            title={`Affirmation ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AffirmationRecorder;

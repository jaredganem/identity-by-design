import { useState, useCallback } from "react";
import RecordingCountdown from "@/components/RecordingCountdown";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Check, RotateCcw, ChevronRight, ChevronLeft, Pencil, BookmarkPlus, X, Sparkles, Loader2, Wand2 } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { AFFIRMATION_CATEGORIES, getAllSlots } from "@/lib/affirmationPrompts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveAffirmationSync as saveAffirmation } from "@/lib/cloudStorage";
import LeadCaptureGate, { hasLeadCaptured } from "@/components/LeadCaptureGate";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { supabase } from "@/integrations/supabase/client";
import { captureTranscript } from "@/lib/transcriptCapture";
import PersonalizeIntake from "@/components/PersonalizeIntake";
import { trackEvent } from "@/lib/analytics";
import { useTier } from "@/hooks/use-tier";
import { canSave, canEditPrompts, canAccessAI } from "@/lib/tierAccess";
import UpgradePrompt from "@/components/UpgradePrompt";
import { hasUsedFreeDownload } from "@/lib/freeDownloadGate";

interface AffirmationRecorderProps {
  recordings: Record<string, Blob>;
  onRecordingsChange: (recordings: Record<string, Blob>) => void;
  customTexts: Record<string, string>;
  onCustomTextsChange: (texts: Record<string, string>) => void;
  onLibraryChanged?: () => void;
}

const AffirmationRecorder = ({
  recordings,
  onRecordingsChange,
  customTexts,
  onCustomTextsChange,
  onLibraryChanged,
}: AffirmationRecorderProps) => {
  const allSlots = getAllSlots();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [libraryName, setLibraryName] = useState("");
  const [saveCategory, setSaveCategory] = useState("");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [spokenNames, setSpokenNames] = useState<Record<string, string>>({});
  const [aiNaming, setAiNaming] = useState(false);
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<"tier1" | "tier2" | null>(null);
  const { tier } = useTier();
  const speech = useSpeechRecognition();
  const { toast } = useToast();

  // (Personalize logic moved to PersonalizeIntake component)

  const handleAiNameAndCategory = async (blob: Blob) => {
    if (aiNaming || aiCategorizing) return; // prevent double calls
    setAiNaming(true);
    setAiCategorizing(true);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(new Uint8Array(arrayBuffer).reduce((d, b) => d + String.fromCharCode(b), ""));
      const { data, error } = await supabase.functions.invoke("transcribe-clip", {
        body: { audioBase64: base64, mimeType: blob.type },
      });
      if (error) throw error;
      if (data?.name) setLibraryName(data.name);
      if (data?.category) setSaveCategory(data.category);
    } catch {
      toast({ variant: "destructive", title: "AI failed", description: "Try again or fill in manually." });
    } finally {
      setAiNaming(false);
      setAiCategorizing(false);
    }
  };

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

  const startRecordingNow = useCallback(async () => {
    try {
      await audioEngine.startRecording();
      speech.start();
      setIsRecording(true);
      trackEvent("recording_started", { mode: "guided" });
    } catch {
      toast({ variant: "destructive", title: "Microphone needed", description: "Please allow microphone access." });
    }
  }, [toast]);

  const handleRecord = useCallback(async () => {
    // Gate: first record tap shows lead capture
    if (!isRecording && !hasLeadCaptured()) {
      setShowLeadCapture(true);
      return;
    }
    // Gate: free users who already downloaded cannot start a new session
    if (!isRecording && tier === "free" && hasUsedFreeDownload()) {
      setShowUpgradePrompt("tier1");
      return;
    }
    if (isRecording) {
      const autoName = speech.stop();
      const blob = await audioEngine.stopRecording();
      onRecordingsChange({ ...recordings, [currentSlot.id]: blob });
      if (autoName) {
        setSpokenNames((prev) => ({ ...prev, [currentSlot.id]: autoName }));
        captureTranscript(autoName, { category: categoryInfo.category, source: "guided" });
      }
      setIsRecording(false);
      trackEvent("recording_completed", { mode: "guided", slot: currentIndex + 1, total: allSlots.length });
      toast({ title: "Recorded ✓", description: `Affirmation ${currentIndex + 1} of ${allSlots.length} saved.` });
    } else {
      setShowCountdown(true);
    }
  }, [isRecording, currentSlot.id, recordings, onRecordingsChange, currentIndex, allSlots.length, toast, tier]);

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
      {showCountdown && (
        <RecordingCountdown
          onComplete={() => { setShowCountdown(false); startRecordingNow(); }}
          onCancel={() => setShowCountdown(false)}
        />
      )}
      {/* Personalize with AI */}
      {totalRecorded === 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <AnimatePresence mode="wait">
            {!showPersonalize ? (
              <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!canAccessAI(tier)) { setShowUpgradePrompt("tier2"); return; }
                    setShowPersonalize(true);
                  }}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isPersonalized ? "Re-personalize with AI" : "Personalize Prompts with AI"}
                </Button>
                <p className="text-xs text-muted-foreground normal-case tracking-normal text-center">
                  Tell AI your goals and it'll write all 12 affirmations for you
                </p>
              </motion.div>
            ) : (
              <PersonalizeIntake
                customTexts={customTexts}
                onCustomTextsChange={onCustomTextsChange}
                isPersonalized={isPersonalized}
                onPersonalized={() => { setShowPersonalize(false); setIsPersonalized(true); }}
                onClose={() => setShowPersonalize(false)}
                forceMode="simple"
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Progress momentum indicator */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{categoryInfo.icon} {categoryInfo.category} — {slotInCategory}/{slotsInCategory}</span>
        <span className="text-primary font-medium">{totalRecorded}/{allSlots.length} recorded</span>
      </div>

      {/* Momentum message */}
      {totalRecorded > 0 && totalRecorded < allSlots.length && (
        <motion.p
          key={totalRecorded}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs text-primary/80 font-display tracking-wide"
        >
          {totalRecorded <= 3
            ? "You're building momentum…"
            : totalRecorded <= 8
            ? "Over halfway — your identity is taking shape."
            : "Almost there. Finish strong."}
        </motion.p>
      )}

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
            <div className="space-y-3">
              <p className="font-display text-xl md:text-2xl italic text-foreground text-glow">
                "{displayText}"
              </p>
              <button
                onClick={() => {
                  if (!canEditPrompts(tier)) { setShowUpgradePrompt("tier1"); return; }
                  setEditingText(currentSlot.id);
                }}
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Record button */}
      <div className="flex flex-col items-center gap-3">
        {!hasRecording && !isRecording && (
          <p className="text-xs text-muted-foreground italic text-center normal-case tracking-normal max-w-xs">
            Speak it the way the man you're becoming would say it.
          </p>
        )}

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReRecord}
              className="border-primary/30 hover:bg-primary/10 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Re-record
            </Button>
            {!savingToLibrary ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!canSave(tier)) {
                    setShowUpgradePrompt("tier1");
                    return;
                  }
                  setLibraryName(spokenNames[currentSlot.id] || displayText.slice(0, 40));
                  setSaveCategory(categoryInfo.category);
                  setSavingToLibrary(true);
                }}
                className="border-primary/30 hover:bg-primary/10 text-primary hover:text-foreground"
              >
                <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" />
                Save to Library
              </Button>
            ) : (
              <div className="w-full space-y-2 p-3 rounded-xl bg-secondary/50 border border-border">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground font-medium">Name</label>
                    <button
                      type="button"
                      onClick={() => handleAiNameAndCategory(recordings[currentSlot.id])}
                      disabled={aiNaming || aiCategorizing}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                      {aiNaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {aiNaming ? "Naming…" : "Name with AI"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={libraryName}
                    onChange={(e) => setLibraryName(e.target.value)}
                    placeholder="Name this affirmation..."
                    autoFocus
                    className="h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground font-medium">Category</label>
                    <button
                      type="button"
                      onClick={() => handleAiNameAndCategory(recordings[currentSlot.id])}
                      disabled={aiNaming || aiCategorizing}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                    >
                      {aiCategorizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {aiCategorizing ? "Classifying…" : "Choose with AI"}
                    </button>
                  </div>
                  <select
                    value={saveCategory}
                    onChange={(e) => {
                      if (e.target.value === "__custom_new__") {
                        setSaveCategory("__custom_new__");
                        setCustomCategoryName("");
                      } else {
                        setSaveCategory(e.target.value);
                      }
                    }}
                    className="h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary w-full appearance-none z-50"
                  >
                    {AFFIRMATION_CATEGORIES.map((c) => (
                      <option key={c.category} value={c.category}>{c.icon} {c.category}</option>
                    ))}
                    <option value="Custom">🎤 Custom</option>
                    <option value="__custom_new__">✏️ Custom Category…</option>
                  </select>
                  {saveCategory === "__custom_new__" && (
                    <input
                      type="text"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="Type your category name…"
                      className="h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary w-full mt-1"
                      autoFocus
                    />
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const finalCategory = saveCategory === "__custom_new__" ? (customCategoryName.trim() || "Custom") : saveCategory;
                      await saveAffirmation({
                        id: `${currentSlot.id}-${Date.now()}`,
                        name: libraryName || displayText.slice(0, 40),
                        text: displayText,
                        category: finalCategory,
                        blob: recordings[currentSlot.id],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                      });
                      onLibraryChanged?.();
                      setSavingToLibrary(false);
                      setCustomCategoryName("");
                      trackEvent("saved_to_library", { mode: "guided", category: finalCategory });
                      toast({ title: "Saved to Library 📚", description: `"${libraryName}" added to ${finalCategory}.` });
                    }}
                    className="bg-primary text-primary-foreground h-8"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSavingToLibrary(false)}
                    className="h-8 text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={async () => {
            if (isRecording) {
              const autoName = speech.stop();
              const blob = await audioEngine.stopRecording();
              onRecordingsChange({ ...recordings, [currentSlot.id]: blob });
              if (autoName) {
                setSpokenNames((prev) => ({ ...prev, [currentSlot.id]: autoName }));
                captureTranscript(autoName, { category: categoryInfo.category, source: "guided" });
              }
              setIsRecording(false);
              toast({ title: "Recorded ✓", description: "Auto-saved before navigating." });
            }
            setCurrentIndex(Math.max(0, currentIndex - 1));
          }}
          disabled={currentIndex === 0}
          className="text-muted-foreground min-h-[44px] min-w-[44px]"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            if (isRecording) {
              const autoName = speech.stop();
              const blob = await audioEngine.stopRecording();
              onRecordingsChange({ ...recordings, [currentSlot.id]: blob });
              if (autoName) {
                setSpokenNames((prev) => ({ ...prev, [currentSlot.id]: autoName }));
                captureTranscript(autoName, { category: categoryInfo.category, source: "guided" });
              }
              setIsRecording(false);
              toast({ title: "Recorded ✓", description: "Auto-saved before navigating." });
            }
            setCurrentIndex(Math.min(allSlots.length - 1, currentIndex + 1));
          }}
          disabled={currentIndex === allSlots.length - 1}
          className="text-muted-foreground min-h-[44px] min-w-[44px]"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Category overview */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
        {allSlots.map((slot, i) => (
          <button
            key={slot.id}
            onClick={() => setCurrentIndex(i)}
            className={`min-h-[44px] min-w-[44px] rounded-lg transition-all flex items-center justify-center text-xs font-medium ${
              recordings[slot.id]
                ? "bg-primary text-primary-foreground"
                : i === currentIndex
                ? "bg-primary/30 text-foreground border border-primary/50"
                : "bg-secondary text-muted-foreground"
            }`}
            title={`Affirmation ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <LeadCaptureGate
        open={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={() => {
          setShowLeadCapture(false);
          toast({ title: "Welcome aboard 🎯", description: "You're in. Start recording your identity." });
        }}
      />
      {showUpgradePrompt && (
        <UpgradePrompt
          requiredTier={showUpgradePrompt}
          featureName={showUpgradePrompt === "tier2" ? "AI Personalization" : "Save to Library"}
          onDismiss={() => setShowUpgradePrompt(null)}
        />
      )}
    </div>
  );
};

export default AffirmationRecorder;

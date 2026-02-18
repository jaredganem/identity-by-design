import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Mic, Square, Trash2, Play, Pause, Plus, GripVertical, BookmarkPlus, X, Check, Sparkles, Loader2, Wand2 } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { useToast } from "@/hooks/use-toast";
import { saveAffirmation } from "@/lib/affirmationLibrary";
import { AFFIRMATION_CATEGORIES } from "@/lib/affirmationPrompts";
import { Button } from "@/components/ui/button";
import LeadCaptureGate, { hasLeadCaptured } from "@/components/LeadCaptureGate";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { supabase } from "@/integrations/supabase/client";
import { captureTranscript } from "@/lib/transcriptCapture";
import PersonalizeIntake from "@/components/PersonalizeIntake";
import { trackEvent } from "@/lib/analytics";

const CATEGORIES = [
  ...AFFIRMATION_CATEGORIES.map((c) => c.category),
  "Custom",
  "__custom_new__",
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
  const [customCategoryName, setCustomCategoryName] = useState("");
  const nextId = useRef(0);
  const [clipItems, setClipItems] = useState<{ id: number; blob: Blob; autoName?: string }[]>([]);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [aiNaming, setAiNaming] = useState(false);
  const [aiCategorizing, setAiCategorizing] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [deepDiveComplete, setDeepDiveComplete] = useState(false);
  const [generatedAffirmations, setGeneratedAffirmations] = useState<Record<string, string>>({});
  const [scriptIndex, setScriptIndex] = useState(0);
  const speech = useSpeechRecognition();
  const { toast } = useToast();

  const handleAiNameAndCategory = async (blob: Blob) => {
    if (aiNaming || aiCategorizing) return;
    setAiNaming(true);
    setAiCategorizing(true);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(new Uint8Array(arrayBuffer).reduce((d, b) => d + String.fromCharCode(b), ""));
      const { data, error } = await supabase.functions.invoke("transcribe-clip", {
        body: { audioBase64: base64, mimeType: blob.type },
      });
      if (error) throw error;
      if (data?.name) setSaveName(data.name);
      if (data?.category) setSaveCategory(data.category);
    } catch {
      toast({ variant: "destructive", title: "AI failed", description: "Try again or fill in manually." });
    } finally {
      setAiNaming(false);
      setAiCategorizing(false);
    }
  };

  const updateClips = (items: { id: number; blob: Blob; autoName?: string }[]) => {
    setClipItems(items);
    onClipsChange(items.map((c) => c.blob));
  };

  const handleRecord = useCallback(async () => {
    // Gate: first record tap shows lead capture
    if (!isRecording && !hasLeadCaptured()) {
      setShowLeadCapture(true);
      return;
    }
    if (isRecording) {
      const autoName = speech.stop();
      const blob = await audioEngine.stopRecording();
      const newItem = { id: nextId.current++, blob, autoName };
      const updated = [...clipItems, newItem];
      updateClips(updated);
      setIsRecording(false);
      // Capture transcript for trend analysis (anonymous)
      if (autoName) captureTranscript(autoName, { source: "freestyle" });
      toast({ title: "Clip saved ✓", description: `${updated.length} clip${updated.length > 1 ? "s" : ""} total.` });
    } else {
      try {
        await audioEngine.startRecording();
        speech.start();
        setIsRecording(true);
        trackEvent("recording_started", { mode: "freestyle" });
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

  const handleSaveToLibrary = async (item: { id: number; blob: Blob; autoName?: string }) => {
    const name = saveName.trim() || item.autoName || `Clip ${item.id + 1}`;
    const finalCategory = saveCategory === "__custom_new__" ? (customCategoryName.trim() || "Custom") : saveCategory;
    await saveAffirmation({
      id: `freestyle-${item.id}-${Date.now()}`,
      name,
      text: name,
      category: finalCategory,
      blob: item.blob,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    onLibraryChanged?.();
    setSavingId(null);
    setSaveName("");
    setSaveCategory("Custom");
    setCustomCategoryName("");
    trackEvent("saved_to_library", { mode: "freestyle", category: finalCategory });
    toast({ title: "Saved to Library 📚", description: `"${name}" added to ${finalCategory}.` });
  };

  const handleStartOver = () => {
    setClipItems([]);
    onClipsChange([]);
    setSavingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Deep Dive AI Personalization */}
      {clipItems.length === 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <AnimatePresence mode="wait">
            {!showDeepDive ? (
              <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeepDive(true)}
                  className="border-primary/30 hover:bg-primary/10 text-primary"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {deepDiveComplete ? "Redo Deep Dive" : "🧠 Answer 5 Identity Questions"}
                </Button>
                <p className="text-xs text-muted-foreground normal-case tracking-normal text-center">
                  AI crafts your custom affirmation script from your answers
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>
                <p className="text-xs text-muted-foreground normal-case tracking-normal text-center">
                  Already know your affirmations? Skip this and <span className="text-primary font-medium">record your own</span> below ↓
                </p>
              </motion.div>
            ) : (
              <PersonalizeIntake
                isPersonalized={deepDiveComplete}
                onPersonalized={() => { setShowDeepDive(false); setDeepDiveComplete(true); }}
                onClose={() => setShowDeepDive(false)}
                forceMode="advanced"
                onAdvancedResults={(_answers, affirmations) => {
                  setGeneratedAffirmations(affirmations);
                  setScriptIndex(0);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Generated affirmations as recording prompts */}
      {deepDiveComplete && Object.keys(generatedAffirmations).length > 0 && clipItems.length === 0 && (() => {
        const entries = Object.entries(generatedAffirmations);
        const total = entries.length;
        const [key, text] = entries[scriptIndex] || [];
        if (!key) return null;
        return (
          <div className="rounded-xl border border-border bg-gradient-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium">Your AI-Generated Identity Script</p>
              <span className="text-xs text-muted-foreground">{scriptIndex + 1} of {total}</span>
            </div>
            <div className="flex gap-1">
              {entries.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= scriptIndex ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={scriptIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-sm text-foreground italic py-2"
              >
                "{text}"
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground normal-case tracking-normal">
              Read this aloud as you record your clip below ↓
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScriptIndex((i) => Math.max(0, i - 1))}
                disabled={scriptIndex === 0}
                className="h-8"
              >
                ← Back
              </Button>
              <Button
                size="sm"
                onClick={() => setScriptIndex((i) => Math.min(total - 1, i + 1))}
                disabled={scriptIndex >= total - 1}
                className="bg-primary text-primary-foreground h-8"
              >
                Next →
              </Button>
            </div>
          </div>
        );
      })()}

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
                    <span className="text-sm font-medium text-foreground flex-1">{item.autoName || `Clip ${i + 1}`}</span>
                    <button
                      onClick={() => handlePlayClip(i)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      {playingIndex === i ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setSavingId(savingId === item.id ? null : item.id);
                        setSaveName(item.autoName || `Clip ${i + 1}`);
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
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-muted-foreground font-medium">Name</label>
                              <button
                                type="button"
                                onClick={() => handleAiNameAndCategory(item.blob)}
                                disabled={aiNaming || aiCategorizing}
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                              >
                                {aiNaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                {aiNaming ? "Naming…" : "Name with AI"}
                              </button>
                            </div>
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
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-muted-foreground font-medium">Category</label>
                              <button
                                type="button"
                                onClick={() => handleAiNameAndCategory(item.blob)}
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
                              {CATEGORIES.filter((c) => c !== "__custom_new__").map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                              <option value="__custom_new__">✏️ Custom Category…</option>
                            </select>
                            {saveCategory === "__custom_new__" && (
                              <input
                                type="text"
                                value={customCategoryName}
                                onChange={(e) => setCustomCategoryName(e.target.value)}
                                placeholder="Type your category name…"
                                className="h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary w-full mt-1.5"
                                autoFocus
                              />
                            )}
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

      <LeadCaptureGate
        open={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={() => {
          setShowLeadCapture(false);
          toast({ title: "Welcome aboard 🎯", description: "You're in. Start recording your identity." });
        }}
      />
    </div>
  );
};

export default FreestyleRecorder;

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, X, Loader2, Wand2, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { supabase } from "@/integrations/supabase/client";
import { captureTranscript } from "@/lib/transcriptCapture";
import { useToast } from "@/hooks/use-toast";

const ADVANCED_STEPS = [
  {
    key: "outcomes",
    label: "Step 1 of 5",
    question: "What's your ideal life look like — on your terms?",
    subtext: "Be specific. Be measurable. Put a time frame on it. What are the biggest outcomes you want to achieve?",
    placeholder: "e.g. Build my business to $25k/mo by Dec 2025, get to 185lbs lean, be fully present with my family every evening...",
    emoji: "🎯",
  },
  {
    key: "identity_gaps",
    label: "Step 2 of 5",
    question: "Who do you want to become?",
    subtext: "Who do you want to BE that you're not being? What do you want to DO that you're not doing? What do you want to HAVE that you don't have yet?",
    placeholder: "e.g. I want to be the leader my team needs, I want to be disciplined with my health, I want to show up confident in every room...",
    emoji: "🪞",
  },
  {
    key: "blockers",
    label: "Step 3 of 5",
    question: "What's in the way?",
    subtext: "Name the top 1–3 things stopping you. Be honest — beliefs, habits, fears, patterns. Call them out by name.",
    placeholder: "e.g. Self-doubt, procrastination, fear of judgment, lack of discipline...",
    emoji: "🧱",
  },
  {
    key: "peak_identity",
    label: "Step 4 of 5",
    question: "Think of a time you were ON. What did that look like?",
    subtext: "You've already been this version of yourself — even if just for a moment. How did you carry yourself? How did people experience you?",
    placeholder: "e.g. I was decisive, calm, magnetic. I took action without hesitation. People looked to me for direction...",
    emoji: "👑",
  },
  {
    key: "negative_patterns",
    label: "Step 5 of 5",
    question: "When you're NOT at your best, what shows up?",
    subtext: "Anger? Doubt? Avoidance? Name the patterns that hijack you so the AI can reframe them into power.",
    placeholder: "e.g. Anger, self-sabotage, overthinking, comparison, laziness, resentment...",
    emoji: "🔥",
  },
];

type IntakeMode = "choose" | "simple" | "advanced";

interface PersonalizeIntakeProps {
  customTexts?: Record<string, string>;
  onCustomTextsChange?: (texts: Record<string, string>) => void;
  isPersonalized: boolean;
  onPersonalized: () => void;
  onClose: () => void;
  /** Force a specific mode — skips the chooser */
  forceMode?: "simple" | "advanced";
  /** Called with raw advanced answers for custom script generation */
  onAdvancedResults?: (answers: Record<string, string>, affirmations: Record<string, string>) => void;
}

const PersonalizeIntake = ({
  customTexts = {},
  onCustomTextsChange,
  isPersonalized,
  onPersonalized,
  onClose,
  forceMode,
  onAdvancedResults,
}: PersonalizeIntakeProps) => {
  const [mode, setMode] = useState<IntakeMode>(forceMode || "choose");
  const [simpleGoal, setSimpleGoal] = useState("");
  const [advancedAnswers, setAdvancedAnswers] = useState<Record<string, string>>({});
  const [advancedStep, setAdvancedStep] = useState(0);
  const [personalizing, setPersonalizing] = useState(false);
  const [goalListening, setGoalListening] = useState(false);
  const speech = useSpeechRecognition();
  const { toast } = useToast();

  const currentStepKey = ADVANCED_STEPS[advancedStep]?.key || "";

  const handleMicToggle = useCallback(() => {
    if (goalListening) {
      const heard = speech.stop();
      setGoalListening(false);
      const spoken = speech.transcript || heard;
      if (spoken) {
        if (mode === "simple") {
          setSimpleGoal((prev) => (prev ? `${prev} ${spoken}` : spoken));
        } else {
          setAdvancedAnswers((prev) => ({
            ...prev,
            [currentStepKey]: prev[currentStepKey] ? `${prev[currentStepKey]} ${spoken}` : spoken,
          }));
        }
      }
    } else {
      speech.start();
      setGoalListening(true);
    }
  }, [goalListening, speech, mode, currentStepKey]);

  const handleSubmit = async () => {
    if (goalListening) {
      const heard = speech.stop();
      setGoalListening(false);
      const spoken = speech.transcript || heard;
      if (spoken) {
        if (mode === "simple") setSimpleGoal((p) => (p ? `${p} ${spoken}` : spoken));
        else setAdvancedAnswers((p) => ({ ...p, [currentStepKey]: p[currentStepKey] ? `${p[currentStepKey]} ${spoken}` : spoken }));
      }
    }

    setPersonalizing(true);
    try {
      let body: any;
      if (mode === "simple") {
        const goalText = simpleGoal.trim();
        if (!goalText) return;
        body = { goals: goalText };
        captureTranscript(goalText, { category: "user_goals", source: "ai_generated" });
      } else {
        body = { advancedIntake: advancedAnswers };
        // Capture each answer for trend analysis
        Object.entries(advancedAnswers).forEach(([key, val]) => {
          if (val.trim()) captureTranscript(val, { category: key, source: "ai_generated" });
        });
      }

      const { data, error } = await supabase.functions.invoke("personalize-prompts", { body });
      if (error) throw error;

      const affirmations: Record<string, string> = data?.affirmations || {};
      if (Object.keys(affirmations).length > 0) {
        if (onCustomTextsChange) {
          onCustomTextsChange({ ...customTexts, ...affirmations });
        }
        if (onAdvancedResults && mode === "advanced") {
          onAdvancedResults(advancedAnswers, affirmations);
        }
        Object.values(affirmations).forEach((text) => captureTranscript(text, { source: "ai_generated" }));
        onPersonalized();
        toast({
          title: "✨ Prompts personalized",
          description: mode === "advanced"
            ? "Your deep-dive answers have been transformed into 12 identity affirmations."
            : "All 12 affirmations have been tailored to your goals.",
        });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Personalization failed", description: e?.message || "Try again." });
    } finally {
      setPersonalizing(false);
    }
  };

  const currentAnswer = mode === "simple" ? simpleGoal : (advancedAnswers[currentStepKey] || "");
  const currentDisplay = goalListening
    ? (currentAnswer ? `${currentAnswer} ${speech.transcript}` : speech.transcript)
    : currentAnswer;

  return (
    <AnimatePresence mode="wait">
      {/* Mode Selection */}
      {mode === "choose" && (
        <motion.div key="choose" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
          <p className="text-sm font-medium text-foreground normal-case tracking-normal text-center">
            How deep do you want to go?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("simple")}
              className="rounded-xl border border-border bg-background p-4 text-left space-y-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Simple</span>
              </div>
              <p className="text-xs text-muted-foreground normal-case tracking-normal">
                Type or speak your goals — AI generates your affirmations
              </p>
            </button>
            <button
              onClick={() => setMode("advanced")}
              className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-left space-y-2 hover:border-primary hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Deep Dive</span>
              </div>
              <p className="text-xs text-muted-foreground normal-case tracking-normal">
                5 identity questions — AI crafts precise, reframed affirmations
              </p>
            </button>
          </div>
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-muted-foreground">
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Simple Mode */}
      {mode === "simple" && (
        <motion.div key="simple" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
          <p className="text-sm font-medium text-foreground normal-case tracking-normal">
            ✍️ Type your goals or 🎙️ speak them — AI does the rest
          </p>
          <p className="text-xs text-muted-foreground normal-case tracking-normal">
            Describe the outcomes, targets, and the man you're becoming:
          </p>
          <textarea
            value={currentDisplay}
            onChange={(e) => setSimpleGoal(e.target.value)}
            placeholder="e.g. I want to hit 185lbs lean, build my business to $25k/mo, be more present with my wife and kids, and develop unshakeable confidence..."
            rows={3}
            autoFocus
            disabled={goalListening}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary resize-none"
          />
          <div className="flex gap-2 flex-wrap">
            {speech.supported && (
              <Button
                type="button"
                size="sm"
                variant={goalListening ? "default" : "outline"}
                onClick={handleMicToggle}
                disabled={personalizing}
                className={`h-9 ${goalListening ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "border-muted-foreground/30 text-muted-foreground hover:bg-muted/50"}`}
              >
                {goalListening ? <Square className="w-4 h-4 mr-1.5" /> : <Mic className="w-4 h-4 mr-1.5" />}
                {goalListening ? "Stop Listening" : "🎙️ Speak Instead"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!simpleGoal.trim() || personalizing}
              className="bg-primary text-primary-foreground h-9"
            >
              {personalizing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
              {personalizing ? "Creating your prompts…" : "✨ Generate My Affirmations"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMode("choose")} className="h-9 text-muted-foreground">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </div>
        </motion.div>
      )}

      {/* Advanced Mode */}
      {mode === "advanced" && (
        <motion.div key={`advanced-${advancedStep}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">
              {ADVANCED_STEPS[advancedStep].emoji} {ADVANCED_STEPS[advancedStep].label}
            </span>
            <div className="flex gap-1">
              {ADVANCED_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === advancedStep ? "bg-primary" : i < advancedStep && advancedAnswers[ADVANCED_STEPS[i].key]?.trim() ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-sm font-medium text-foreground normal-case tracking-normal leading-snug">
            {ADVANCED_STEPS[advancedStep].question}
          </p>
          {ADVANCED_STEPS[advancedStep].subtext && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {ADVANCED_STEPS[advancedStep].subtext}
            </p>
          )}

          <textarea
            value={currentDisplay}
            onChange={(e) => setAdvancedAnswers((prev) => ({ ...prev, [currentStepKey]: e.target.value }))}
            placeholder={ADVANCED_STEPS[advancedStep].placeholder}
            rows={3}
            autoFocus
            disabled={goalListening}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary resize-none"
          />

          <div className="flex gap-2 flex-wrap">
            {speech.supported && (
              <Button
                type="button"
                size="sm"
                variant={goalListening ? "default" : "outline"}
                onClick={handleMicToggle}
                disabled={personalizing}
                className={`h-9 ${goalListening ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "border-muted-foreground/30 text-muted-foreground hover:bg-muted/50"}`}
              >
                {goalListening ? <Square className="w-4 h-4 mr-1.5" /> : <Mic className="w-4 h-4 mr-1.5" />}
                {goalListening ? "Stop" : "🎙️"}
              </Button>
            )}

            {advancedStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { if (goalListening) { speech.stop(); setGoalListening(false); } setAdvancedStep((s) => s - 1); }}
                className="h-9"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}

            {advancedStep < ADVANCED_STEPS.length - 1 ? (
              <Button
                size="sm"
                onClick={() => { if (goalListening) { const h = speech.stop(); setGoalListening(false); if (h) setAdvancedAnswers(p => ({ ...p, [currentStepKey]: p[currentStepKey] ? `${p[currentStepKey]} ${h}` : h })); } setAdvancedStep((s) => s + 1); }}
                disabled={!currentAnswer.trim() && !speech.transcript.trim()}
                className="bg-primary text-primary-foreground h-9"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={personalizing}
                className="bg-primary text-primary-foreground h-9"
              >
                {personalizing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                {personalizing ? "Crafting your identity…" : "✨ Generate My Affirmations"}
              </Button>
            )}

            {advancedStep === 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMode("choose")} className="h-9 text-muted-foreground">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PersonalizeIntake;

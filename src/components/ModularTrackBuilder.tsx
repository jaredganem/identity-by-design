import { useState, useRef, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Download, Loader2, X, GripVertical, Library, Mic, Plus, Sparkles, Shuffle, Send, Save } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { getSubliminalPrefs, saveSubliminalPrefs } from "@/lib/subliminalEngine";
import { useToast } from "@/hooks/use-toast";
import SleepTimer from "@/components/SleepTimer";
import GoDeeper from "@/components/GoDeeper";
import AffirmationLibrary from "@/components/AffirmationLibrary";
import { type SavedAffirmation } from "@/lib/affirmationLibrary";
import { getAllAffirmationsSync as getAllAffirmations } from "@/lib/cloudStorage";
import { supabase } from "@/integrations/supabase/client";
import { useTier } from "@/hooks/use-tier";
import { canAccessLibrary, canBuildTracks, canAccessAI } from "@/lib/tierAccess";
import UpgradePrompt from "@/components/UpgradePrompt";
import LeadCaptureGate, { hasLeadCaptured } from "@/components/LeadCaptureGate";
import SoundscapeSelector from "@/components/SoundscapeSelector";
import { getSoundscapeById, getFrequencyById, loadSoundscapeBuffer } from "@/lib/soundscapes";

interface ModularTrackBuilderProps {
  refreshKey?: number;
}

const ModularTrackBuilder = ({ refreshKey = 0 }: ModularTrackBuilderProps) => {
  const { tier } = useTier();
  const [selectedItems, setSelectedItems] = useState<SavedAffirmation[]>([]);
  const [reverbAmount, setReverbAmount] = useState(0.5);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [loopCount, setLoopCount] = useState(3);
  const [soundscapeId, setSoundscapeId] = useState("ocean");
  const [frequencyId, setFrequencyId] = useState("417hz");
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState("");
  const [aiMode, setAiMode] = useState<null | "surprise" | "goal">(null);
  const [goalText, setGoalText] = useState("");
  const [aiBuildingTrack, setAiBuildingTrack] = useState(false);
  const [allLibraryItems, setAllLibraryItems] = useState<SavedAffirmation[]>([]);
  const playbackRef = useRef<{ stop: () => void } | null>(null);
  const { toast } = useToast();
  const [hasLibraryItems, setHasLibraryItems] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);

  useEffect(() => {
    const checkLibrary = async () => {
      const items = await getAllAffirmations();
      setAllLibraryItems(items);
      setHasLibraryItems(items.length > 0);
    };
    checkLibrary();
  }, [refreshKey]);

  // Gate: Lead capture first, then tier check
  if (!hasLeadCaptured()) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Enter your email to unlock the Track Builder.</p>
          <Button onClick={() => setShowLeadCapture(true)}>Get Started</Button>
        </div>
        <LeadCaptureGate open={showLeadCapture} onClose={() => setShowLeadCapture(false)} onSuccess={() => { setShowLeadCapture(false); window.location.reload(); }} />
      </>
    );
  }

  if (!canAccessLibrary(tier)) {
    return <UpgradePrompt requiredTier="tier1" featureName="Track Builder" inline />;
  }

  const handleToggleSelect = (item: SavedAffirmation) => {
    setSelectedItems((prev) => {
      const exists = prev.find((s) => s.id === item.id);
      if (exists) return prev.filter((s) => s.id !== item.id);
      return [...prev, item];
    });
  };

  const handleRemove = (id: string) => {
    setSelectedItems((prev) => prev.filter((s) => s.id !== id));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= selectedItems.length) return;
    const updated = [...selectedItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSelectedItems(updated);
  };

  const handleBuild = async () => {
    if (selectedItems.length === 0) return;
    trackEvent("track_build_started", { mode: "library", items: selectedItems.length, loop_count: loopCount });
    setIsProcessing(true);
    setFinalBlob(null);

    try {
      setProgress("Decoding recordings...");
      const decodedBuffers = await Promise.all(
        selectedItems.map((item) => audioEngine.decodeBlob(item.blob))
      );

      setProgress("Stringing affirmations together...");
      const concatenated = audioEngine.concatenateBuffers(decodedBuffers, 1.5);

      setProgress("Adding depth effect...");
      let processed = await audioEngine.applyReverbToBuffer(concatenated, reverbAmount);

      if (vocalVolume < 1.0) {
        const ctx = audioEngine.getContext();
        const scaled = ctx.createBuffer(processed.numberOfChannels, processed.length, processed.sampleRate);
        for (let ch = 0; ch < processed.numberOfChannels; ch++) {
          const input = processed.getChannelData(ch);
          const output = scaled.getChannelData(ch);
          for (let i = 0; i < input.length; i++) {
            output[i] = input[i] * vocalVolume;
          }
        }
        processed = scaled;
      }

      setProgress("Loading background layers...");
      const soundscape = getSoundscapeById(soundscapeId);
      const effectiveFreqId = (tier === "free" || tier === "tier1") && frequencyId !== "417hz" ? "417hz" : frequencyId;
      const frequency = getFrequencyById(effectiveFreqId);
      const bgBuffer = soundscape && soundscape.id !== "none" ? await loadSoundscapeBuffer(soundscape, (b) => audioEngine.decodeBlob(b)) : null;
      const freqBuffer = frequency ? await loadSoundscapeBuffer(frequency, (b) => audioEngine.decodeBlob(b)) : null;

      setProgress(`Mixing — ${loopCount}x repetitions...`);
      const finalBuffer = await audioEngine.mixWithBackgroundAndLoop(processed, bgBuffer, bgVolume, loopCount, freqBuffer, bgVolume);

      setProgress("Building your installation...");
      const wavBlob = audioEngine.audioBufferToWav(finalBuffer);
      setFinalBlob(wavBlob);
      import("@/lib/streakTracker").then(({ logActivity }) => logActivity("track_build"));
      import("@/lib/challengeTracker").then(({ logChallengeDay }) => logChallengeDay());

      const durationMin = Math.round(finalBuffer.length / finalBuffer.sampleRate / 60);
      toast({
        title: "🎧 Your installation is ready",
        description: `${durationMin} minute installation from ${selectedItems.length} identity statements.`,
      });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Processing error", description: "Something went wrong." });
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  const stopPlayback = () => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    setIsPlaying(false);
  };

  const handlePlayback = async () => {
    if (!finalBlob) return;
    if (isPlaying) { stopPlayback(); return; }

    const ctx = audioEngine.getContext();
    const arrayBuffer = await finalBlob.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    const player = audioEngine.playBuffer(buffer);
    playbackRef.current = player;
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), buffer.duration * 1000);
  };

  const handleDownload = () => {
    if (!finalBlob) return;
    trackEvent("download_completed", { mode: "library" });
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "identity-installation.wav";
    a.click();
    URL.revokeObjectURL(url);
  };


  const handleAiBuildTrack = async (goal?: string) => {
    if (allLibraryItems.length === 0) {
      toast({ variant: "destructive", title: "Library empty", description: "Record some affirmations first." });
      return;
    }
    setAiBuildingTrack(true);
    try {
      const itemsSummary = allLibraryItems.map((i) => ({ id: i.id, name: i.name, category: i.category }));
      const { data, error } = await supabase.functions.invoke("build-track", {
        body: { items: itemsSummary, goal: goal || "" },
      });
      if (error) throw error;
      const selectedIds: string[] = data?.selectedIds || [];
      // Map IDs back to full items, preserving AI's order
      const idToItem = new Map(allLibraryItems.map((i) => [i.id, i]));
      const ordered = selectedIds.map((id) => idToItem.get(id)).filter(Boolean) as SavedAffirmation[];
      setSelectedItems(ordered);
      setAiMode(null);
      setGoalText("");
      toast({
        title: "🤖 AI track built",
        description: `${ordered.length} statement${ordered.length !== 1 ? "s" : ""} selected${goal ? " based on your goal" : " — a balanced mix"}.`,
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "AI track failed", description: e?.message || "Try again." });
    } finally {
      setAiBuildingTrack(false);
    }
  };

  if (!hasLibraryItems && selectedItems.length === 0 && !finalBlob) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-sm text-muted-foreground normal-case tracking-normal">
          Your library is empty — nothing to build with yet.
        </p>
        <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit." — Will Durant
        </p>
        <p className="text-xs text-primary normal-case tracking-normal">
          Go record your first statement to get started →
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-2xl text-foreground">Build Your Nightly Identity Installation</h3>
        <p className="text-sm text-muted-foreground mt-1 normal-case tracking-normal">
          Select statements from your library, then arrange them into your track below.
        </p>
      </div>

      {/* AI Track Builder */}
      {hasLibraryItems && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <AnimatePresence mode="wait">
            {!aiMode ? (
              <motion.div key="buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAiBuildTrack()}
                  disabled={aiBuildingTrack}
                  className="flex-1 border-primary/30 hover:bg-primary/10 text-primary"
                >
                  {aiBuildingTrack ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shuffle className="w-4 h-4 mr-2" />}
                  Surprise Me
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAiMode("goal")}
                  disabled={aiBuildingTrack}
                  className="flex-1 border-primary/30 hover:bg-primary/10 text-primary"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Tell AI Your Focus
                </Button>
              </motion.div>
            ) : (
              <motion.div key="goal-input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                <p className="text-xs text-muted-foreground normal-case tracking-normal">
                  Pick a theme or type your own focus:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "⭐ Best of Everything", goal: "pick the strongest, most impactful statements across all categories for a complete identity installation" },
                    { label: "🔥 Confidence", goal: "confidence, self-belief, and inner strength" },
                    { label: "💰 Wealth & Abundance", goal: "financial success, abundance, and money mastery" },
                    { label: "⚔️ Discipline & Drive", goal: "discipline, consistency, and relentless drive" },
                    { label: "💪 Health & Vitality", goal: "physical health, energy, and peak performance" },
                    { label: "👑 Leadership & Power", goal: "leadership, influence, and commanding presence" },
                    { label: "🦁 Masculinity", goal: "masculine energy, strength, and grounded manhood" },
                    { label: "🚀 Career & Success", goal: "career growth, achievement, and professional excellence" },
                    { label: "🤝 Relationships", goal: "deep relationships, connection, and trust" },
                    { label: "🙏 Spirituality", goal: "spiritual growth, inner peace, purpose, and connection to something greater" },
                  ].map((theme) => (
                    <button
                      key={theme.label}
                      onClick={() => { setGoalText(theme.goal); handleAiBuildTrack(theme.goal); }}
                      disabled={aiBuildingTrack}
                      className="px-3 py-2 min-h-[44px] text-xs rounded-full border border-primary/30 bg-background text-foreground hover:bg-primary/10 hover:border-primary/50 transition-colors disabled:opacity-50"
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goalText.trim() && handleAiBuildTrack(goalText)}
                    placeholder="Or type your own focus…"
                    autoFocus
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAiBuildTrack(goalText)}
                    disabled={!goalText.trim() || aiBuildingTrack}
                    className="bg-primary text-primary-foreground h-10 px-4"
                  >
                    {aiBuildingTrack ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAiMode(null); setGoalText(""); }}
                    className="h-10 text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-xs text-center text-muted-foreground normal-case tracking-normal">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Let AI build your track for you
          </p>
        </div>
      )}

      {/* Library picker — always visible on top */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Library className="w-3.5 h-3.5" />
          Your Saved Library
        </p>
        <div className="rounded-2xl border border-border bg-secondary/10 p-3">
          <AffirmationLibrary
            selectable
            selectedIds={selectedItems.map((s) => s.id)}
            onToggleSelect={handleToggleSelect}
            refreshKey={refreshKey}
            emptyQuote={{ text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" }}
            emptyMessage="Record your first identity statement above, then come back here to build."
          />
        </div>
      </div>

      {/* Selected track list */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {selectedItems.length > 0
            ? `Your Track — ${selectedItems.length} statement${selectedItems.length !== 1 ? "s" : ""}`
            : "Your Track — select statements above"}
        </p>
        <div className="rounded-2xl border border-border bg-gradient-card p-3 min-h-[80px]">
          {selectedItems.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-sm text-muted-foreground normal-case tracking-normal">
              Tap the circles above to add statements to your track
            </div>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {selectedItems.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 border border-primary/30"
                >
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveItem(i, -1)}
                        disabled={i === 0}
                        className="min-w-[44px] min-h-[22px] text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs flex items-center justify-center"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveItem(i, 1)}
                        disabled={i === selectedItems.length - 1}
                        className="min-w-[44px] min-h-[22px] text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs flex items-center justify-center"
                      >
                        ▼
                      </button>
                    </div>
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.name}</p>
                  </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="min-w-[44px] min-h-[44px] p-2 rounded text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visual distinction hint */}
      {selectedItems.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground normal-case tracking-normal">
            Highlighted items are in your track. Tap the <span className="text-primary font-medium">+</span> on unselected items to add them.
          </p>
        </div>
      )}
      {/* Mix controls */}
      {selectedItems.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-card border border-border space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Your Voice Level</label>
              <span className="text-xs text-muted-foreground">{Math.round(vocalVolume * 100)}%</span>
            </div>
            <Slider value={[vocalVolume]} onValueChange={([v]) => setVocalVolume(v)} max={1} step={0.01} className="w-full" />
          </div>

          <SoundscapeSelector soundscapeId={soundscapeId} onSoundscapeChange={setSoundscapeId} frequencyId={frequencyId} onFrequencyChange={setFrequencyId} />

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Soundscape Level</label>
              <span className="text-xs text-muted-foreground">{Math.round(bgVolume * 100)}%</span>
            </div>
            <Slider value={[bgVolume]} onValueChange={([v]) => setBgVolume(v)} max={1} step={0.01} className="w-full" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Depth Effect <span className="font-normal text-muted-foreground">(Creates That Trancy Feel)</span></label>
              <span className="text-xs text-muted-foreground">{Math.round(reverbAmount * 100)}%</span>
            </div>
            <Slider value={[reverbAmount]} onValueChange={([v]) => setReverbAmount(v)} max={1} step={0.01} className="w-full" />
          </div>

          {/* Subliminal Layer */}
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Subliminal Layer</label>
              <p className="text-xs text-muted-foreground normal-case tracking-normal mt-0.5">Your voice plays beneath the mix at near-inaudible volume</p>
            </div>
            <Switch
              checked={getSubliminalPrefs().intensity !== "off"}
              onCheckedChange={(checked) => {
                const prefs = getSubliminalPrefs();
                saveSubliminalPrefs({ ...prefs, intensity: checked ? "low" : "off" });
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Repetitions <span className="font-normal text-muted-foreground">(Repetition = Installation)</span></label>
              <span className="text-xs text-muted-foreground">{loopCount}× repeat</span>
            </div>
            <Slider value={[loopCount]} onValueChange={([v]) => setLoopCount(v)} min={1} max={10} step={1} className="w-full" />
          </div>

          <Button
            onClick={handleBuild}
            disabled={isProcessing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
          >
            {isProcessing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Processing..."}</>
            ) : (
              `🎧 Build Installation from ${selectedItems.length} Statement${selectedItems.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      )}

      {/* Playback */}
      {finalBlob && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-gradient-card border border-primary/30 shadow-glow space-y-5"
        >
          <h4 className="font-display text-2xl text-foreground text-center tracking-[0.06em]">Your Installation Is Ready.</h4>

          <div className="text-center space-y-3 py-2">
            <p className="text-sm text-muted-foreground normal-case tracking-normal leading-relaxed">
              Tonight:
              <br />
              Put your headphones in.
              <br />
              Set the timer for 30 minutes.
              <br />
              Close your eyes as you drift off.
              <br />
              Let your own voice do the rest.
            </p>
            <p className="text-sm text-foreground normal-case tracking-normal leading-relaxed mt-4">
              Tomorrow you'll wake up the same man.
              <br />
              But something will have shifted underneath.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <Button onClick={handlePlayback} variant="outline" className="flex-1 border-primary/30 hover:bg-primary/10">
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? "Stop" : "Preview"}
              </Button>
              <Button onClick={handleDownload} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                <Download className="w-4 h-4 mr-2" />
                Download My Program
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full border-primary/30 hover:bg-primary/10"
              onClick={async () => {
                if (!finalBlob) return;
                const { canSaveTrack, saveTrack } = await import("@/lib/savedTrackStorage");
                const allowed = await canSaveTrack("free");
                if (!allowed) {
                  toast({ title: "Limit reached", description: "Free users can save 1 track. Upgrade for unlimited." });
                  return;
                }
                const ctx = audioEngine.getContext();
                const buf = await ctx.decodeAudioData(await finalBlob.arrayBuffer());
                await saveTrack({
                  id: crypto.randomUUID(),
                  name: "Library Installation",
                  blob: finalBlob,
                  durationSec: Math.round(buf.duration),
                  createdAt: Date.now(),
                  mode: "library",
                });
                trackEvent("track_saved_to_app", { mode: "library" });
                toast({ title: "Saved ✓", description: "Track saved to your app. Come back anytime to replay it." });
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save to App
            </Button>
          </div>
          <SleepTimer onTimerEnd={stopPlayback} isPlaying={isPlaying} />

          <div className="text-center pt-3 border-t border-border/30 mt-2 space-y-2">
            <p className="text-foreground font-display text-lg font-bold tracking-[0.08em]">
              Do this for 30 Days & Notice the Difference.
            </p>
            <p className="text-xs text-primary font-display tracking-[0.1em]">— Jared</p>
            <GoDeeper className="mt-2" />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ModularTrackBuilder;

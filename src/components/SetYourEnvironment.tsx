import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Square, Lock, Volume2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AMBIENT_SOUNDSCAPES, HEALING_FREQUENCIES, buildDroneGraphLive, type Soundscape } from "@/lib/soundscapes";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { useTier } from "@/hooks/use-tier";
import UpgradePrompt from "@/components/UpgradePrompt";
import { loadEnvironment, saveEnvironment, type EnvironmentSettings } from "@/lib/environmentStorage";

/** Elite-only frequencies */
const ELITE_ONLY_IDS = new Set(["963hz", "40hz", "7.83hz"]);

interface SetYourEnvironmentProps {
  onConfirm: (settings: EnvironmentSettings) => void;
  onBack: () => void;
}

const SetYourEnvironment = ({ onConfirm, onBack }: SetYourEnvironmentProps) => {
  const { tier } = useTier();
  const isPro = PAYMENTS_DISABLED || tier === "tier1" || tier === "tier2";
  const isElite = PAYMENTS_DISABLED || tier === "tier2";

  // Load persisted settings
  const [settings, setSettings] = useState<EnvironmentSettings>(loadEnvironment);

  const [showUpgrade, setShowUpgrade] = useState(false);

  // --- Frequency preview ---
  const [isPreviewingFreq, setIsPreviewingFreq] = useState(false);
  const freqNodesRef = useRef<AudioNode[]>([]);
  const freqCtxRef = useRef<AudioContext | null>(null);
  const freqTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Soundscape preview ---
  const [isPreviewingSoundscape, setIsPreviewingSoundscape] = useState(false);
  const soundscapeAudioRef = useRef<HTMLAudioElement | null>(null);
  const soundscapeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const update = (partial: Partial<EnvironmentSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveEnvironment(next);
      return next;
    });
  };

  // Current frequency
  const currentFreqIndex = HEALING_FREQUENCIES.findIndex((f) => f.id === settings.frequencyId);
  const currentFreq = HEALING_FREQUENCIES[currentFreqIndex >= 0 ? currentFreqIndex : 0];
  const isFreqLocked = ELITE_ONLY_IDS.has(currentFreq.id) && !isElite;

  // --- Frequency preview logic ---
  const stopFreqPreview = () => {
    if (freqTimerRef.current) { clearTimeout(freqTimerRef.current); freqTimerRef.current = null; }
    for (const node of freqNodesRef.current) {
      try { (node as OscillatorNode).stop?.(); } catch {}
      try { node.disconnect(); } catch {}
    }
    freqNodesRef.current = [];
    setIsPreviewingFreq(false);
  };

  const startFreqPreview = (freq: Soundscape) => {
    stopFreqPreview();
    if (!freq.frequency) return;
    if (!freqCtxRef.current) freqCtxRef.current = new AudioContext();
    const ctx = freqCtxRef.current;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.0);
    masterGain.connect(ctx.destination);
    const nodes = buildDroneGraphLive(ctx, freq.frequency, masterGain);
    nodes.push(masterGain);
    freqNodesRef.current = nodes;
    setIsPreviewingFreq(true);
    freqTimerRef.current = setTimeout(() => stopFreqPreview(), 10000);
  };

  const handleFreqPreviewToggle = () => {
    if (isPreviewingFreq) { stopFreqPreview(); return; }
    if (!isFreqLocked) startFreqPreview(currentFreq);
  };

  useEffect(() => {
    if (isPreviewingFreq) startFreqPreview(currentFreq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.frequencyId]);

  // --- Soundscape preview ---
  const stopSoundscapePreview = () => {
    if (soundscapeTimerRef.current) { clearTimeout(soundscapeTimerRef.current); soundscapeTimerRef.current = null; }
    if (soundscapeAudioRef.current) {
      soundscapeAudioRef.current.pause();
      soundscapeAudioRef.current.currentTime = 0;
      soundscapeAudioRef.current = null;
    }
    setIsPreviewingSoundscape(false);
  };

  const startSoundscapePreview = (s: Soundscape) => {
    stopSoundscapePreview();
    if (!s.path) return;
    const audio = new Audio(s.path);
    audio.volume = 0.4;
    audio.play().catch(() => {});
    soundscapeAudioRef.current = audio;
    setIsPreviewingSoundscape(true);
    soundscapeTimerRef.current = setTimeout(() => stopSoundscapePreview(), 10000);
  };

  const handleSoundscapePreviewToggle = () => {
    if (isPreviewingSoundscape) { stopSoundscapePreview(); return; }
    const selected = AMBIENT_SOUNDSCAPES.find((s) => s.id === settings.soundscapeId);
    if (selected && selected.path) startSoundscapePreview(selected);
  };

  useEffect(() => { stopSoundscapePreview(); }, [settings.soundscapeId]);
  useEffect(() => () => { stopFreqPreview(); stopSoundscapePreview(); }, []);

  const cycleFrequency = (direction: -1 | 1) => {
    const idx = currentFreqIndex >= 0 ? currentFreqIndex : 0;
    const next = (idx + direction + HEALING_FREQUENCIES.length) % HEALING_FREQUENCIES.length;
    update({ frequencyId: HEALING_FREQUENCIES[next].id });
  };

  const selectedSoundscape = AMBIENT_SOUNDSCAPES.find((s) => s.id === settings.soundscapeId);
  const canPreviewSoundscape = selectedSoundscape && selectedSoundscape.id !== "none" && selectedSoundscape.path;

  // Summary line
  const soundscapeLabel = selectedSoundscape ? `${selectedSoundscape.emoji} ${selectedSoundscape.label}` : "None";
  const freqLabel = `${currentFreq.emoji} ${currentFreq.label}`;
  const subliminalLabel = settings.subliminalOn ? "Subliminal On" : "Subliminal Off";

  const handleConfirm = () => {
    stopFreqPreview();
    stopSoundscapePreview();
    saveEnvironment(settings);
    onConfirm(settings);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="font-display text-2xl text-foreground tracking-[0.08em] uppercase">
          Set Your Environment
        </h3>
        <p className="text-sm text-muted-foreground normal-case tracking-normal leading-relaxed max-w-md mx-auto">
          The right environment accelerates installation. Choose what surrounds your voice tonight.
        </p>
      </div>

      {/* Locked overlay for free tier */}
      <div className="relative">
        {!isPro && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="p-6 rounded-2xl bg-background/95 border border-primary/30 shadow-glow text-center space-y-3 max-w-sm mx-4">
              <Lock className="w-6 h-6 text-primary mx-auto" />
              <h4 className="font-display text-lg text-foreground tracking-[0.06em]">Unlock Your Environment</h4>
              <p className="text-sm text-muted-foreground normal-case tracking-normal leading-relaxed">
                Choose your frequency, soundscape, and subliminal layer. Pro unlocks the full installation experience.
              </p>
              <Button
                onClick={() => setShowUpgrade(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        )}

        <div className={`space-y-6 ${!isPro ? "opacity-40 pointer-events-none select-none" : ""}`}>
          {/* Section 1 — Background Soundscape */}
          <div className="p-5 rounded-2xl bg-gradient-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Background Soundscape</label>
              {canPreviewSoundscape && (
                <button
                  onClick={handleSoundscapePreviewToggle}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] rounded-full border transition-colors ${
                    isPreviewingSoundscape
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {isPreviewingSoundscape ? <Square className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                  {isPreviewingSoundscape ? "Stop" : "Preview"}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AMBIENT_SOUNDSCAPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => update({ soundscapeId: s.id })}
                  className={`px-3 py-1.5 text-[11px] rounded-full border transition-colors whitespace-nowrap ${
                    settings.soundscapeId === s.id
                      ? "border-primary bg-primary/15 text-primary font-medium"
                      : "border-border/60 text-muted-foreground hover:bg-primary/5 hover:border-primary/40"
                  }`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>

            {/* Soundscape Level */}
            {settings.soundscapeId !== "none" && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-muted-foreground">Soundscape Level</label>
                  <span className="text-xs text-muted-foreground">{Math.round(settings.bgVolume * 100)}%</span>
                </div>
                <Slider value={[settings.bgVolume]} onValueChange={([v]) => update({ bgVolume: v })} max={1} step={0.01} className="w-full" />
              </div>
            )}
          </div>

          {/* Section 2 — Healing Frequency */}
          <div className="p-5 rounded-2xl bg-gradient-card border border-border space-y-3">
            <label className="text-sm font-medium text-foreground">Healing Frequency</label>
            <div className={`flex items-center gap-3 p-4 rounded-xl border bg-secondary/20 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.15)] transition-colors ${
              isFreqLocked ? "border-border/40" : "border-primary/30"
            }`}>
              <button
                onClick={() => cycleFrequency(-1)}
                className="w-9 h-9 flex-shrink-0 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex-1 text-center min-w-0">
                <p className={`text-lg font-display font-bold tracking-wide ${isFreqLocked ? "text-muted-foreground" : "text-foreground"}`}>
                  {currentFreq.emoji} {currentFreq.label}
                  {isFreqLocked && <Lock className="w-3.5 h-3.5 inline ml-1.5 opacity-60" />}
                </p>
                {currentFreq.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 normal-case tracking-normal">
                    {currentFreq.description}
                  </p>
                )}
                {isFreqLocked && (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.15em] rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Lock className="w-2.5 h-2.5" /> Elite Only
                  </button>
                )}
                {!isFreqLocked && (
                  <button
                    onClick={handleFreqPreviewToggle}
                    className={`mt-2 inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.15em] rounded-full border transition-colors ${
                      isPreviewingFreq
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    {isPreviewingFreq ? <Square className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                    {isPreviewingFreq ? "Stop" : "Preview"}
                  </button>
                )}
              </div>

              <button
                onClick={() => cycleFrequency(1)}
                className="w-9 h-9 flex-shrink-0 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Frequency Level */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground">Healing Frequency Level</label>
                <span className="text-xs text-muted-foreground">{Math.round(settings.freqVolume * 100)}%</span>
              </div>
              <Slider value={[settings.freqVolume]} onValueChange={([v]) => update({ freqVolume: v })} max={1} step={0.01} className="w-full" />
            </div>
          </div>

          {/* Section 3 — Subliminal Layer */}
          <div className="p-5 rounded-2xl bg-gradient-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Subliminal Layer</label>
                <p className="text-xs text-muted-foreground normal-case tracking-normal mt-1 leading-relaxed max-w-xs">
                  Your voice plays beneath the mix at near-inaudible volume — present even when your attention drifts.
                </p>
              </div>
              <Switch
                checked={settings.subliminalOn}
                onCheckedChange={(checked) => update({ subliminalOn: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary line */}
      {isPro && (
        <p className="text-center text-xs text-muted-foreground normal-case tracking-normal">
          {soundscapeLabel} · {freqLabel} · {subliminalLabel}
        </p>
      )}

      {/* CTA */}
      <div className="space-y-3">
        <Button
          onClick={handleConfirm}
          disabled={!isPro}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
        >
          🎧 Build My Identity Installation
        </Button>
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to adjust levels
        </button>
      </div>

      {showUpgrade && (
        <UpgradePrompt
          requiredTier="tier1"
          featureName="Custom Environment Settings"
          onDismiss={() => setShowUpgrade(false)}
        />
      )}
    </motion.div>
  );
};

export default SetYourEnvironment;

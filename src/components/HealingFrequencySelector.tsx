import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Square, Lock } from "lucide-react";
import { HEALING_FREQUENCIES, buildDroneGraphLive, type Soundscape } from "@/lib/soundscapes";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { useTier } from "@/hooks/use-tier";
import UpgradePrompt from "@/components/UpgradePrompt";
import { loadEnvironment, saveEnvironment } from "@/lib/environmentStorage";

/** Elite-only frequencies */
const ELITE_ONLY_IDS = new Set(["963hz", "40hz", "7.83hz"]);

const HealingFrequencySelector = () => {
  const { tier } = useTier();
  const isPro = PAYMENTS_DISABLED || tier === "tier1" || tier === "tier2";
  const isElite = PAYMENTS_DISABLED || tier === "tier2";

  const [frequencyId, setFrequencyId] = useState(() => loadEnvironment(tier).frequencyId);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isPreviewingFreq, setIsPreviewingFreq] = useState(false);
  const freqNodesRef = useRef<AudioNode[]>([]);
  const freqCtxRef = useRef<AudioContext | null>(null);
  const freqTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const freqAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentFreqIndex = HEALING_FREQUENCIES.findIndex((f) => f.id === frequencyId);
  const currentFreq = HEALING_FREQUENCIES[currentFreqIndex >= 0 ? currentFreqIndex : 0];
  const isFreqLocked = ELITE_ONLY_IDS.has(currentFreq.id) && !isElite;

  const stopFreqPreview = () => {
    if (freqTimerRef.current) { clearTimeout(freqTimerRef.current); freqTimerRef.current = null; }
    if (freqAudioRef.current) {
      freqAudioRef.current.pause();
      freqAudioRef.current.currentTime = 0;
      freqAudioRef.current = null;
    }
    for (const node of freqNodesRef.current) {
      try { (node as OscillatorNode).stop?.(); } catch {}
      try { node.disconnect(); } catch {}
    }
    freqNodesRef.current = [];
    setIsPreviewingFreq(false);
  };

  const startFreqPreview = (freq: Soundscape) => {
    stopFreqPreview();
    if (freq.path) {
      const audio = new Audio(freq.path);
      audio.volume = 0.35;
      audio.play().catch(() => {});
      freqAudioRef.current = audio;
      setIsPreviewingFreq(true);
      freqTimerRef.current = setTimeout(() => stopFreqPreview(), 10000);
      return;
    }
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

  useEffect(() => {
    if (isPro && isPreviewingFreq) startFreqPreview(currentFreq);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequencyId]);

  useEffect(() => () => { stopFreqPreview(); }, []);

  // Free users: hide entirely — clean builder, no locked UI
  if (!isPro) return null;

  const updateFrequency = (id: string) => {
    setFrequencyId(id);
    const env = loadEnvironment(tier);
    saveEnvironment({ ...env, frequencyId: id });
  };

  const handleFreqPreviewToggle = () => {
    if (isPreviewingFreq) { stopFreqPreview(); return; }
    if (!isFreqLocked) startFreqPreview(currentFreq);
  };

  const cycleFrequency = (direction: -1 | 1) => {
    const idx = currentFreqIndex >= 0 ? currentFreqIndex : 0;
    const next = (idx + direction + HEALING_FREQUENCIES.length) % HEALING_FREQUENCIES.length;
    updateFrequency(HEALING_FREQUENCIES[next].id);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-foreground">Select Your Healing Frequency</label>
      </div>

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
            <span className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 text-[10px] uppercase tracking-[0.15em] rounded-full border border-primary/40 text-primary">
              <Lock className="w-2.5 h-2.5" /> Elite Only
            </span>
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

      {showUpgrade && (
        <UpgradePrompt
          requiredTier="tier1"
          featureName="Healing Frequency Selection"
          onDismiss={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
};

export default HealingFrequencySelector;

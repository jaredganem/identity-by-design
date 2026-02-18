import { useState, useRef } from "react";
import { getSubliminalPrefs, saveSubliminalPrefs } from "@/lib/subliminalEngine";
import { trackEvent } from "@/lib/analytics";
import { motion } from "framer-motion";
import { Play, Pause, Download, Loader2, Headphones, Save } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import SleepTimer from "@/components/SleepTimer";
import GoDeeper from "@/components/GoDeeper";
import { useTier } from "@/hooks/use-tier";
import { hasUsedFreeDownload, markFreeDownloadUsed } from "@/lib/freeDownloadGate";
import UpgradePrompt from "@/components/UpgradePrompt";
import LeadCaptureGate, { hasLeadCaptured } from "@/components/LeadCaptureGate";
import { saveTrack, canSaveTrack } from "@/lib/savedTrackStorage";
import SoundscapeSelector from "@/components/SoundscapeSelector";
import { getSoundscapeById, getFrequencyById, loadSoundscapeBuffer } from "@/lib/soundscapes";

interface FreestyleTrackBuilderProps {
  clips: Blob[];
}

const FreestyleTrackBuilder = ({ clips }: FreestyleTrackBuilderProps) => {
  const { tier } = useTier();
  const [reverbAmount, setReverbAmount] = useState(0.5);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [freqVolume, setFreqVolume] = useState(0.3);
  const [loopCount, setLoopCount] = useState(3);
  const [soundscapeId, setSoundscapeId] = useState("ocean");
  const [frequencyId, setFrequencyId] = useState("417hz");
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState("");
  const [previewingIndex, setPreviewingIndex] = useState<number | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const playbackRef = useRef<{ stop: () => void } | null>(null);
  const previewRef = useRef<{ stop: () => void } | null>(null);
  const { toast } = useToast();

  const hasClips = clips.length > 0;

  const handleBuild = async () => {
    if (!hasClips) return;
    setIsProcessing(true);
    setFinalBlob(null);

    try {
      setProgress("Decoding recordings...");
      const decodedBuffers = await Promise.all(
        clips.map((blob) => audioEngine.decodeBlob(blob))
      );

      setProgress("Stringing clips together...");
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
      const finalBuffer = await audioEngine.mixWithBackgroundAndLoop(
        processed, bgBuffer, bgVolume, loopCount, freqBuffer, freqVolume
      );

      setProgress("Building your installation...");
      const wavBlob = audioEngine.audioBufferToWav(finalBuffer);
      setFinalBlob(wavBlob);
      import("@/lib/streakTracker").then(({ logActivity }) => logActivity("track_build"));
      import("@/lib/challengeTracker").then(({ logChallengeDay }) => logChallengeDay());

      const durationMin = Math.round(finalBuffer.length / finalBuffer.sampleRate / 60);
      toast({
        title: "🎧 Your installation is ready",
        description: `${durationMin} minute identity installation created.`,
      });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Processing error", description: "Something went wrong. Please try again." });
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  const stopPlayback = () => {
    if (playbackRef.current) {
      playbackRef.current.stop();
      playbackRef.current = null;
    }
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
    trackEvent("download_attempted", { mode: "freestyle", tier });
    // Lead capture first
    if (!hasLeadCaptured()) { setShowLeadCapture(true); return; }
    if (tier === "free" && hasUsedFreeDownload()) {
      trackEvent("download_gated", { mode: "freestyle", reason: "free_limit" });
      setShowUpgradePrompt(true);
      return;
    }
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "identity-installation.wav";
    a.click();
    URL.revokeObjectURL(url);
    trackEvent("download_completed", { mode: "freestyle" });
    if (tier === "free") markFreeDownloadUsed();
  };

  const handlePreviewClip = async (index: number) => {
    if (previewingIndex === index && previewRef.current) {
      previewRef.current.stop();
      setPreviewingIndex(null);
      previewRef.current = null;
      return;
    }
    if (previewRef.current) previewRef.current.stop();

    setPreviewingIndex(index);
    try {
      const player = await audioEngine.previewClipWithEffects(clips[index], reverbAmount, vocalVolume);
      previewRef.current = player;
      const buffer = await audioEngine.decodeBlob(clips[index]);
      setTimeout(() => {
        setPreviewingIndex(null);
        previewRef.current = null;
      }, (buffer.duration + 3) * 1000);
    } catch {
      setPreviewingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-2xl text-foreground">Build Your Nightly Identity Installation</h3>
        <p className="text-sm text-muted-foreground mt-1 normal-case tracking-normal">
          Customize your voice, frequency, and repetition settings.
        </p>
      </div>

      {/* Voice Preview with Effects */}
      {hasClips && (
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" /> Preview with Effects
          </p>
          <div className="flex flex-wrap gap-2">
            {clips.map((_, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handlePreviewClip(i)}
                className={`text-xs border-border ${
                  previewingIndex === i
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "hover:bg-primary/10"
                }`}
              >
                {previewingIndex === i ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                Clip {i + 1}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground normal-case tracking-normal">Hear each clip with your current depth & volume settings.</p>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-gradient-card border border-border space-y-6">
        {/* Voice Level */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Your Voice Level</label>
            <span className="text-xs text-muted-foreground">{Math.round(vocalVolume * 100)}%</span>
          </div>
          <Slider value={[vocalVolume]} onValueChange={([v]) => setVocalVolume(v)} max={1} step={0.01} className="w-full" />
        </div>

        {/* Soundscape & Frequency Selector */}
        <SoundscapeSelector soundscapeId={soundscapeId} onSoundscapeChange={setSoundscapeId} frequencyId={frequencyId} onFrequencyChange={setFrequencyId} />

        {/* Soundscape Level */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Soundscape Level</label>
            <span className="text-xs text-muted-foreground">{Math.round(bgVolume * 100)}%</span>
          </div>
          <Slider value={[bgVolume]} onValueChange={([v]) => setBgVolume(v)} max={1} step={0.01} className="w-full" />
        </div>

        {/* Healing Frequency Level */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Healing Frequency Level</label>
            <span className="text-xs text-muted-foreground">{Math.round(freqVolume * 100)}%</span>
          </div>
          <Slider value={[freqVolume]} onValueChange={([v]) => setFreqVolume(v)} max={1} step={0.01} className="w-full" />
        </div>

        {/* Depth Effect */}
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

        {/* Repetitions */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Repetitions <span className="font-normal text-muted-foreground">(Repetition = Installation)</span></label>
            <span className="text-xs text-muted-foreground">{loopCount}× repeat</span>
          </div>
          <Slider value={[loopCount]} onValueChange={([v]) => setLoopCount(v)} min={1} max={10} step={1} className="w-full" />
        </div>

        <Button
          onClick={handleBuild}
          disabled={isProcessing || !hasClips}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
        >
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Processing..."}</>
          ) : (
            "🎧 Build My Identity Installation"
          )}
        </Button>

        {!hasClips && (
          <p className="text-xs text-center text-muted-foreground normal-case tracking-normal">Record at least one clip to build your installation.</p>
        )}
      </div>

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
                const allowed = await canSaveTrack(tier);
                if (!allowed) {
                  toast({ title: "Limit reached", description: "Free users can save 1 track. Upgrade for unlimited." });
                  setShowUpgradePrompt(true);
                  return;
                }
                const ctx = audioEngine.getContext();
                const buf = await ctx.decodeAudioData(await finalBlob.arrayBuffer());
                await saveTrack({
                  id: crypto.randomUUID(),
                  name: "Custom Identity Script",
                  blob: finalBlob,
                  durationSec: Math.round(buf.duration),
                  createdAt: Date.now(),
                  mode: "freestyle",
                });
                trackEvent("track_saved_to_app", { mode: "freestyle", tier });
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
      {showUpgradePrompt && (
        <UpgradePrompt
          requiredTier="tier1"
          featureName="Unlimited Downloads"
          onDismiss={() => setShowUpgradePrompt(false)}
        />
      )}
      <LeadCaptureGate open={showLeadCapture} onClose={() => setShowLeadCapture(false)} onSuccess={() => { setShowLeadCapture(false); window.location.reload(); }} />
    </div>
  );
};

export default FreestyleTrackBuilder;

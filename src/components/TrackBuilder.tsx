import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Download, Loader2, Headphones } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { getAllSlots } from "@/lib/affirmationPrompts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import SleepTimer from "@/components/SleepTimer";

interface TrackBuilderProps {
  recordings: Record<string, Blob>;
}

const TrackBuilder = ({ recordings }: TrackBuilderProps) => {
  const allSlots = getAllSlots();
  const [reverbAmount, setReverbAmount] = useState(0.5);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [loopCount, setLoopCount] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState("");
  const [downloadFormat, setDownloadFormat] = useState<"wav" | "mp3">("wav");
  const [previewingSlot, setPreviewingSlot] = useState<string | null>(null);
  const playbackRef = useRef<{ stop: () => void } | null>(null);
  const previewRef = useRef<{ stop: () => void } | null>(null);
  const { toast } = useToast();

  const allRecorded = allSlots.every((s) => recordings[s.id]);

  const handleBuild = async () => {
    if (!allRecorded) return;
    setIsProcessing(true);
    setFinalBlob(null);

    try {
      setProgress("Decoding recordings...");
      const orderedBlobs = allSlots.map((s) => recordings[s.id]);
      const decodedBuffers = await Promise.all(
        orderedBlobs.map((blob) => audioEngine.decodeBlob(blob))
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

      setProgress("Loading 417 Hz frequency...");
      const bgResponse = await fetch("/audio/417Hz_Frequency.mp3");
      const bgBlob = await bgResponse.blob();
      const bgBuffer = await audioEngine.decodeBlob(bgBlob);

      setProgress(`Mixing with 417 Hz — ${loopCount}x repetitions...`);
      const finalBuffer = await audioEngine.mixWithBackgroundAndLoop(
        processed, bgBuffer, bgVolume, loopCount
      );

      setProgress("Building your installation...");
      const wavBlob = audioEngine.audioBufferToWav(finalBuffer);
      setFinalBlob(wavBlob);

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
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `identity-installation.${downloadFormat}`;
    a.click();
    URL.revokeObjectURL(url);
    if (downloadFormat === "mp3") {
      toast({ title: "Note", description: "MP3 encoding requires a server. Downloading as WAV for now." });
    }
  };

  const handlePreviewClip = async (slotId: string) => {
    if (previewingSlot === slotId && previewRef.current) {
      previewRef.current.stop();
      setPreviewingSlot(null);
      previewRef.current = null;
      return;
    }
    if (previewRef.current) previewRef.current.stop();
    
    const blob = recordings[slotId];
    if (!blob) return;

    setPreviewingSlot(slotId);
    try {
      const player = await audioEngine.previewClipWithEffects(blob, reverbAmount, vocalVolume);
      previewRef.current = player;
      const buffer = await audioEngine.decodeBlob(blob);
      setTimeout(() => {
        setPreviewingSlot(null);
        previewRef.current = null;
      }, (buffer.duration + 3) * 1000);
    } catch {
      setPreviewingSlot(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-2xl text-foreground">Build Your Nightly Identity Installation</h3>
        <p className="text-sm text-muted-foreground mt-1 normal-case tracking-normal">
          Customize your voice, frequency, and repetition settings before creating your installation file.
        </p>
      </div>

      {/* Why This Works */}
      <div className="p-5 rounded-2xl bg-secondary/20 border border-border/50 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-display">Why This Works</p>
        <div className="text-xs text-muted-foreground leading-relaxed normal-case tracking-normal space-y-2">
          <p>Your brain can't tell the difference between what's real and what's vividly imagined.</p>
          <p>When you're drifting off to sleep — right in that half-awake half-asleep phase — your unconscious is wide open.</p>
          <p>Your own voice bypasses resistance. The 417Hz frequency primes your nervous system for change. Repetition installs the new program.</p>
          <p className="text-foreground font-medium">First person + third person. Both recorded. Both running. Because we're not taking chances.</p>
        </div>
      </div>

      {/* Voice Preview with Effects */}
      {Object.keys(recordings).length > 0 && (
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" /> Preview with Effects
          </p>
          <div className="flex flex-wrap gap-2">
            {allSlots.map((slot, i) =>
              recordings[slot.id] ? (
                <Button
                  key={slot.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreviewClip(slot.id)}
                  className={`text-xs border-border ${
                    previewingSlot === slot.id
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "hover:bg-primary/10"
                  }`}
                >
                  {previewingSlot === slot.id ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  #{i + 1}
                </Button>
              ) : null
            )}
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

        {/* 417Hz Level */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">417Hz Frequency Level</label>
            <span className="text-xs text-muted-foreground">{Math.round(bgVolume * 100)}%</span>
          </div>
          <Slider value={[bgVolume]} onValueChange={([v]) => setBgVolume(v)} max={1} step={0.01} className="w-full" />
          <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
            "The principle of autosuggestion voluntarily reaches the subconscious mind and influences it with these thoughts." — Napoleon Hill
          </p>
        </div>

        {/* Depth Effect */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Depth Effect <span className="font-normal text-muted-foreground">(Creates That Trancy Feel)</span></label>
            <span className="text-xs text-muted-foreground">{Math.round(reverbAmount * 100)}%</span>
          </div>
          <Slider value={[reverbAmount]} onValueChange={([v]) => setReverbAmount(v)} max={1} step={0.01} className="w-full" />
        </div>

        {/* Repetitions */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Repetitions <span className="font-normal text-muted-foreground">(Repetition = Installation)</span></label>
            <span className="text-xs text-muted-foreground">{loopCount}× repeat</span>
          </div>
          <Slider value={[loopCount]} onValueChange={([v]) => setLoopCount(v)} min={1} max={10} step={1} className="w-full" />
          <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
            "Repetition of the same thought or physical action develops into a habit which, repeated frequently enough, becomes an automatic reflex." — Norman Vincent Peale
          </p>
        </div>

        <Button
          onClick={handleBuild}
          disabled={isProcessing || !allRecorded}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
        >
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Processing..."}</>
          ) : (
            "🎧 Build My Identity Installation"
          )}
        </Button>

        {!allRecorded && (
          <p className="text-xs text-center text-muted-foreground normal-case tracking-normal">Record all 12 affirmations above to build your installation.</p>
        )}
      </div>

      {finalBlob && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-gradient-card border border-primary/30 shadow-glow space-y-4"
        >
          <h4 className="font-display text-xl text-foreground text-center">Your Installation is Ready 🎧</h4>
          <p className="text-xs text-muted-foreground text-center italic normal-case tracking-normal">
            "Until you make the unconscious conscious, it will direct your life and you will call it fate."
            <br />
            <span className="text-primary not-italic font-display text-xs tracking-[0.1em] mt-1 inline-block">— Carl Jung</span>
          </p>
          <p className="text-xs text-center text-muted-foreground normal-case tracking-normal">
            Your installation is built. The thought is recorded. Tonight, the transformation begins.
          </p>
          
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

          <SleepTimer onTimerEnd={stopPlayback} isPlaying={isPlaying} />

          <div className="text-center pt-2 border-t border-border/30 mt-2">
            <p className="text-sm text-foreground font-display tracking-[0.1em]">
              Do this for 30 days & notice the difference.
            </p>
            <a
              href="https://www.selfmasteryformen.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors normal-case tracking-normal mt-1 inline-block"
            >
              Ready to go deeper? →
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TrackBuilder;

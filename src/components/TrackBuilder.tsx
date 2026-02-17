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

      setProgress("Adding ethereal reverb...");
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

      setProgress(`Mixing with 417 Hz and creating ${loopCount}x loop...`);
      const finalBuffer = await audioEngine.mixWithBackgroundAndLoop(
        processed, bgBuffer, bgVolume, loopCount
      );

      setProgress("Exporting...");
      const wavBlob = audioEngine.audioBufferToWav(finalBuffer);
      setFinalBlob(wavBlob);

      const durationMin = Math.round(finalBuffer.length / finalBuffer.sampleRate / 60);
      toast({
        title: "✨ Your track is ready",
        description: `${durationMin} minute sacred affirmation track created.`,
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
    a.download = `better-life-affirmations.${downloadFormat}`;
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
      }, (buffer.duration + 3) * 1000); // extra time for reverb tail
    } catch {
      setPreviewingSlot(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-2xl text-foreground">Build Your Track</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize reverb, volume, and looping before creating your final track.
        </p>
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
          <p className="text-xs text-muted-foreground">Hear each clip with your current reverb & volume settings.</p>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-gradient-card border border-border space-y-6">
        {/* Reverb */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Reverb Amount</label>
            <span className="text-xs text-muted-foreground">{Math.round(reverbAmount * 100)}%</span>
          </div>
          <Slider value={[reverbAmount]} onValueChange={([v]) => setReverbAmount(v)} max={1} step={0.01} className="w-full" />
        </div>

        {/* Vocal Volume */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Vocal Volume</label>
            <span className="text-xs text-muted-foreground">{Math.round(vocalVolume * 100)}%</span>
          </div>
          <Slider value={[vocalVolume]} onValueChange={([v]) => setVocalVolume(v)} max={1} step={0.01} className="w-full" />
        </div>

        {/* Background volume */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">417 Hz Background Volume</label>
            <span className="text-xs text-muted-foreground">{Math.round(bgVolume * 100)}%</span>
          </div>
          <Slider value={[bgVolume]} onValueChange={([v]) => setBgVolume(v)} max={1} step={0.01} className="w-full" />
        </div>

        {/* Loop count */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Loop Count</label>
            <span className="text-xs text-muted-foreground">{loopCount}× repeat</span>
          </div>
          <Slider value={[loopCount]} onValueChange={([v]) => setLoopCount(v)} min={1} max={10} step={1} className="w-full" />
          <p className="text-xs text-muted-foreground">More loops = longer track for extended sleep sessions.</p>
        </div>

        <Button
          onClick={handleBuild}
          disabled={isProcessing || !allRecorded}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
        >
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Processing..."}</>
          ) : (
            "🎧 Create Autosuggestion File"
          )}
        </Button>

        {!allRecorded && (
          <p className="text-xs text-center text-muted-foreground">Record all 12 affirmations above to build your track.</p>
        )}
      </div>

      {finalBlob && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-gradient-card border border-primary/30 shadow-glow space-y-4"
        >
          <h4 className="font-display text-xl text-foreground text-center">Your Track is Ready ✨</h4>
          
          <div className="flex gap-3">
            <Button onClick={handlePlayback} variant="outline" className="flex-1 border-primary/30 hover:bg-primary/10">
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? "Stop" : "Preview"}
            </Button>
            <Button onClick={handleDownload} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Download .WAV
            </Button>
          </div>

          <SleepTimer onTimerEnd={stopPlayback} isPlaying={isPlaying} />
        </motion.div>
      )}
    </div>
  );
};

export default TrackBuilder;

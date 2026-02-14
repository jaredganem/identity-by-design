import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Download, Loader2 } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { getAllSlots } from "@/lib/affirmationPrompts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface TrackBuilderProps {
  recordings: Record<string, Blob>;
}

const TrackBuilder = ({ recordings }: TrackBuilderProps) => {
  const allSlots = getAllSlots();
  const [reverbAmount, setReverbAmount] = useState(0.5);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [loopCount, setLoopCount] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState("");
  const playbackRef = useRef<{ stop: () => void } | null>(null);
  const { toast } = useToast();

  const allRecorded = allSlots.every((s) => recordings[s.id]);

  const handleBuild = async () => {
    if (!allRecorded) return;
    setIsProcessing(true);
    setFinalBlob(null);

    try {
      // 1. Decode all recordings in order
      setProgress("Decoding recordings...");
      const orderedBlobs = allSlots.map((s) => recordings[s.id]);
      const decodedBuffers = await Promise.all(
        orderedBlobs.map((blob) => audioEngine.decodeBlob(blob))
      );

      // 2. Concatenate all recordings with gaps
      setProgress("Stringing affirmations together...");
      const concatenated = audioEngine.concatenateBuffers(decodedBuffers, 1.5);

      // 3. Apply reverb
      setProgress("Adding ethereal reverb...");
      const withReverb = await audioEngine.applyReverbToBuffer(concatenated, reverbAmount);

      // 4. Load default 417Hz background
      setProgress("Loading 417 Hz frequency...");
      const bgResponse = await fetch("/audio/417Hz_Frequency.mp3");
      const bgBlob = await bgResponse.blob();
      const bgBuffer = await audioEngine.decodeBlob(bgBlob);

      // 5. Mix with background and apply looping
      setProgress(`Mixing with 417 Hz and creating ${loopCount}x loop...`);
      const finalBuffer = await audioEngine.mixWithBackgroundAndLoop(
        withReverb,
        bgBuffer,
        bgVolume,
        loopCount
      );

      // 6. Export as WAV
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
      toast({
        variant: "destructive",
        title: "Processing error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      setProgress("");
    }
  };

  const handlePlayback = async () => {
    if (!finalBlob) return;

    if (isPlaying && playbackRef.current) {
      playbackRef.current.stop();
      setIsPlaying(false);
      return;
    }

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
    a.download = "better-life-affirmations.wav";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-2xl text-foreground">Build Your Track</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize reverb, volume, and looping before creating your final track.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-card border border-border space-y-6">
        {/* Reverb */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Reverb Amount</label>
            <span className="text-xs text-muted-foreground">{Math.round(reverbAmount * 100)}%</span>
          </div>
          <Slider
            value={[reverbAmount]}
            onValueChange={([v]) => { setReverbAmount(v); setFinalBlob(null); }}
            max={1}
            step={0.05}
            className="w-full"
          />
        </div>

        {/* Background volume */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">417 Hz Background Volume</label>
            <span className="text-xs text-muted-foreground">{Math.round(bgVolume * 100)}%</span>
          </div>
          <Slider
            value={[bgVolume]}
            onValueChange={([v]) => { setBgVolume(v); setFinalBlob(null); }}
            max={1}
            step={0.05}
            className="w-full"
          />
        </div>

        {/* Loop count */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Loop Count</label>
            <span className="text-xs text-muted-foreground">{loopCount}× repeat</span>
          </div>
          <Slider
            value={[loopCount]}
            onValueChange={([v]) => { setLoopCount(v); setFinalBlob(null); }}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            More loops = longer track for extended sleep sessions.
          </p>
        </div>

        {/* Build button */}
        <Button
          onClick={handleBuild}
          disabled={isProcessing || !allRecorded}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {progress || "Processing..."}
            </>
          ) : (
            "✨ Create Sacred Track"
          )}
        </Button>

        {!allRecorded && (
          <p className="text-xs text-center text-muted-foreground">
            Record all 12 affirmations above to build your track.
          </p>
        )}
      </div>

      {/* Result */}
      {finalBlob && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-gradient-card border border-primary/30 shadow-glow space-y-4"
        >
          <h4 className="font-display text-xl text-foreground text-center">
            Your Track is Ready ✨
          </h4>
          <div className="flex gap-3">
            <Button
              onClick={handlePlayback}
              variant="outline"
              className="flex-1 border-primary/30 hover:bg-primary/10"
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? "Stop" : "Preview"}
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TrackBuilder;

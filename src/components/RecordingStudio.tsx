import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Play, Pause, Upload, Download, Loader2 } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface RecordingStudioProps {
  selectedPrompt: string | null;
}

const RecordingStudio = ({ selectedPrompt }: RecordingStudioProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [reverbAmount, setReverbAmount] = useState(0.5);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<{ stop: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleRecord = useCallback(async () => {
    if (isRecording) {
      const blob = await audioEngine.stopRecording();
      setRecordedBlob(blob);
      setIsRecording(false);
      setFinalBlob(null);
      toast({ title: "Recording saved", description: "Your affirmation has been captured." });
    } else {
      try {
        await audioEngine.startRecording();
        setIsRecording(true);
        setFinalBlob(null);
      } catch {
        toast({ variant: "destructive", title: "Microphone access needed", description: "Please allow microphone access to record." });
      }
    }
  }, [isRecording, toast]);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      setFinalBlob(null);
      toast({ title: "Background track loaded", description: `${file.name} ready for mixing.` });
    }
  };

  const handleProcess = async () => {
    if (!recordedBlob) return;
    setIsProcessing(true);

    try {
      // Apply reverb
      const reverbedBuffer = await audioEngine.applyReverb(recordedBlob, reverbAmount);

      let finalBuffer = reverbedBuffer;

      // Mix with background if uploaded
      if (backgroundFile) {
        finalBuffer = await audioEngine.mixWithBackground(reverbedBuffer, backgroundFile, bgVolume);
      }

      const wavBlob = audioEngine.audioBufferToWav(finalBuffer);
      setFinalBlob(wavBlob);
      toast({ title: "✨ Track created", description: "Your sacred affirmation track is ready." });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Processing error", description: "Something went wrong. Please try again." });
    } finally {
      setIsProcessing(false);
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

    // Auto-stop after duration
    setTimeout(() => setIsPlaying(false), buffer.duration * 1000);
  };

  const handleDownload = () => {
    if (!finalBlob) return;
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "affirmation-track.wav";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Prompt display */}
      {selectedPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-card border border-border text-center"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Your Affirmation
          </p>
          <p className="font-display text-2xl italic text-foreground text-glow">
            "{selectedPrompt}"
          </p>
        </motion.div>
      )}

      {/* Record button */}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          onClick={handleRecord}
          whileTap={{ scale: 0.95 }}
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
            isRecording
              ? "bg-destructive shadow-[0_0_40px_hsl(0_84%_60%/0.4)]"
              : "bg-primary shadow-glow hover:shadow-[0_0_60px_hsl(42_78%_55%/0.4)]"
          }`}
        >
          {isRecording ? (
            <Square className="w-8 h-8 text-destructive-foreground" />
          ) : (
            <Mic className="w-8 h-8 text-primary-foreground" />
          )}
        </motion.button>
        <p className="text-sm text-muted-foreground">
          {isRecording ? "Recording... Tap to stop" : recordedBlob ? "Recording saved ✓" : "Tap to record"}
        </p>
      </div>

      {/* Controls */}
      {recordedBlob && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 p-6 rounded-2xl bg-gradient-card border border-border"
        >
          {/* Reverb control */}
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

          {/* Background upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">417 Hz Background Track</label>
            <p className="text-xs text-muted-foreground">
              Upload your 417 Hz solfeggio frequency track to blend beneath your voice.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-border hover:border-primary/50 hover:bg-secondary"
            >
              <Upload className="w-4 h-4 mr-2" />
              {backgroundFile ? backgroundFile.name : "Upload Background Track"}
            </Button>
          </div>

          {/* Background volume */}
          {backgroundFile && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Background Volume</label>
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
          )}

          {/* Process button */}
          <Button
            onClick={handleProcess}
            disabled={isProcessing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating your track...
              </>
            ) : (
              "✨ Create Sacred Track"
            )}
          </Button>
        </motion.div>
      )}

      {/* Final track playback */}
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
              {isPlaying ? "Pause" : "Preview"}
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

export default RecordingStudio;

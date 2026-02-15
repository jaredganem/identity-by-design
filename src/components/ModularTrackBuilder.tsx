import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Download, Loader2, X, GripVertical, Library, Mic, Plus } from "lucide-react";
import { audioEngine } from "@/lib/audioEngine";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import SleepTimer from "@/components/SleepTimer";
import AffirmationLibrary from "@/components/AffirmationLibrary";
import { type SavedAffirmation } from "@/lib/affirmationLibrary";

interface ModularTrackBuilderProps {
  refreshKey?: number;
}

const ModularTrackBuilder = ({ refreshKey = 0 }: ModularTrackBuilderProps) => {
  const [selectedItems, setSelectedItems] = useState<SavedAffirmation[]>([]);
  const [showLibrary, setShowLibrary] = useState(true);
  const [reverbAmount, setReverbAmount] = useState(0.5);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [bgVolume, setBgVolume] = useState(0.3);
  const [loopCount, setLoopCount] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState("");
  const playbackRef = useRef<{ stop: () => void } | null>(null);
  const { toast } = useToast();

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
    setIsProcessing(true);
    setFinalBlob(null);

    try {
      setProgress("Decoding recordings...");
      const decodedBuffers = await Promise.all(
        selectedItems.map((item) => audioEngine.decodeBlob(item.blob))
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
      const finalBuffer = await audioEngine.mixWithBackgroundAndLoop(processed, bgBuffer, bgVolume, loopCount);

      setProgress("Exporting...");
      const wavBlob = audioEngine.audioBufferToWav(finalBuffer);
      setFinalBlob(wavBlob);

      const durationMin = Math.round(finalBuffer.length / finalBuffer.sampleRate / 60);
      toast({
        title: "✨ Your track is ready",
        description: `${durationMin} minute track from ${selectedItems.length} affirmations.`,
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
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "better-life-custom-track.wav";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-display text-2xl text-foreground">Modular Track Builder</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Pick affirmations from your library to build a custom track. Swap, reorder, mix & match.
        </p>
      </div>

      {/* Selected playlist */}
      {selectedItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-card border border-border space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Your playlist — {selectedItems.length} affirmation{selectedItems.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-1.5">
            {selectedItems.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(i, 1)}
                    disabled={i === selectedItems.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                  >
                    ▼
                  </button>
                </div>
                <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground italic truncate">"{item.text}"</p>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Library picker */}
      <div className="space-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLibrary(!showLibrary)}
          className="border-primary/30 hover:bg-primary/10"
        >
          <Library className="w-4 h-4 mr-1.5" />
          {showLibrary ? "Hide Library" : "Browse Library"}
        </Button>

        {showLibrary && (
          <div className="p-4 rounded-2xl border border-border bg-secondary/10">
            <AffirmationLibrary
              selectable
              selectedIds={selectedItems.map((s) => s.id)}
              onToggleSelect={handleToggleSelect}
              refreshKey={refreshKey}
            />
          </div>
        )}
      </div>

      {/* Mix controls */}
      {selectedItems.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-card border border-border space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Reverb Amount</label>
              <span className="text-xs text-muted-foreground">{Math.round(reverbAmount * 100)}%</span>
            </div>
            <Slider value={[reverbAmount]} onValueChange={([v]) => setReverbAmount(v)} max={1} step={0.01} className="w-full" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Vocal Volume</label>
              <span className="text-xs text-muted-foreground">{Math.round(vocalVolume * 100)}%</span>
            </div>
            <Slider value={[vocalVolume]} onValueChange={([v]) => setVocalVolume(v)} max={1} step={0.01} className="w-full" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">417 Hz Background</label>
              <span className="text-xs text-muted-foreground">{Math.round(bgVolume * 100)}%</span>
            </div>
            <Slider value={[bgVolume]} onValueChange={([v]) => setBgVolume(v)} max={1} step={0.01} className="w-full" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Loop Count</label>
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
              `✨ Build Track from ${selectedItems.length} Affirmation${selectedItems.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </div>
      )}

      {/* Playback */}
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

export default ModularTrackBuilder;

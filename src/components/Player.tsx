import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, Download, ChevronLeft, List, Volume2 } from "lucide-react";
import { getAllAffirmations, SavedAffirmation } from "@/lib/affirmationLibrary";
import { audioEngine } from "@/lib/audioEngine";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface PlayerProps {
  onBack: () => void;
}

/* ── Subliminal "Mind Movie" text cycling ── */
const SubliminalDisplay = ({
  tracks, currentTrack, isPlaying, subliminalIndex, setSubliminalIndex,
}: {
  tracks: SavedAffirmation[];
  currentTrack: SavedAffirmation | undefined;
  isPlaying: boolean;
  subliminalIndex: number;
  setSubliminalIndex: (fn: (n: number) => number) => void;
}) => {
  // Collect all affirmation texts from the playlist
  const phrases = tracks
    .map((t) => t.text || t.name)
    .filter(Boolean);

  // Cycle through phrases while playing
  useEffect(() => {
    if (!isPlaying || phrases.length === 0) return;
    const interval = setInterval(() => {
      setSubliminalIndex((prev: number) => (prev + 1) % phrases.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPlaying, phrases.length, setSubliminalIndex]);

  const displayPhrase = phrases[subliminalIndex % Math.max(phrases.length, 1)] || currentTrack?.name || "Untitled";
  const displayCategory = currentTrack?.category || "Affirmation";

  return (
    <div className="text-center max-w-[200px]">
      {/* Category label */}
      <motion.p
        key={displayCategory}
        className="text-[10px] text-primary uppercase tracking-[0.2em] font-display mb-2 opacity-60"
      >
        {displayCategory}
      </motion.p>

      {/* Subliminal phrase — fades/scales in and out */}
      <AnimatePresence mode="wait">
        <motion.p
          key={subliminalIndex}
          initial={{ opacity: 0, scale: 0.7, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.15, filter: "blur(4px)" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="text-sm text-foreground font-display leading-snug normal-case tracking-normal"
        >
          {displayPhrase}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

const Player = ({ onBack }: PlayerProps) => {
  const [tracks, setTracks] = useState<SavedAffirmation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [loopMode, setLoopMode] = useState<"off" | "all" | "one">("all");
  const [shuffled, setShuffled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const [subliminalIndex, setSubliminalIndex] = useState(0);

  useEffect(() => {
    getAllAffirmations().then((all) => {
      if (all.length > 0) {
        // Sort newest first
        const sorted = [...all].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        setTracks(sorted);
      }
    });
  }, []);

  const currentTrack = tracks[currentIndex];

  // Set up audio element and visualizer
  useEffect(() => {
    if (!currentTrack) return;
    const url = URL.createObjectURL(currentTrack.blob);
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = url;
    audioRef.current.load();

    // Set up analyser
    if (!analyserRef.current) {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;
    }

    audioRef.current.onended = handleTrackEnd;
    audioRef.current.ontimeupdate = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
    };

    return () => URL.revokeObjectURL(url);
  }, [currentIndex, tracks]);

  // Visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Circular visualizer
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = Math.min(w, h) * 0.3;

      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2 - Math.PI / 2;
        const amplitude = dataArray[i] / 255;
        const barHeight = amplitude * radius * 0.8;

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsla(195, 100%, ${29 + amplitude * 30}%, ${0.3 + amplitude * 0.7})`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Inner glow circle
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, "hsla(195, 100%, 29%, 0.08)");
      gradient.addColorStop(1, "hsla(195, 100%, 29%, 0)");
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying]);

  const handleTrackEnd = useCallback(() => {
    if (loopMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (loopMode === "all" || currentIndex < tracks.length - 1) {
      setCurrentIndex((prev) => (prev + 1) % tracks.length);
      setTimeout(() => audioRef.current?.play(), 100);
    } else {
      setIsPlaying(false);
    }
  }, [loopMode, currentIndex, tracks.length]);

  const togglePlay = async () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.error("Playback failed:", e);
      }
    }
  };

  const skipNext = () => {
    if (tracks.length === 0) return;
    const next = shuffled
      ? Math.floor(Math.random() * tracks.length)
      : (currentIndex + 1) % tracks.length;
    setCurrentIndex(next);
    if (isPlaying) setTimeout(() => audioRef.current?.play(), 100);
  };

  const skipPrev = () => {
    if (tracks.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
      if (isPlaying) setTimeout(() => audioRef.current?.play(), 100);
    }
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (tracks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 max-w-2xl mx-auto px-6 py-12 text-center space-y-6"
      >
        <h2 className="font-display text-2xl text-foreground">
          No Tracks <span className="text-primary text-glow">Yet</span>
        </h2>
        <p className="text-sm text-muted-foreground normal-case tracking-normal">
          Record some affirmations and save them to your library first, then come back here to play them.
        </p>
        <Button variant="outline" onClick={onBack} className="border-primary/30 text-primary">
          <ChevronLeft className="w-4 h-4 mr-1" /> Go Back
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative z-10 max-w-2xl mx-auto px-6 py-12 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display">Now Playing</p>
        <button
          onClick={() => setShowPlaylist(!showPlaylist)}
          className={`transition-colors ${showPlaylist ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      {/* Visualizer */}
      <div className="relative aspect-square max-w-[300px] mx-auto">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="w-full h-full"
        />
      {/* Subliminal mind-movie text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <SubliminalDisplay
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            subliminalIndex={subliminalIndex}
            setSubliminalIndex={setSubliminalIndex}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Slider
          value={[progress]}
          max={duration || 100}
          step={0.1}
          onValueChange={([v]) => {
            if (audioRef.current) audioRef.current.currentTime = v;
          }}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setShuffled(!shuffled)}
          className={`transition-colors ${shuffled ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Shuffle className="w-5 h-5" />
        </button>
        <button onClick={skipPrev} className="text-foreground hover:text-primary transition-colors">
          <SkipBack className="w-6 h-6" />
        </button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow"
        >
          {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
        </motion.button>
        <button onClick={skipNext} className="text-foreground hover:text-primary transition-colors">
          <SkipForward className="w-6 h-6" />
        </button>
        <button
          onClick={() => setLoopMode(loopMode === "off" ? "all" : loopMode === "all" ? "one" : "off")}
          className={`relative transition-colors ${loopMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Repeat className="w-5 h-5" />
          {loopMode === "one" && (
            <span className="absolute -top-1 -right-1 text-[8px] font-bold text-primary">1</span>
          )}
        </button>
      </div>

      {/* Playlist */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card/50 divide-y divide-border/50 max-h-64 overflow-y-auto">
              {tracks.map((track, i) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentIndex(i);
                    if (isPlaying) setTimeout(() => audioRef.current?.play(), 100);
                  }}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                    i === currentIndex
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate normal-case tracking-normal">{track.name}</p>
                    <p className="text-xs text-muted-foreground normal-case tracking-normal">{track.category}</p>
                  </div>
                  {i === currentIndex && isPlaying && (
                    <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Player;

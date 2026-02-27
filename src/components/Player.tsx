import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, Download, ChevronLeft, List, Volume2, VolumeX, Volume1, Lock, Trash2 } from "lucide-react";
import { type SavedAffirmation } from "@/lib/affirmationLibrary";
import { getAllAffirmationsSync as getAllAffirmations } from "@/lib/cloudStorage";
import { getSavedTracks, deleteSavedTrack, type SavedTrack } from "@/lib/savedTrackStorage";
import { audioEngine } from "@/lib/audioEngine";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { trackEvent } from "@/lib/analytics";
import { useTier } from "@/hooks/use-tier";
import { canAccessLibrary, meetsMinimumTier } from "@/lib/tierAccess";
import { getSubliminalPrefs, saveSubliminalPrefs, createSubliminalLayer, type SubliminalMode, type SubliminalIntensity } from "@/lib/subliminalEngine";
import { updateMediaSession, clearMediaSession } from "@/lib/mediaSession";
import UpgradePrompt from "@/components/UpgradePrompt";
import LeadCaptureGate, { hasLeadCaptured } from "@/components/LeadCaptureGate";
import PlayerSoundscape from "@/components/PlayerSoundscape";

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
  const { tier } = useTier();
  const [showLeadCapture, setShowLeadCapture] = useState(false);
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
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const prevVolume = useRef(1);
  const subliminalRef = useRef<ReturnType<typeof createSubliminalLayer> | null>(null);
  const [subliminalMode, setSubliminalMode] = useState<SubliminalMode>(getSubliminalPrefs().mode);
  const [subliminalIntensity, setSubliminalIntensity] = useState<SubliminalIntensity>(getSubliminalPrefs().intensity);

  // Cleanup audio on unmount — stop playback when navigating away
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      subliminalRef.current?.destroy();
      clearMediaSession();
    };
  }, []);

  useEffect(() => {
    const loadAllTracks = async () => {
      const allItems: SavedAffirmation[] = [];

      // Load individual affirmation clips
      try {
        const affirmations = await getAllAffirmations();
        allItems.push(...affirmations);
      } catch {}

      // Load saved built tracks (from track builders)
      try {
        const savedTracks = await getSavedTracks();
        const converted: SavedAffirmation[] = savedTracks.map((t) => ({
          id: t.id,
          name: t.name,
          blob: t.blob,
          text: t.name,
          category: "Built Tracks",
          createdAt: t.createdAt,
          updatedAt: t.createdAt,
          _isSavedTrack: true,
        } as SavedAffirmation & { _isSavedTrack: boolean }));
        allItems.push(...converted);
      } catch {}

      if (allItems.length > 0) {
        const sorted = [...allItems].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
        setTracks(sorted);
      }
    };
    loadAllTracks();
  }, []);

  const currentTrack = tracks[currentIndex];

  // Register Media Session for background/lock-screen playback
  useEffect(() => {
    if (!currentTrack) return;
    updateMediaSession(currentTrack.name, "Identity by Design", {
      onPlay: () => audioRef.current?.play().then(() => setIsPlaying(true)),
      onPause: () => { audioRef.current?.pause(); setIsPlaying(false); },
      onNextTrack: () => {
        setCurrentIndex((prev) => (prev + 1) % tracks.length);
        setTimeout(() => audioRef.current?.play(), 100);
      },
      onPrevTrack: () => {
        setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
        setTimeout(() => audioRef.current?.play(), 100);
      },
    });
  }, [currentTrack, currentIndex, tracks.length]);

  // Set up audio element and visualizer
  useEffect(() => {
    if (!canAccessLibrary(tier) || !currentTrack) return;
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

      // Initialize subliminal layer on same context
      subliminalRef.current = createSubliminalLayer(ctx, ctx.destination);
    }

    // Decode track for subliminal layer
    if (subliminalRef.current && currentTrack.blob) {
      currentTrack.blob.arrayBuffer().then(buf => {
        const ctx = analyserRef.current?.context as AudioContext;
        if (ctx) {
          ctx.decodeAudioData(buf.slice(0)).then(decoded => {
            const prefs = getSubliminalPrefs();
            if (prefs.intensity !== "off") {
              subliminalRef.current?.start(decoded, prefs.mode, prefs.intensity);
            }
          }).catch(() => {});
        }
      });
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

  // Gate: Lead capture first, then tier check
  if (!hasLeadCaptured()) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 max-w-2xl mx-auto px-6 py-12 text-center space-y-4">
        <p className="text-muted-foreground">Enter your email to unlock the Identity Player.</p>
        <Button onClick={() => setShowLeadCapture(true)}>Get Started</Button>
        <LeadCaptureGate open={showLeadCapture} onClose={() => setShowLeadCapture(false)} onSuccess={() => { setShowLeadCapture(false); window.location.reload(); }} />
      </motion.div>
    );
  }

  if (!canAccessLibrary(tier)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 max-w-2xl mx-auto px-6 py-12"
      >
        <UpgradePrompt requiredTier="tier1" featureName="Identity Player" inline onDismiss={onBack} />
      </motion.div>
    );
  }

  const togglePlay = async () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      subliminalRef.current?.stop();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        trackEvent("playback_started", { track: currentTrack?.name });
        // Restart subliminal if active
        if (subliminalIntensity !== "off" && currentTrack.blob) {
          currentTrack.blob.arrayBuffer().then(buf => {
            const ctx = analyserRef.current?.context as AudioContext;
            if (ctx) {
              ctx.decodeAudioData(buf.slice(0)).then(decoded => {
                subliminalRef.current?.start(decoded, subliminalMode, subliminalIntensity);
              }).catch(() => {});
            }
          });
        }
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

      {/* Volume control */}
      <div className="flex items-center justify-center gap-3 px-4">
        <button
          onClick={() => {
            if (muted) {
              setMuted(false);
              setVolume(prevVolume.current || 0.5);
              if (audioRef.current) audioRef.current.volume = prevVolume.current || 0.5;
            } else {
              prevVolume.current = volume;
              setMuted(true);
              setVolume(0);
              if (audioRef.current) audioRef.current.volume = 0;
            }
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <Slider
          value={[muted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={([v]) => {
            setVolume(v);
            setMuted(v === 0);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          className="w-28"
        />
      </div>

      {/* Live Soundscape Environment */}
      <PlayerSoundscape
        isPlaying={isPlaying}
        audioContext={analyserRef.current?.context as AudioContext | null}
        destination={analyserRef.current?.context ? (analyserRef.current.context as AudioContext).destination : null}
      />

      {/* Subliminal Saturation — promoted section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display">Subliminal Saturation</label>
          {!meetsMinimumTier(tier, "tier1") && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] rounded-full border border-primary/40 text-primary bg-primary/5">
              <Lock className="w-2.5 h-2.5" /> Pro
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground normal-case tracking-normal leading-relaxed">
          Layers your own voice beneath the mix at near-inaudible volume — your identity programming saturates the environment whether your attention is focused or not.
        </p>
        {meetsMinimumTier(tier, "tier1") ? (
          <div className="space-y-3">
            {/* Intensity segmented control */}
            <div className="flex gap-1.5">
              {(["off", "low", "medium", "high"] as SubliminalIntensity[]).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setSubliminalIntensity(level);
                    saveSubliminalPrefs({ mode: subliminalMode, intensity: level });
                    subliminalRef.current?.updateIntensity(level);
                    if (level === "off") subliminalRef.current?.stop();
                    trackEvent("subliminal_intensity", { level });
                  }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-display uppercase tracking-wider transition-colors ${
                    subliminalIntensity === level
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            {/* Mode selector — visible when active */}
            {subliminalIntensity !== "off" && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setSubliminalMode("echo");
                    saveSubliminalPrefs({ mode: "echo", intensity: subliminalIntensity });
                    subliminalRef.current?.updateMode("echo", subliminalIntensity);
                    trackEvent("subliminal_mode", { mode: "echo" });
                  }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-display transition-colors ${
                    subliminalMode === "echo"
                      ? "bg-primary/15 border border-primary/40 text-primary"
                      : "bg-secondary/30 border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="block uppercase tracking-wider">Echo</span>
                  <span className="block normal-case tracking-normal text-[9px] opacity-70 mt-0.5">Pitched-down mirror</span>
                </button>
                <button
                  onClick={() => {
                    setSubliminalMode("rapid");
                    saveSubliminalPrefs({ mode: "rapid", intensity: subliminalIntensity });
                    subliminalRef.current?.updateMode("rapid", subliminalIntensity);
                    trackEvent("subliminal_mode", { mode: "rapid" });
                  }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-display transition-colors ${
                    subliminalMode === "rapid"
                      ? "bg-primary/15 border border-primary/40 text-primary"
                      : "bg-secondary/30 border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="block uppercase tracking-wider">Rapid</span>
                  <span className="block normal-case tracking-normal text-[9px] opacity-70 mt-0.5">Whisper-speed loop</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => {/* upgrade prompt handled by UpgradePrompt below */}}
            className="w-full py-2 rounded-lg bg-secondary/30 border border-border/60 text-muted-foreground text-[11px] font-display uppercase tracking-wider"
          >
            <Lock className="w-3 h-3 inline mr-1.5" /> Unlock with Pro
          </button>
        )}
      </div>

      {/* Download button */}
      {currentTrack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!currentTrack) return;
              const url = URL.createObjectURL(currentTrack.blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${currentTrack.name || "affirmation"}.webm`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="border-primary/30 text-primary hover:bg-primary/10 gap-2"
          >
            <Download className="w-4 h-4" />
            Download This Track
          </Button>
        </motion.div>
      )}
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
                <div
                  key={track.id}
                  className={`flex items-center gap-1 transition-colors ${
                    i === currentIndex
                      ? "bg-primary/10"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <button
                    onClick={() => {
                      setCurrentIndex(i);
                      if (isPlaying) setTimeout(() => audioRef.current?.play(), 100);
                    }}
                    className={`flex-1 px-4 py-3 text-left flex items-center gap-3 ${
                      i === currentIndex ? "text-primary" : "text-foreground"
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
                  {(track as any)._isSavedTrack && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await deleteSavedTrack(track.id);
                        setTracks((prev) => {
                          const next = prev.filter((t) => t.id !== track.id);
                          if (currentIndex >= next.length && next.length > 0) {
                            setCurrentIndex(next.length - 1);
                          }
                          return next;
                        });
                        trackEvent("saved_track_deleted", { trackId: track.id });
                      }}
                      className="px-3 py-2 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove from player"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Player;

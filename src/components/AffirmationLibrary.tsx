import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Play, Pause, FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllAffirmations, deleteAffirmation, type SavedAffirmation } from "@/lib/affirmationLibrary";
import { audioEngine } from "@/lib/audioEngine";
import { useToast } from "@/hooks/use-toast";

interface AffirmationLibraryProps {
  onSelectForTrack?: (items: SavedAffirmation[]) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (item: SavedAffirmation) => void;
  refreshKey?: number;
  emptyQuote?: { text: string; author: string };
  emptyMessage?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Physical Dominance": "⚔️",
  "Financial Sovereignty": "🏛️",
  "Relationship Mastery": "🤝",
  "Mission & Career": "🎯",
  "Identity & Character": "🛡️",
  // Legacy categories
  Health: "⚔️",
  Wealth: "🏛️",
  Relationships: "🤝",
  Career: "🎯",
  "Personal Growth": "🛡️",
  Custom: "🎤",
};

const AffirmationLibrary = ({
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  refreshKey = 0,
  emptyQuote = { text: "The ancestor of every action is a thought.", author: "Ralph Waldo Emerson" },
  emptyMessage = "Every installation starts with a single thought. Start here.",
}: AffirmationLibraryProps) => {
  const [items, setItems] = useState<SavedAffirmation[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playRef = useRef<{ stop: () => void } | null>(null);
  const { toast } = useToast();

  const loadItems = async () => {
    const all = await getAllAffirmations();
    setItems(all.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    loadItems();
  }, [refreshKey]);

  const grouped = items.reduce<Record<string, SavedAffirmation[]>>((acc, item) => {
    const cat = item.category || "Custom";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handlePlay = async (item: SavedAffirmation) => {
    if (playingId === item.id) {
      playRef.current?.stop();
      setPlayingId(null);
      return;
    }
    playRef.current?.stop();
    try {
      const buffer = await audioEngine.decodeBlob(item.blob);
      const player = audioEngine.playBuffer(buffer);
      playRef.current = player;
      setPlayingId(item.id);
      setTimeout(() => {
        if (playingId === item.id) setPlayingId(null);
      }, buffer.duration * 1000);
    } catch {
      setPlayingId(null);
    }
  };

  const handleDelete = async (item: SavedAffirmation) => {
    await deleteAffirmation(item.id);
    toast({ title: "Removed", description: `"${item.name}" deleted from library.` });
    loadItems();
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground text-sm normal-case tracking-normal">Your Identity Library is empty.</p>
        <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
          "{emptyQuote.text}" — {emptyQuote.author}
        </p>
        <p className="text-xs text-muted-foreground normal-case tracking-normal">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span>{CATEGORY_ICONS[category] || "📁"}</span>
            {category}
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{catItems.length}</span>
          </h4>

          <div className="space-y-1.5">
            {catItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary/40"
                      : "bg-gradient-card border-border hover:border-primary/20"
                  }`}
                >
                  {selectable && (
                    <button
                      onClick={() => onToggleSelect?.(item)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {isSelected && <Plus className="w-3 h-3 text-primary-foreground rotate-45" />}
                    </button>
                  )}

                  <button
                    onClick={() => handlePlay(item)}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    {playingId === item.id ? (
                      <Pause className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-foreground ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground italic truncate">"{item.text}"</p>
                  </div>

                  {!selectable && (
                    <button
                      onClick={() => handleDelete(item)}
                      className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AffirmationLibrary;

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Play, Pause, Archive, Plus, Check, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllAffirmations, deleteAffirmation, updateAffirmationName, type SavedAffirmation } from "@/lib/affirmationLibrary";
import { audioEngine } from "@/lib/audioEngine";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  Health: "⚔️",
  Wealth: "🏛️",
  Relationships: "🤝",
  Career: "🎯",
  "Personal Growth": "🛡️",
  Custom: "🎤",
};

const GENERIC_NAME_PATTERN = /^Clip \d+$/;

async function transcribeClip(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  const { data, error } = await supabase.functions.invoke("transcribe-clip", {
    body: { audioBase64: base64, mimeType: blob.type },
  });
  if (error) throw error;
  return data?.name || "Untitled Clip";
}

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
  const [renamingIds, setRenamingIds] = useState<Set<string>>(new Set());
  const [renamingAll, setRenamingAll] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const playRef = useRef<{ stop: () => void } | null>(null);
  const { toast } = useToast();

  const loadItems = async () => {
    const all = await getAllAffirmations();
    setItems(all.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    loadItems();
  }, [refreshKey]);

  // Auto-expand all categories only on initial load
  const initialExpandDone = useRef(false);
  useEffect(() => {
    if (items.length > 0 && !initialExpandDone.current) {
      const cats = new Set(items.map((item) => item.category || "Custom"));
      setExpandedCategories(cats);
      initialExpandDone.current = true;
    }
  }, [items.length]);

  const grouped = items.reduce<Record<string, SavedAffirmation[]>>((acc, item) => {
    const cat = item.category || "Custom";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const genericItems = items.filter((item) => GENERIC_NAME_PATTERN.test(item.name));

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

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

  const handleRenameOne = async (item: SavedAffirmation) => {
    setRenamingIds((prev) => new Set(prev).add(item.id));
    try {
      const name = await transcribeClip(item.blob);
      await updateAffirmationName(item.id, name);
      // Optimistic in-place update instead of full reload
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, name } : i)));
      toast({ title: "Renamed ✓", description: `Now called "${name}"` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Rename failed", description: e?.message || "Could not transcribe clip." });
    } finally {
      setRenamingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleRenameBatch = async (batch: SavedAffirmation[], label: string) => {
    if (batch.length === 0) return;
    setRenamingAll(true);
    let renamed = 0;
    const BATCH_SIZE = 3;

    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const chunk = batch.slice(i, i + BATCH_SIZE);
      // Process each chunk in parallel
      const results = await Promise.allSettled(
        chunk.map(async (item) => {
          setRenamingIds((prev) => new Set(prev).add(item.id));
          try {
            const name = await transcribeClip(item.blob);
            await updateAffirmationName(item.id, name);
            return true;
          } finally {
            setRenamingIds((prev) => {
              const next = new Set(prev);
              next.delete(item.id);
              return next;
            });
          }
        })
      );
      renamed += results.filter((r) => r.status === "fulfilled" && r.value).length;
      // Refresh UI between batches so it doesn't freeze
      await loadItems();
    }

    setRenamingAll(false);
    toast({ title: "Rename complete ✓", description: `${renamed} of ${batch.length} clips renamed.` });
  };

  const handleRenameAllGeneric = () => handleRenameBatch(genericItems, "all");

  const handleRenameCategoryGeneric = (category: string) => {
    const catGeneric = (grouped[category] || []).filter((item) => GENERIC_NAME_PATTERN.test(item.name));
    handleRenameBatch(catGeneric, category);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <Archive className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground text-sm normal-case tracking-normal">Your Identity Library is empty.</p>
        <p className="text-xs text-muted-foreground italic normal-case tracking-normal">
          "{emptyQuote.text}" — {emptyQuote.author}
        </p>
        <p className="text-xs text-muted-foreground normal-case tracking-normal">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Rename All Generic button */}
      {genericItems.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRenameAllGeneric}
            disabled={renamingAll}
            className="border-primary/30 hover:bg-primary/10 text-primary text-xs"
          >
            {renamingAll ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            {renamingAll ? "Renaming..." : `Rename ${genericItems.length} Generic Clip${genericItems.length > 1 ? "s" : ""} with AI`}
          </Button>
        </div>
      )}

      {Object.entries(grouped).map(([category, catItems]) => {
        const isExpanded = expandedCategories.has(category);
        return (
          <div key={category} className="rounded-xl border border-border overflow-hidden">
            {/* Category header — clickable drawer toggle */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-secondary/30">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
              >
                <span>{CATEGORY_ICONS[category] || "📁"}</span>
                <span className="text-sm font-medium text-foreground">{category}</span>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{catItems.length}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
              </button>
              {(() => {
                const catGeneric = catItems.filter((item) => GENERIC_NAME_PATTERN.test(item.name));
                if (catGeneric.length === 0) return null;
                return (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleRenameCategoryGeneric(category); }}
                    disabled={renamingAll}
                    className="text-xs text-primary hover:bg-primary/10 h-7 px-2"
                  >
                    {renamingAll ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Rename {catGeneric.length}
                  </Button>
                );
              })()}
            </div>

            {/* Collapsible content — scrollable */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="max-h-48 overflow-y-auto p-2 space-y-1.5">
                    {catItems.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      const isRenaming = renamingIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                            isSelected
                              ? "bg-primary/10 border-primary/40"
                              : "bg-background border-border/50 hover:border-primary/20"
                          }`}
                        >
                          <button
                            onClick={() => handlePlay(item)}
                            className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                          >
                            {playingId === item.id ? (
                              <Pause className="w-3 h-3 text-primary" />
                            ) : (
                              <Play className="w-3 h-3 text-foreground ml-0.5" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {isRenaming ? (
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Transcribing…
                                </span>
                              ) : (
                                item.name
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-0.5">
                            {selectable && (
                              <button
                                onClick={() => onToggleSelect?.(item)}
                                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                                  isSelected
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                }`}
                                title={isSelected ? "Remove from track" : "Add to track"}
                              >
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleRenameOne(item)}
                              disabled={isRenaming}
                              className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                              title="Rename with AI"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default AffirmationLibrary;

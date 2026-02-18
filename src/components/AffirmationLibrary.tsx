import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Play, Pause, Archive, Plus, Check, Sparkles, Loader2, ChevronDown, Eraser, Pencil, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SavedAffirmation } from "@/lib/affirmationLibrary";
import { getAllAffirmationsSync as getAllAffirmations, deleteAffirmationSync as deleteAffirmation, updateAffirmationNameSync as updateAffirmationName, moveAffirmationToCategorySync as moveAffirmationToCategory, renameCategorySync as renameCategory } from "@/lib/cloudStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  "Physical Health & Vitality": "💪",
  "Physical Dominance": "💪",
  Health: "💪",
  "Financial Sovereignty": "💰",
  Wealth: "💰",
  "Relationship Mastery": "🤝",
  Relationships: "🤝",
  "Leadership & Influence": "🧭",
  "Mission & Career": "🎯",
  Career: "🎯",
  "Identity & Character": "🛡️",
  "Personal Growth": "🧠",
  Custom: "🎤",
};

// Preferred category display order
const CATEGORY_ORDER: string[] = [
  "Physical Health & Vitality",
  "Physical Dominance",
  "Health",
  "Financial Sovereignty",
  "Wealth",
  "Relationship Mastery",
  "Relationships",
  "Leadership & Influence",
  "Mission & Career",
  "Career",
  "Identity & Character",
  "Personal Growth",
  "Custom",
];

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
  const [showCleanup, setShowCleanup] = useState(false);
  const [cleanupSelection, setCleanupSelection] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [movingItem, setMovingItem] = useState<{ item: SavedAffirmation; category: string } | null>(null);
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

  const handleMoveToCategory = async (item: SavedAffirmation, newCategory: string) => {
    await moveAffirmationToCategory(item.id, newCategory);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, category: newCategory } : i)));
    setMovingItem(null);
    toast({ title: "Moved ✓", description: `"${item.name}" → ${newCategory}` });
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

  const handleRenameCategory = async (oldName: string) => {
    const newName = editCategoryName.trim();
    if (!newName || newName === oldName) {
      setEditingCategory(null);
      return;
    }
    const count = await renameCategory(oldName, newName);
    setItems((prev) => prev.map((i) => i.category === oldName ? { ...i, category: newName } : i));
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(oldName)) { next.delete(oldName); next.add(newName); }
      return next;
    });
    setEditingCategory(null);
    toast({ title: "Category renamed ✓", description: `${count} clip${count > 1 ? "s" : ""} moved to "${newName}".` });
  };

  // Cleanup detection
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  // Extract key phrases (numbers + units, goals) for similarity matching
  const extractKeyPhrases = (text: string): string[] => {
    const lower = text.toLowerCase();
    // Match numbers with optional units/context (e.g. "180lbs", "30k", "$25k/mo", "6 pack")
    const patterns = lower.match(/\$?\d+[\w/%]*(?:\/\w+)?/g) || [];
    // Also grab 2+ word phrases for fuzzy matching
    const words = lower.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3);
    return [...patterns, ...words];
  };

  const isSimilar = (a: SavedAffirmation, b: SavedAffirmation): boolean => {
    if (a.id === b.id) return false;
    const phrasesA = extractKeyPhrases(a.name);
    const phrasesB = extractKeyPhrases(b.name);
    if (phrasesA.length === 0 || phrasesB.length === 0) return false;
    const overlap = phrasesA.filter((p) => phrasesB.includes(p));
    // Flag if 2+ key phrases match, or if any specific number/goal appears in both
    return overlap.length >= 2 || phrasesA.some((p) => /\d/.test(p) && phrasesB.includes(p));
  };

  const flaggedItems = useMemo(() => {
    const now = Date.now();
    const flags: { item: SavedAffirmation; reason: string }[] = [];
    const flaggedIds = new Set<string>();

    // Exact duplicates (same name) — flag the OLDER one, keep the newest
    const seenNames = new Map<string, SavedAffirmation>();
    for (const item of items) {
      const nameKey = item.name.toLowerCase().trim();
      const existing = seenNames.get(nameKey);
      if (existing) {
        // Flag whichever is older
        const older = existing.createdAt < item.createdAt ? existing : item;
        const newer = existing.createdAt < item.createdAt ? item : existing;
        if (!flaggedIds.has(older.id)) {
          flags.push({ item: older, reason: "Duplicate" });
          flaggedIds.add(older.id);
        }
        seenNames.set(nameKey, newer); // keep tracking the newest
      } else {
        seenNames.set(nameKey, item);
      }
    }

    // Similar goals — flag the OLDER one, keep the newest
    for (let i = 0; i < items.length; i++) {
      if (flaggedIds.has(items[i].id)) continue;
      for (let j = i + 1; j < items.length; j++) {
        if (flaggedIds.has(items[j].id)) continue;
        if (isSimilar(items[i], items[j])) {
          const older = items[i].createdAt <= items[j].createdAt ? items[i] : items[j];
          if (!flaggedIds.has(older.id)) {
            flags.push({ item: older, reason: "Similar goal" });
            flaggedIds.add(older.id);
          }
        }
      }
    }

    // Old clips
    for (const item of items) {
      if (flaggedIds.has(item.id)) continue;
      if (now - item.createdAt > THIRTY_DAYS) {
        flags.push({ item, reason: "Older than 30 days" });
        flaggedIds.add(item.id);
      }
    }

    return flags;
  }, [items]);

  const handleCleanupToggle = (id: string) => {
    setCleanupSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCleanupSelectAll = () => {
    if (cleanupSelection.size === flaggedItems.length) {
      setCleanupSelection(new Set());
    } else {
      setCleanupSelection(new Set(flaggedItems.map((f) => f.item.id)));
    }
  };

  const handleCleanupDelete = async () => {
    const toDelete = Array.from(cleanupSelection);
    for (const id of toDelete) {
      await deleteAffirmation(id);
    }
    setItems((prev) => prev.filter((i) => !cleanupSelection.has(i.id)));
    toast({ title: "Cleanup complete ✓", description: `${toDelete.length} clip${toDelete.length > 1 ? "s" : ""} removed.` });
    setCleanupSelection(new Set());
    setShowCleanup(false);
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

      {/* Cleanup button */}
      {flaggedItems.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowCleanup(!showCleanup); setCleanupSelection(new Set()); }}
            className="border-destructive/30 hover:bg-destructive/10 text-destructive text-xs"
          >
            <Eraser className="w-3.5 h-3.5 mr-1.5" />
            Clean Up ({flaggedItems.length} flagged)
          </Button>
        </div>
      )}

      {/* Cleanup panel */}
      <AnimatePresence>
        {showCleanup && flaggedItems.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-xl border border-destructive/20 bg-destructive/5"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Flagged Clips</p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCleanupSelectAll} className="text-xs h-7 px-2">
                    {cleanupSelection.size === flaggedItems.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCleanupDelete}
                    disabled={cleanupSelection.size === 0}
                    className="text-xs h-7 px-3"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete {cleanupSelection.size > 0 ? `(${cleanupSelection.size})` : ""}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {flaggedItems.map(({ item, reason }) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={cleanupSelection.has(item.id)}
                      onChange={() => handleCleanupToggle(item.id)}
                      className="rounded border-muted-foreground"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category || "Custom"}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive whitespace-nowrap">
                      {reason}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {Object.entries(grouped)
        .sort(([a], [b]) => {
          const idxA = CATEGORY_ORDER.indexOf(a);
          const idxB = CATEGORY_ORDER.indexOf(b);
          // Known categories sorted by CATEGORY_ORDER, unknown ones go to the end alphabetically
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        })
        .map(([category, catItems]) => {
        const isExpanded = expandedCategories.has(category);
        return (
          <div key={category} className="rounded-xl border border-border overflow-visible">
            {/* Category header — clickable drawer toggle */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 bg-secondary/30">
              {editingCategory === category ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleRenameCategory(category); }}
                  className="flex items-center gap-2 flex-1"
                >
                  <span>{CATEGORY_ICONS[category] || "📁"}</span>
                  <input
                    autoFocus
                    type="text"
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    onBlur={() => handleRenameCategory(category)}
                    className="h-7 px-2 text-sm rounded border border-primary bg-background text-foreground focus:outline-none w-full max-w-[200px]"
                  />
                </form>
              ) : (
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 flex-1 text-left min-h-[44px] hover:opacity-80 transition-opacity"
                >
                  <span>{CATEGORY_ICONS[category] || "📁"}</span>
                  <span className="text-sm font-medium text-foreground">{category}</span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{catItems.length}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </button>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(category);
                    setEditCategoryName(category);
                  }}
                  className="min-w-[44px] min-h-[44px] p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Rename category"
                >
                  <Pencil className="w-3.5 h-3.5" />
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
            </div>

            {/* Collapsible content — scrollable */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-visible"
                >
                  <div className="max-h-48 overflow-y-auto overflow-x-visible p-2 space-y-1.5">
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
                            className="flex-shrink-0 w-11 h-11 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
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
                                className={`flex-shrink-0 min-w-[44px] min-h-[44px] p-2 rounded-lg transition-colors ${
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
                              onClick={() => setMovingItem({ item, category })}
                              className="flex-shrink-0 min-w-[44px] min-h-[44px] p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Move to category"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRenameOne(item)}
                              disabled={isRenaming}
                              className="flex-shrink-0 min-w-[44px] min-h-[44px] p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                              title="Rename with AI"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="flex-shrink-0 min-w-[44px] min-h-[44px] p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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

      {/* Move to category dialog */}
      <MoveToCategory
        open={!!movingItem}
        item={movingItem?.item ?? null}
        currentCategory={movingItem?.category ?? ""}
        existingCategories={Object.keys(grouped)}
        onMove={handleMoveToCategory}
        onClose={() => setMovingItem(null)}
      />
    </div>
  );
};

/** Move to Category dialog with custom category creation */
const MoveToCategory = ({
  open,
  item,
  currentCategory,
  existingCategories,
  onMove,
  onClose,
}: {
  open: boolean;
  item: SavedAffirmation | null;
  currentCategory: string;
  existingCategories: string[];
  onMove: (item: SavedAffirmation, category: string) => void;
  onClose: () => void;
}) => {
  const [creating, setCreating] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const handleCreate = () => {
    const name = newCatName.trim();
    if (!name || !item) return;
    onMove(item, name);
    setCreating(false);
    setNewCatName("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setCreating(false); setNewCatName(""); } }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">Move "{item?.name}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 pt-2">
          {existingCategories
            .filter((cat) => cat !== currentCategory)
            .map((cat) => (
              <button
                key={cat}
                onClick={() => item && onMove(item, cat)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-primary/10 transition-colors flex items-center gap-2"
              >
                <span>{CATEGORY_ICONS[cat] || "📁"}</span>
                <span>{cat}</span>
              </button>
            ))}

          {/* Create new category */}
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 text-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Category</span>
            </button>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="flex gap-2 px-1 pt-2">
              <input
                autoFocus
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name…"
                className="flex-1 h-9 px-3 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
              />
              <Button type="submit" size="sm" disabled={!newCatName.trim()} className="h-9 px-3">
                <Check className="w-3.5 h-3.5" />
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AffirmationLibrary;

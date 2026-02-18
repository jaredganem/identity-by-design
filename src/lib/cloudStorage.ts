/**
 * Cloud storage sync layer for audio recordings.
 * Authenticated users get recordings persisted to cloud storage.
 * Falls back to IndexedDB-only for unauthenticated users.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  saveAffirmation as saveLocal,
  getAllAffirmations as getAllLocal,
  deleteAffirmation as deleteLocal,
  updateAffirmationName as updateNameLocal,
  moveAffirmationToCategory as moveCategoryLocal,
  renameCategory as renameCategoryLocal,
  type SavedAffirmation,
} from "./affirmationLibrary";

/** Check if user is authenticated */
async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

/** Upload a blob to cloud storage under the user's folder */
async function uploadBlob(userId: string, recordingId: string, blob: Blob): Promise<string> {
  const ext = blob.type.includes("webm") ? "webm" : blob.type.includes("mp4") ? "mp4" : "wav";
  const path = `${userId}/${recordingId}.${ext}`;
  const { error } = await supabase.storage.from("recordings").upload(path, blob, {
    contentType: blob.type,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/** Download a blob from cloud storage */
async function downloadBlob(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from("recordings").download(path);
  if (error) throw error;
  return data;
}

/** Save affirmation — local + cloud if authenticated */
export async function saveAffirmationSync(item: SavedAffirmation): Promise<void> {
  // Always save locally first for instant access
  await saveLocal(item);

  // Try cloud sync
  try {
    const user = await getUser();
    if (!user) return;

    const storagePath = await uploadBlob(user.id, item.id, item.blob);
    await supabase.from("user_recordings").insert({
      id: item.id,
      user_id: user.id,
      name: item.name,
      text: item.text,
      category: item.category,
      storage_path: storagePath,
    } as any);
  } catch {
    // Cloud sync failed silently — local copy is safe
    console.warn("[CloudSync] Failed to sync recording to cloud");
  }
}

/** Get all affirmations — merge local + cloud */
export async function getAllAffirmationsSync(): Promise<SavedAffirmation[]> {
  const localItems = await getAllLocal();

  try {
    const user = await getUser();
    if (!user) return localItems;

    const { data: cloudRecords } = await supabase
      .from("user_recordings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!cloudRecords || cloudRecords.length === 0) return localItems;

    // Build a map of local items by ID for dedup
    const localMap = new Map(localItems.map((i) => [i.id, i]));

    // For cloud items not in local, download the blob and cache locally
    const cloudOnly = cloudRecords.filter((r: any) => !localMap.has(r.id));
    const restored: SavedAffirmation[] = [];

    for (const record of cloudOnly) {
      try {
        const blob = await downloadBlob(record.storage_path);
        const item: SavedAffirmation = {
          id: record.id,
          name: record.name,
          text: record.text,
          category: record.category,
          blob,
          createdAt: new Date(record.created_at).getTime(),
          updatedAt: new Date(record.updated_at).getTime(),
        };
        // Cache locally for offline access
        await saveLocal(item);
        restored.push(item);
      } catch {
        // Skip items we can't download
      }
    }

    // Merge: local items + restored cloud items
    return [...localItems, ...restored];
  } catch {
    return localItems;
  }
}

/** Delete affirmation — local + cloud */
export async function deleteAffirmationSync(id: string): Promise<void> {
  await deleteLocal(id);

  try {
    const user = await getUser();
    if (!user) return;

    // Get storage path before deleting record
    const { data } = await supabase
      .from("user_recordings")
      .select("storage_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (data?.storage_path) {
      await supabase.storage.from("recordings").remove([data.storage_path]);
    }
    await supabase.from("user_recordings").delete().eq("id", id).eq("user_id", user.id);
  } catch {
    console.warn("[CloudSync] Failed to delete from cloud");
  }
}

/** Update name — local + cloud */
export async function updateAffirmationNameSync(id: string, name: string): Promise<void> {
  await updateNameLocal(id, name);

  try {
    const user = await getUser();
    if (!user) return;
    await supabase
      .from("user_recordings")
      .update({ name, text: name } as any)
      .eq("id", id)
      .eq("user_id", user.id);
  } catch {
    console.warn("[CloudSync] Failed to update name in cloud");
  }
}

/** Move to category — local + cloud */
export async function moveAffirmationToCategorySync(id: string, category: string): Promise<void> {
  await moveCategoryLocal(id, category);

  try {
    const user = await getUser();
    if (!user) return;
    await supabase
      .from("user_recordings")
      .update({ category } as any)
      .eq("id", id)
      .eq("user_id", user.id);
  } catch {
    console.warn("[CloudSync] Failed to move category in cloud");
  }
}

/** Rename category — local + cloud */
export async function renameCategorySync(oldName: string, newName: string): Promise<number> {
  const count = await renameCategoryLocal(oldName, newName);

  try {
    const user = await getUser();
    if (!user) return count;
    await supabase
      .from("user_recordings")
      .update({ category: newName } as any)
      .eq("category", oldName)
      .eq("user_id", user.id);
  } catch {
    console.warn("[CloudSync] Failed to rename category in cloud");
  }

  return count;
}

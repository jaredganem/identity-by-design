/**
 * Saved Track Storage
 * ───────────────────
 * Free users can save ONE built track to IndexedDB for in-app replay.
 * Pro+ users get unlimited saved tracks.
 */

const DB_NAME = "saved-tracks";
const DB_VERSION = 1;
const STORE_NAME = "tracks";

export interface SavedTrack {
  id: string;
  name: string;
  blob: Blob;
  durationSec: number;
  createdAt: number;
  mode: "guided" | "freestyle" | "library";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTrack(track: SavedTrack): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(track);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSavedTracks(): Promise<SavedTrack[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSavedTrack(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSavedTrackCount(): Promise<number> {
  const tracks = await getSavedTracks();
  return tracks.length;
}

/** Free users can save exactly 1 track */
export async function canSaveTrack(tier: string): Promise<boolean> {
  if (tier !== "free") return true;
  const count = await getSavedTrackCount();
  return count < 1;
}

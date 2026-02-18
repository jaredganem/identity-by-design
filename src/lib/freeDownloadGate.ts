/**
 * Free Download Gate
 * ──────────────────
 * Free users get ONE full session (record + mix + download).
 * After their first download, further recording/saving/downloading
 * requires upgrading to Pro (tier1).
 *
 * Flag is stored in localStorage for unauthenticated users.
 * For authenticated users, a future DB column can be added.
 */

import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";

const STORAGE_KEY = "smfm_free_download_used";

/** Check whether the free user has already used their one-time download. */
export function hasUsedFreeDownload(): boolean {
  if (PAYMENTS_DISABLED) return false; // All downloads free during launch
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Mark the free download as used. Call this after the first successful download. */
export function markFreeDownloadUsed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // localStorage unavailable — silently ignore
  }
}

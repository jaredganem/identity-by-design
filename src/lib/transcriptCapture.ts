import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "smfm_session";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Save an anonymized affirmation transcript for trend analysis.
 * Fire-and-forget — never blocks the UI.
 */
export function captureTranscript(
  text: string,
  options: { category?: string; source?: "guided" | "freestyle" | "ai_generated" } = {}
) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3) return;

  const sessionId = getSessionId();
  supabase
    .from("affirmation_transcripts")
    .insert({
      session_id: sessionId,
      transcript_text: trimmed,
      category: options.category || null,
      source: options.source || "guided",
    } as any)
    .then(({ error }) => {
      if (error) console.log("[TranscriptCapture] Error:", error.message);
    });
}

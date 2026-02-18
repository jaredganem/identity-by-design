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

export async function trackPageView(page = "/") {
  const sessionId = getSessionId();
  await supabase.from("page_views").insert({
    session_id: sessionId,
    page,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent || null,
  });
}

export async function trackEvent(event: string, metadata: Record<string, unknown> = {}) {
  try {
    const sessionId = getSessionId();
    await supabase.from("events").insert({
      session_id: sessionId,
      event,
      metadata,
      page: window.location.pathname,
    } as any);
  } catch {
    // Fire-and-forget — never block UI
  }
}

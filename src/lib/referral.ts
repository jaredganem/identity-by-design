import { supabase } from "@/integrations/supabase/client";

const REF_KEY = "smfm_ref";

/** Call on app mount to capture ?ref= from the URL */
export function captureReferral() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      sessionStorage.setItem(REF_KEY, ref);
      // Clean up the URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  } catch {
    // silent
  }
}

/** Get the stored referral code (if any) */
export function getReferralCode(): string | null {
  try {
    return sessionStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

/** Log a referral after a lead is captured */
export async function logReferral(referredEmail: string, referredLeadId?: string) {
  const code = getReferralCode();
  if (!code) return;
  try {
    await supabase.from("referrals").insert({
      referrer_code: code,
      referred_email: referredEmail,
      referred_lead_id: referredLeadId || null,
    } as any);
  } catch {
    // fire-and-forget
  }
}

/** Build a share URL that includes a lead's referral code */
export function buildShareUrl(referralCode?: string | null): string {
  const base = "https://identity-by-design.lovable.app";
  if (referralCode) return `${base}?ref=${referralCode}`;
  return base;
}

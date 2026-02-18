import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { Share2 } from "lucide-react";
import { buildShareUrl } from "@/lib/referral";

const SHARE_TEXT = "This app helped me start reprogramming my mindset with custom affirmations. Check it out 🔥";

function getMyRefCode(): string | null {
  try { return localStorage.getItem("smfm_ref_code"); } catch { return null; }
}

const Footer = () => {
  const handleShare = async () => {
    const shareUrl = buildShareUrl(getMyRefCode());
    trackEvent("share_app", { method: "footer", page: window.location.pathname });
    if (navigator.share) {
      try {
        await navigator.share({ title: "Identity by Design", text: SHARE_TEXT, url: shareUrl });
      } catch {}
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n${shareUrl}`)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <footer className="relative z-10 max-w-2xl mx-auto px-6 py-12 mt-8 space-y-4">
      <div className="text-center space-y-1">
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 transition-colors text-muted-foreground hover:text-primary text-xs font-display tracking-wide"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share the App
        </button>
        <p className="text-[10px] text-muted-foreground">Refer a friend — they'll thank you later</p>
      </div>

      <div className="rounded-2xl bg-gradient-card border border-border p-5 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed normal-case tracking-normal">
          This program is for educational and personal development purposes only. Results are not guaranteed and will vary based on individual effort and consistency. Not a substitute for professional medical or psychological care.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          © 2025 Self-Mastery for Men™
        </p>
        <div className="flex items-center justify-center gap-3 mt-2">
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
          <span className="text-muted-foreground/30">|</span>
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
        </div>
      </div>
      <p className="text-center">
        <a
          href="https://www.selfmasteryformen.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary transition-colors normal-case tracking-normal"
        >
          www.selfmasteryformen.com
        </a>
      </p>
    </footer>
  );
};

export default Footer;

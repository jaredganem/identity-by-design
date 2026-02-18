import { trackEvent } from "@/lib/analytics";
import { Share2 } from "lucide-react";

const SHARE_URL = "https://identity-by-design.lovable.app/install";
const SHARE_TEXT = "This app helped me start reprogramming my mindset with custom affirmations. Check it out 🔥";

const Footer = () => {
  const handleShare = async () => {
    trackEvent("share_app", { method: "footer", page: window.location.pathname });
    if (navigator.share) {
      try {
        await navigator.share({ title: "Identity by Design", text: SHARE_TEXT, url: SHARE_URL });
      } catch {}
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n${SHARE_URL}`)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <footer className="relative z-10 max-w-2xl mx-auto px-6 py-12 mt-8 space-y-4">
      {/* Share CTA */}
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 transition-colors text-muted-foreground hover:text-primary text-xs font-display tracking-wide"
      >
        <Share2 className="w-3.5 h-3.5" />
        Know someone who'd love this? Share the app
      </button>

      <div className="rounded-2xl bg-gradient-card border border-border p-5 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed normal-case tracking-normal">
          This program is for educational and personal development purposes only. Results are not guaranteed and will vary based on individual effort and consistency. Not a substitute for professional medical or psychological care.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          © 2025 Self-Mastery for Men™
        </p>
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

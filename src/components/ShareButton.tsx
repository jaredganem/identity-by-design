import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Copy, Check } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

const SHARE_URL = "https://identity-by-design.lovable.app/install";
const SHARE_TEXT = "I've been using Identity by Design to reprogram my mindset with custom affirmations. Check it out 🔥";

const socials = [
  {
    name: "WhatsApp",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    ),
    url: `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n${SHARE_URL}`)}`,
  },
  {
    name: "X",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ),
    url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`,
  },
  {
    name: "Facebook",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    ),
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`,
  },
];

interface ShareButtonProps {
  variant?: "inline" | "fab";
}

const ShareButton = ({ variant = "fab" }: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleNativeShare = async () => {
    trackEvent("share_app", { method: "native" });
    try {
      await navigator.share({ title: "Identity by Design", text: SHARE_TEXT, url: SHARE_URL });
    } catch { /* cancelled */ }
    setOpen(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${SHARE_TEXT}\n${SHARE_URL}`);
    setCopied(true);
    toast.success("Link copied!");
    trackEvent("share_app", { method: "clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocial = (name: string, url: string) => {
    trackEvent("share_app", { method: name.toLowerCase() });
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    setOpen(false);
  };

  // Inline variant — full width button (used on /install page)
  if (variant === "inline") {
    return (
      <div className="space-y-3">
        {navigator.share ? (
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-display text-sm tracking-wide"
          >
            <Share2 className="w-4 h-4" />
            Share with a Friend
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center font-display tracking-wide">Share with a Friend</p>
            <div className="flex items-center justify-center gap-2">
              {socials.map((s) => (
                <button
                  key={s.name}
                  onClick={() => handleSocial(s.name, s.url)}
                  className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors flex items-center justify-center text-muted-foreground hover:text-primary"
                  aria-label={`Share on ${s.name}`}
                >
                  <s.icon />
                </button>
              ))}
              <button
                onClick={handleCopy}
                className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors flex items-center justify-center text-muted-foreground hover:text-primary"
                aria-label="Copy link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // FAB variant — floating action button (global)
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-5 z-50 p-3 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl space-y-2 min-w-[160px]"
          >
            <p className="text-xs font-display text-foreground tracking-wide px-1">Share the App</p>
            {navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/10 transition-colors"
              >
                <Share2 className="w-4 h-4 text-primary" />
                Share…
              </button>
            )}
            {socials.map((s) => (
              <button
                key={s.name}
                onClick={() => handleSocial(s.name, s.url)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/10 transition-colors"
              >
                <span className="text-primary"><s.icon /></span>
                {s.name}
              </button>
            ))}
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-primary/10 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-primary" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-glow flex items-center justify-center transition-shadow"
        whileTap={{ scale: 0.9 }}
        aria-label="Share"
      >
        {open ? <X className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
      </motion.button>
    </>
  );
};

export default ShareButton;

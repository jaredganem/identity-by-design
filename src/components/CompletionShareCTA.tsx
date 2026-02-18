import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, MessageSquare } from "lucide-react";
import { buildShareUrl } from "@/lib/referral";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

const CompletionShareCTA = () => {
  const [copied, setCopied] = useState(false);
  const referralCode = localStorage.getItem("smfm_ref_code") || null;
  const shareUrl = buildShareUrl(referralCode);
  const shareText = "I just completed my Identity Blueprint — 12 custom affirmations programmed for my subconscious. This tool is legit. Try it:";

  const handleNativeShare = async () => {
    trackEvent("share_completion", { method: "native" });
    try {
      await navigator.share({ title: "Identity by Design", text: shareText, url: shareUrl });
    } catch { /* cancelled */ }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    toast.success("Link copied!");
    trackEvent("share_completion", { method: "clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSMS = () => {
    trackEvent("share_completion", { method: "sms" });
    const body = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`sms:?body=${body}`, "_self");
  };

  const handleWhatsApp = () => {
    trackEvent("share_completion", { method: "whatsapp" });
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4 text-center"
    >
      <p className="font-display text-sm tracking-wide text-primary">
        Share This With Someone Who Needs It
      </p>
      <p className="text-xs text-muted-foreground normal-case tracking-normal">
        Your Identity Blueprint is ready. Know a man who's ready to level up? Send him the link.
      </p>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {typeof navigator.share === "function" && (
          <button
            onClick={handleNativeShare}
            className="min-h-[44px] min-w-[44px] flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-sm font-medium"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
        <button
          onClick={handleSMS}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors text-foreground text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          SMS
        </button>
        <button
          onClick={handleWhatsApp}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors text-foreground text-sm"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button
          onClick={handleCopy}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors text-foreground text-sm"
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </motion.div>
  );
};

export default CompletionShareCTA;

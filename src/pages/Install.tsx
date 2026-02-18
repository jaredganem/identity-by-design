import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Monitor, Share, MoreVertical, PlusSquare, ArrowLeft, Check, Copy, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

const CopyLinkButton = () => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText("https://identity-by-design.lovable.app/install");
    setCopied(true);
    toast.success("Link copied!");
    trackEvent("share_app", { method: "copy_link", page: "install" });
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-all text-sm text-muted-foreground hover:text-primary"
    >
      <motion.span
        key={copied ? "check" : "copy"}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-2"
      >
        {copied ? <Check className="w-4 h-4 text-primary" /> : <Link className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy Link"}
      </motion.span>
    </button>
  );
};

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios");
    else if (/android/.test(ua)) setPlatform("android");
    else setPlatform("desktop");

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      trackEvent("app_installed", { platform });
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      trackEvent("app_installed", { platform, method: "prompt" });
    }
    setDeferredPrompt(null);
  };




  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative z-10 max-w-lg mx-auto px-6 py-12 space-y-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
              <Download className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl text-foreground">
              Install <span className="text-primary text-glow">Identity by Design</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Add it to your home screen for the full experience — instant access, no browser bar, works offline.
            </p>
          </motion.div>

          {installed ? (
            <motion.div variants={item} className="text-center space-y-3 py-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-xl text-foreground">You're All Set 🔥</h2>
              <p className="text-sm text-muted-foreground">The app is installed on your device. Find it on your home screen.</p>
            </motion.div>
          ) : (
            <>
              {/* Native install prompt (Android/Desktop Chrome) */}
              {deferredPrompt && (
                <motion.div variants={item}>
                  <Button
                    onClick={handleInstall}
                    className="w-full h-14 bg-primary text-primary-foreground font-display text-base tracking-wider hover:shadow-glow transition-all"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Install App Now
                  </Button>
                </motion.div>
              )}

              {/* iOS Instructions */}
              {platform === "ios" && (
                <motion.div variants={item} className="space-y-4">
                  <h2 className="font-display text-lg text-foreground text-center">How to Install on iPhone</h2>
                  <div className="space-y-3">
                    {[
                      { step: 1, icon: Share, text: "Tap the Share button at the bottom of Safari", highlight: "Share icon (square with arrow)" },
                      { step: 2, icon: PlusSquare, text: "Scroll down and tap", highlight: '"Add to Home Screen"' },
                      { step: 3, icon: Check, text: 'Tap "Add" in the top right', highlight: "Done!" },
                    ].map((s) => (
                      <div key={s.step} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                          {s.step}
                        </div>
                        <div>
                          <p className="text-sm text-foreground">{s.text}</p>
                          <p className="text-xs text-primary font-medium">{s.highlight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ Must use <span className="text-foreground font-medium">Safari</span> — other browsers don't support home screen install on iOS.
                  </p>
                </motion.div>
              )}

              {/* Android Instructions (fallback if no prompt) */}
              {platform === "android" && !deferredPrompt && (
                <motion.div variants={item} className="space-y-4">
                  <h2 className="font-display text-lg text-foreground text-center">How to Install on Android</h2>
                  <div className="space-y-3">
                    {[
                      { step: 1, icon: MoreVertical, text: "Tap the menu (⋮) in Chrome", highlight: "Top-right corner" },
                      { step: 2, icon: PlusSquare, text: 'Tap "Install app" or "Add to Home Screen"', highlight: "In the menu" },
                      { step: 3, icon: Check, text: 'Tap "Install"', highlight: "Done!" },
                    ].map((s) => (
                      <div key={s.step} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                          {s.step}
                        </div>
                        <div>
                          <p className="text-sm text-foreground">{s.text}</p>
                          <p className="text-xs text-primary font-medium">{s.highlight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Desktop */}
              {platform === "desktop" && !deferredPrompt && (
                <motion.div variants={item} className="space-y-4">
                  <h2 className="font-display text-lg text-foreground text-center">Install on Desktop</h2>
                  <div className="p-4 rounded-xl border border-border bg-card text-center space-y-2">
                    <Monitor className="w-8 h-8 mx-auto text-primary" />
                    <p className="text-sm text-foreground">Look for the install icon in your browser's address bar</p>
                    <p className="text-xs text-muted-foreground">Works in Chrome, Edge, and other Chromium browsers</p>
                  </div>
                </motion.div>
              )}

              {/* Mobile hint on desktop */}
              {platform === "desktop" && (
                <motion.div variants={item} className="p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm text-center space-y-1.5">
                  <Smartphone className="w-5 h-5 mx-auto text-primary" />
                  <p className="text-sm text-foreground font-medium">Also available on mobile</p>
                  <p className="text-xs text-muted-foreground">
                    Visit this page on your iPhone or Android to install the app on your phone — no app store needed.
                  </p>
                </motion.div>
              )}
            </>
          )}

          <motion.div variants={item} className="pt-4 space-y-4">
            <div className="text-center space-y-1">
              <p className="font-display text-sm text-foreground tracking-wide">Know someone who'd love this?</p>
              <p className="text-xs text-muted-foreground">Help a brother level up — share the app.</p>
            </div>

            {/* Native share (mobile) */}
            {typeof navigator !== "undefined" && navigator.share && (
              <button
                onClick={async () => {
                  trackEvent("share_app", { method: "native", page: "install" });
                  try {
                    await navigator.share({
                      title: "Identity by Design",
                      text: "This app helped me start reprogramming my mindset with custom affirmations. You should check it out 🔥",
                      url: "https://identity-by-design.lovable.app/install",
                    });
                  } catch {}
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-display text-sm tracking-wide"
              >
                <Share className="w-4 h-4" />
                Share with a Friend
              </button>
            )}

            {/* Quick-tap grid: Text, WhatsApp, Email */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`sms:?&body=${encodeURIComponent("Yo check this out — it's an app that lets you record your own affirmations over frequency music and reprogram your identity. Free, no app store needed 🔥\nhttps://identity-by-design.lovable.app/install")}`}
                onClick={() => trackEvent("share_app", { method: "sms", page: "install" })}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="text-[10px] font-display text-muted-foreground tracking-wide">Text</span>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent("This app helped me start reprogramming my mindset with custom affirmations. You should check it out 🔥\nhttps://identity-by-design.lovable.app/install")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("share_app", { method: "whatsapp", page: "install" })}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="text-[10px] font-display text-muted-foreground tracking-wide">WhatsApp</span>
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent("Check this out — Identity by Design")}&body=${encodeURIComponent("I found this app that lets you record your own affirmations over 417Hz frequency music and literally reprogram your identity. It's free and works right from your phone — no app store needed.\n\nCheck it out: https://identity-by-design.lovable.app/install")}`}
                onClick={() => trackEvent("share_app", { method: "email", page: "install" })}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <span className="text-[10px] font-display text-muted-foreground tracking-wide">Email</span>
              </a>
            </div>

            {/* Copy Link */}
            <CopyLinkButton />
          </motion.div>

          <motion.div variants={item} className="text-center space-y-2 pt-4">
            <p className="text-xs text-muted-foreground">
              <Smartphone className="w-3 h-3 inline mr-1" />
              Works offline · No app store needed · Always up to date
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Install;

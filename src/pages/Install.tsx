import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Monitor, Share, MoreVertical, PlusSquare, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

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
            </>
          )}

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

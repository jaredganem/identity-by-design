import { useState, useEffect } from "react";
import { ExternalLink, X } from "lucide-react";

function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || "";
  // Detect Facebook, Messenger, Instagram, LINE, etc. in-app browsers
  return /FBAN|FBAV|FB_IAB|FBIOS|FB4A|MESSENGER|Instagram|Line\//i.test(ua);
}

const InAppBrowserBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(isInAppBrowser());
  }, []);

  if (!show) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground px-4 py-3 flex items-start gap-3 shadow-lg">
      <ExternalLink className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-sm leading-snug">
        <p className="font-bold">Open in your browser for the best experience</p>
        <p className="text-primary-foreground/80 text-xs mt-1">
          {isIOS
            ? "Tap the ••• menu at the bottom → \"Open in Safari\""
            : "Tap the ⋮ menu at the top right → \"Open in browser\""}
        </p>
      </div>
      <button onClick={() => setShow(false)} className="p-1 hover:bg-primary-foreground/10 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default InAppBrowserBanner;

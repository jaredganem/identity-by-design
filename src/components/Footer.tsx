const Footer = () => (
  <footer className="relative z-10 max-w-2xl mx-auto px-6 py-12 mt-8">
    <div className="rounded-2xl bg-gradient-card border border-border overflow-hidden p-5 space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-primary mb-1">Disclaimer</p>
      <p className="text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
        This tool is designed to support the personal development work you're already doing. It is not a magic bullet.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
        <span className="text-foreground font-medium">What it IS:</span> A conditioning tool that works on the unconscious level to reduce internal resistance and align your nervous system with the outcomes you're pursuing.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
        <span className="text-foreground font-medium">What it ISN'T:</span> A replacement for real work, real coaching, or root-cause transformation.
      </p>
      <div className="pt-3 border-t border-border/50">
        <p className="text-sm italic text-foreground leading-relaxed normal-case tracking-normal">
          "Used consistently, this is one of the most powerful supplements to any personal development journey."
        </p>
        <p className="text-xs text-primary font-display tracking-[0.1em] mt-2">
          — Jared Ganem, Self-Mastery for Men™
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

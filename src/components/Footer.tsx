const Footer = () => (
  <footer className="relative z-10 max-w-2xl mx-auto px-6 py-12 mt-8 space-y-4">
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

export default Footer;

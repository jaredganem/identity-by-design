const Footer = () => (
  <footer className="relative z-10 max-w-2xl mx-auto px-6 py-8 mt-8 border-t border-border/30">
    <p className="text-xs text-muted-foreground text-center normal-case tracking-normal">
      Identity by Design™ — Self-Mastery for Men™
    </p>
    <p className="text-xs text-muted-foreground text-center mt-1 normal-case tracking-normal">
      © {new Date().getFullYear()} Jared Ganem. All rights reserved.
    </p>
  </footer>
);

export default Footer;

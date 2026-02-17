import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import jaredPhoto from "@/assets/jared-before-after.jpeg";

interface GoDeeperProps {
  className?: string;
}

const GoDeeper = ({ className = "" }: GoDeeperProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <button
        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary/40 bg-primary/10 text-sm text-primary font-display font-bold tracking-[0.08em] hover:bg-primary/20 hover:border-primary/60 transition-all duration-300 cursor-pointer ${className}`}
      >
        Ready to Go Deeper? →
      </button>
    </DialogTrigger>
    <DialogContent className="bg-card border-border/50 max-w-md">
      <DialogHeader>
        <DialogTitle className="text-lg text-foreground font-display tracking-[0.08em] text-center">
          The Surface Layer Is Just The Beginning.
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-5">
        {/* Jared's Story */}
        <div className="flex items-start gap-3">
          <img
            src={jaredPhoto}
            alt="Jared — before and after"
            className="w-28 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <p className="text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
            I knew every personal development technique in the world — but something was still holding me back. At one point I had what many would consider a dream life, but inside I knew I wasn't living my full potential.
          </p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
          Then in 2019, I hit my version of rock bottom — 80lbs overweight, six figures in debt, hiding in a retirement condo at 32. I wasn't looking for more motivation. I needed something that worked at a deeper level. This was the only tool I had at the time.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
          Since then, I've gotten into the best shape of my life, built a six-figure business, and completely transformed my relationships. But the real shift wasn't external — it was who I became on the inside.
        </p>
        <p className="text-sm text-foreground leading-relaxed normal-case tracking-normal font-medium">
          The man you know you're capable of being isn't someone you have to become. He's who you already are — just underneath decades of conditioning installed before you could choose. This system removes what's in the way. That's what we do together.
        </p>
        <p className="text-xs text-primary font-display tracking-[0.1em]">— Jared</p>

        {/* Primary CTA */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display">Start Here</p>
          <a
            href="https://selfmasteryformen.com/training/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-display font-bold tracking-[0.08em] text-center hover:bg-primary/90 transition-colors"
          >
            Watch the Free Training →
          </a>
        </div>

        {/* Secondary CTA */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display">Then</p>
          <a
            href="https://selfmasteryformen.com/booking-page/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-5 py-3 rounded-xl border border-primary/40 text-sm font-display font-bold tracking-[0.08em] text-foreground text-center hover:bg-primary/10 transition-colors"
          >
            Book a Call with Jared →
          </a>
          <p className="text-xs text-muted-foreground text-center normal-case tracking-normal">
            Find out if facilitated root-cause work is right for you.
          </p>
        </div>

        {/* Stay Connected */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display text-center">Stay Connected</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="https://urlgeni.us/youtube/channel/sVGKLQ" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors normal-case tracking-normal">YouTube</a>
            <span className="text-border">|</span>
            <a href="https://urlgeni.us/instagram/9US98f" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors normal-case tracking-normal">Instagram</a>
            <span className="text-border">|</span>
            <a href="https://www.selfmasteryformen.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent transition-colors normal-case tracking-normal">Website</a>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default GoDeeper;

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface GoDeeperProps {
  className?: string;
}

const GoDeeper = ({ className = "" }: GoDeeperProps) => (
  <Dialog>
    <DialogTrigger asChild>
      <button
        className={`text-xs text-muted-foreground hover:text-primary transition-colors normal-case tracking-normal cursor-pointer bg-transparent border-none p-0 ${className}`}
      >
        Ready to go deeper? →
      </button>
    </DialogTrigger>
    <DialogContent className="bg-card border-border/50 max-w-md">
      <DialogHeader>
        <DialogTitle className="text-lg text-foreground font-display tracking-[0.08em]">
          Ready to Go Deeper?
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed font-body normal-case tracking-normal">
          This tool works on the surface layer. If you want to clear what's underneath — the root cause patterns installed before you could even think — that's where we work together.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="https://selfmasteryformen.com/training/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-accent transition-colors normal-case tracking-normal"
          >
            🎓 Watch the free training
          </a>
          <a
            href="https://selfmasteryformen.com/booking-page/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-accent transition-colors normal-case tracking-normal"
          >
            📞 Book a call with Jared
          </a>
          <a
            href="https://urlgeni.us/youtube/channel/sVGKLQ"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-accent transition-colors normal-case tracking-normal"
          >
            ▶️ Subscribe on YouTube
          </a>
          <a
            href="https://urlgeni.us/instagram/9US98f"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-accent transition-colors normal-case tracking-normal"
          >
            📸 Follow us on Instagram
          </a>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default GoDeeper;

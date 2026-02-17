import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Lightbulb, Bug, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "bug", label: "Bug", icon: Bug },
  { id: "feature", label: "Feature Idea", icon: Sparkles },
  { id: "general", label: "General", icon: Lightbulb },
] as const;

const FeedbackButton = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || trimmed.length < 3) return;

    setSubmitting(true);
    try {
      const sessionId = localStorage.getItem("smfm_session") || "unknown";
      await supabase.from("feedback").insert({
        message: trimmed.slice(0, 2000),
        category,
        page: window.location.pathname,
        user_agent: navigator.userAgent.slice(0, 500),
        session_id: sessionId,
      } as any);

      toast({ title: "Thanks! 🙏", description: "Your feedback helps us build something great." });
      setMessage("");
      setCategory("general");
      setOpen(false);
    } catch {
      toast({ title: "Couldn't send", description: "Try again in a moment.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-glow text-sm font-display tracking-wider hover:scale-105 active:scale-95 transition-transform"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        whileHover={{ scale: 1.05 }}
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Beta Feedback</span>
        <span className="sm:hidden">Feedback</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative w-full max-w-md rounded-2xl rounded-b-none sm:rounded-2xl bg-gradient-card border border-border shadow-card p-6 space-y-4"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-primary">Beta Program</p>
                <h3 className="font-display text-xl text-foreground">Share Your Feedback</h3>
                <p className="text-xs text-muted-foreground">Bug, feature idea, or just a thought — we're listening.</p>
              </div>

              {/* Category pills */}
              <div className="flex gap-2 justify-center">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        category === cat.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-3 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                autoFocus
              />

              <Button
                onClick={handleSubmit}
                disabled={submitting || message.trim().length < 3}
                className="w-full h-11 bg-primary text-primary-foreground font-display text-sm tracking-wider hover:shadow-glow transition-all"
              >
                {submitting ? "Sending..." : "Send Feedback"}
                <Send className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-center text-[10px] text-muted-foreground">
                Your feedback is anonymous · No account needed
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackButton;

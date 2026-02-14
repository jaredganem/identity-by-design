import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AFFIRMATION_PROMPTS } from "@/lib/affirmationPrompts";

interface PromptSelectorProps {
  onSelect: (prompt: string) => void;
  selectedPrompt: string | null;
}

const PromptSelector = ({ onSelect, selectedPrompt }: PromptSelectorProps) => {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="space-y-6">
      <h3 className="font-display text-2xl text-foreground">
        Choose Your Affirmation
      </h3>
      <p className="text-muted-foreground text-sm">
        Select a prompt below or speak your own words from the heart.
      </p>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {AFFIRMATION_PROMPTS.map((cat, i) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(i)}
            className={`px-4 py-2 rounded-lg text-sm font-body transition-all duration-300 ${
              activeCategory === i
                ? "bg-primary text-primary-foreground shadow-glow"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <span className="mr-1.5">{cat.icon}</span>
            {cat.category}
          </button>
        ))}
      </div>

      {/* Prompts */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="grid gap-3"
        >
          {AFFIRMATION_PROMPTS[activeCategory].prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSelect(prompt)}
              className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                selectedPrompt === prompt
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-card hover:border-gold-dim/40 hover:bg-card/80"
              }`}
            >
              <p className="font-display text-lg italic text-foreground/90">
                "{prompt}"
              </p>
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PromptSelector;

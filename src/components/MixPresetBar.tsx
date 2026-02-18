import { useState } from "react";
import { Moon, User, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTier } from "@/hooks/use-tier";
import { SLEEP_MIX, saveMyMix, loadMyMix, hasMyMix, type FullMixSettings, type MixerSettings, type EnvironmentSettings } from "@/lib/environmentStorage";
import { PAYMENTS_DISABLED } from "@/lib/lemonsqueezy";
import { useToast } from "@/hooks/use-toast";
import UpgradePrompt from "@/components/UpgradePrompt";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MixPresetBarProps {
  vocalVolume: number;
  reverbAmount: number;
  loopCount: number;
  freqVolume: number;
  /** Current environment settings for saving */
  getEnvironment: () => EnvironmentSettings;
  /** Apply a full set of mixer + env values */
  onApplyPreset: (preset: MixerSettings & Pick<EnvironmentSettings, "bgVolume" | "freqVolume">) => void;
  /** Apply a full mix including environment */
  onApplyFullMix: (mix: FullMixSettings) => void;
}

const MixPresetBar = ({
  vocalVolume,
  reverbAmount,
  loopCount,
  freqVolume,
  getEnvironment,
  onApplyPreset,
  onApplyFullMix,
}: MixPresetBarProps) => {
  const { tier } = useTier();
  const isPro = PAYMENTS_DISABLED || tier === "tier1" || tier === "tier2";
  const { toast } = useToast();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [activePreset, setActivePreset] = useState<"sleep" | "my-mix" | null>(() =>
    hasMyMix() && isPro ? "my-mix" : null
  );

  const handleSleep = () => {
    onApplyPreset(SLEEP_MIX);
    setActivePreset("sleep");
  };

  const handleMyMix = () => {
    if (!isPro) {
      setShowUpgrade(true);
      return;
    }
    const saved = loadMyMix();
    if (!saved) {
      toast({
        title: "No mix saved yet",
        description: "Adjust your sliders then tap Save as My Mix.",
      });
      return;
    }
    onApplyFullMix(saved);
    setActivePreset("my-mix");
  };

  const handleSaveMyMix = () => {
    const env = getEnvironment();
    const mix: FullMixSettings = {
      vocalVolume,
      reverbAmount,
      loopCount,
      ...env,
    };
    saveMyMix(mix);
    setActivePreset("my-mix");
    toast({ title: "My Mix saved ✓" });
  };

  return (
    <>
      {/* Active indicator */}
      <AnimatePresence>
        {activePreset === "my-mix" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-primary/80 pb-1"
          >
            <User className="w-3 h-3" />
            My Mix
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset pills */}
      <div className="flex gap-2">
        <button
          onClick={handleSleep}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.12em] rounded-full border transition-colors ${
            activePreset === "sleep"
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
          }`}
        >
          <Moon className="w-3 h-3" /> Recommended Mix
        </button>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleMyMix}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.12em] rounded-full border transition-colors ${
                  activePreset === "my-mix"
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                <User className="w-3 h-3" /> My Mix
                {!isPro && (
                  <span className="text-[9px] text-primary/70 ml-0.5">Pro</span>
                )}
              </button>
            </TooltipTrigger>
            {isPro && !hasMyMix() && (
              <TooltipContent side="bottom" className="text-xs max-w-[200px] text-center">
                Adjust your sliders then tap Save&nbsp;as&nbsp;My&nbsp;Mix.
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Save as My Mix link — shown after sliders via the SaveMyMixLink export */}
      {showUpgrade && (
        <UpgradePrompt
          requiredTier="tier1"
          featureName="My Mix"
          onDismiss={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
};

/** Separate tiny component for the "Save as My Mix" text link below sliders */
export const SaveMyMixLink = ({ onSave }: { onSave: () => void }) => {
  const { tier } = useTier();
  const isPro = PAYMENTS_DISABLED || tier === "tier1" || tier === "tier2";
  if (!isPro) return null;

  return (
    <button
      onClick={onSave}
      className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-primary/50 py-1"
    >
      <Save className="w-3 h-3 inline mr-1 -mt-px" />
      Save as My Mix
    </button>
  );
};

export default MixPresetBar;

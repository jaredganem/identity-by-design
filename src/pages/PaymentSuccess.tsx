import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NeuralNetwork from "@/components/SacredGeometry";
import { useTier } from "@/hooks/use-tier";
import { CheckCircle } from "lucide-react";

const tierCopy = {
  tier1: {
    label: "Pro",
    headline: "You're now Pro.",
    subtitle: "Your identity installation just got serious.",
  },
  tier2: {
    label: "Elite",
    headline: "You're now Elite.",
    subtitle: "The full installation is yours.",
  },
};

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useTier();
  const tierParam = searchParams.get("tier") as "tier1" | "tier2" | null;
  const copy = tierCopy[tierParam ?? "tier1"] ?? tierCopy.tier1;
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Refresh tier from database
    refresh();

    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => navigate("/"), 5000);
    const interval = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate, refresh]);

  return (
    <div className="min-h-screen bg-sacred relative overflow-hidden flex items-center justify-center">
      <NeuralNetwork />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center px-6 max-w-md mx-auto space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-16 h-16 text-primary mx-auto" strokeWidth={1.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-display">
            {copy.label} Unlocked
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-foreground">
            {copy.headline}
          </h1>
          <p className="text-muted-foreground text-sm normal-case tracking-normal">
            {copy.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="pt-4 space-y-3"
        >
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-[0.12em] shadow-glow hover:shadow-[0_0_60px_hsl(195_100%_29%/0.4)] transition-shadow duration-500"
          >
            Start Building
          </button>
          <p className="text-xs text-muted-foreground">
            Redirecting in {countdown}s...
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;

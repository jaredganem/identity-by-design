import { motion } from "framer-motion";

const SacredGeometry = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Outer ring */}
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-gold-dim/20 animate-spin-slow"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2 }}
    />
    {/* Inner ring */}
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-gold-dim/15"
      style={{ animationDirection: "reverse" }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2, delay: 0.3 }}
    />
    {/* Center glow */}
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full animate-pulse-slow"
      style={{ background: "radial-gradient(circle, hsl(42 78% 55% / 0.08), transparent)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, delay: 0.6 }}
    />
    {/* Ambient orbs */}
    <div
      className="absolute top-[20%] left-[15%] w-32 h-32 rounded-full animate-pulse-slow"
      style={{ background: "radial-gradient(circle, hsl(270 40% 30% / 0.15), transparent)" }}
    />
    <div
      className="absolute bottom-[25%] right-[10%] w-48 h-48 rounded-full animate-pulse-slow"
      style={{ background: "radial-gradient(circle, hsl(42 78% 55% / 0.06), transparent)", animationDelay: "2s" }}
    />
  </div>
);

export default SacredGeometry;
